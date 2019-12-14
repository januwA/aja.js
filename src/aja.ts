import {
  attrp,
  eventp,
  tempvarp,
  createRoot,
  createObject,
  emptyString,
  parseTemplateEventArgs,
  boolStringp,
  ourEval,
  modelp,
  elementNodep,
  textNodep,
  arrayp,
  getCheckBoxValue,
  objectp,
  escapeRegExp,
  isNumber
} from "./utils/util";
import { Store, State, Actions, Computeds, reaction } from "./store";
import {
  attrStartExp,
  attrEndExp,
  eventStartExp,
  eventEndExp,
  tempvarExp
} from "./utils/exp";
import { BindingIfBuilder } from "./classes/binding-if-builder";
import { BindingForBuilder } from "./classes/binding-for-builder";
import { BindingTextBuilder } from "./classes/binding-text-builder";

export interface Pipe {
  (...value: any[]): any;
}

export interface Pipes {
  [pipeName: string]: Pipe;
}

export interface Options {
  state?: State;
  actions?: Actions;
  computeds?: Computeds;
  instructionPrefix?: string;
  templateEvent?: string;
  modeldirective?: string;
  initState?: Function;
  pipes?: Pipes;
}

const l = console.log;

class Aja {
  /**
   * * 模板变量保存的DOM
   */
  private _templateVariables: {
    [key: string]: ChildNode | Element | HTMLElement;
  } = {};

  /**
   * *  指令前缀
   * [:for] [:if]
   */
  private _instructionPrefix: string = ":";

  /**
   * <button (click)="setName($event)">click me</button>
   */
  private _templateEvent: string = "$event";

  /**
   * * 双向绑定指令
   */
  private _modeldirective: string = "[(model)]";

  /**
   * * :if
   */
  private get _ifInstruction(): string {
    return this._instructionPrefix + "if";
  }
  /**
   * * :for
   */
  private get _forInstruction(): string {
    return this._instructionPrefix + "for";
  }

  $store!: State;

  get $actions() {
    return this.$store.$actions;
  }

  private _pipes: Pipes = {
    /**
     * * 全部大写
     * @param value
     */
    uppercase(value: string) {
      return value.toUpperCase();
    },

    /**
     * * 全部小写
     * @param value
     */
    lowercase(value: string) {
      return value.toLowerCase();
    },
    /**
     * * 首字母小写
     * @param str
     */
    capitalize(str) {
      return str.charAt(0).toUpperCase() + str.substring(1);
    }
  };

  constructor(view: string | HTMLElement, options: Options) {
    const root = createRoot(view);
    if (root === null) return;
    if (options.instructionPrefix)
      this._instructionPrefix = options.instructionPrefix;
    if (options.templateEvent) this._templateEvent = options.templateEvent;
    if (options.modeldirective) this._modeldirective = options.modeldirective;
    if (options.pipes) this._pipes = Object.assign(this._pipes, options.pipes);
    this._proxyState(options);
    if (options.initState) options.initState.call(this.$store);
    this._define(root, this.$store);
  }

  /**
   * 扫描绑定
   * @param root
   */
  private _define(root: HTMLElement, state: State): void {
    let depath = true;

    // 没有attrs就不解析了
    if (root.attributes && root.attributes.length) {
      // 优先解析if -> for -> 其它属性
      depath = this._parseBindIf(root, state);
      if (depath) depath = this._parseBindFor(root, state);
      if (depath) {
        const attrs: Attr[] = Array.from(root.attributes);
        this._parseBindAttrs(root, attrs, state);
      }
    }

    const children = Array.from(root.childNodes);
    if (depath && children.length) {
      this._bindingChildrenAttrs(children, state);
    }
  }

  /**
   * * 解析指定HTMLElement的属性
   * @param htmlElement
   * @param state
   */
  private _parseBindAttrs(
    htmlElement: HTMLElement,
    attrs: Attr[],
    state: State
  ) {
    for (const attr of attrs) {
      const { name, value } = attr;
      // #input #username
      if (tempvarp(name)) {
        this._tempvarBindHandle(htmlElement, attr);
        continue;
      }

      // [title]='xxx'
      if (attrp(name)) {
        this._attrBindHandle(htmlElement, attr, state);
        continue;
      }

      // (click)="echo('hello',$event)"
      if (eventp(name)) {
        this._eventBindHandle(htmlElement, attr, state);
        continue;
      }

      // [(model)]="username"
      if (modelp(name, this._modeldirective)) {
        const nodeName: string = htmlElement.nodeName;
        if (nodeName === "INPUT" || nodeName === "TEXTAREA") {
          const inputElement = htmlElement as HTMLInputElement;
          // l(inputElement.type);
          if (inputElement.type === "checkbox") {
            const data = this._getData(value, state);
            // 这个时候的data如果是array, 就对value进行处理
            // 不然就当作bool值处理
            if (!arrayp(data)) {
              reaction(
                () => [this._getData(value, state)],
                states => {
                  inputElement.checked = !!states[0];
                }
              );
              inputElement.addEventListener("change", () => {
                this._setDate(value, inputElement.checked, state);
              });
            } else {
              reaction(
                () => [this._getData(value, state)],
                states => {
                  const data = states[0];
                  let ivalue: string | null = getCheckBoxValue(inputElement);
                  inputElement.checked = data.some((d: any) => d === ivalue);
                }
              );
              inputElement.addEventListener("change", () => {
                const data = this._getData(value, state);
                let ivalue: string | null = getCheckBoxValue(inputElement);
                if (inputElement.checked) {
                  data.push(ivalue);
                } else {
                  const newData = Store.list(
                    data.filter((d: any) => d !== ivalue)
                  );
                  this._setDate(value, newData, state);
                }
              });
            }
          } else if (inputElement.type === "radio") {
            // 单选按钮
            reaction(
              () => [this._getData(value, state)],
              states => {
                inputElement.checked = states[0] === inputElement.value;
              }
            );

            inputElement.addEventListener("change", () => {
              let newData = inputElement.value;
              if (newData === "on") newData = "";
              this._setDate(value, newData, state);
              inputElement.checked = true;
            });
          } else {
            // 其它
            reaction(
              () => [this._getData(value, state)],
              states => {
                inputElement.value = `${states[0]}`;
              }
            );
            inputElement.addEventListener("input", () => {
              this._setDate(value, inputElement.value, state);
            });
          }
        } else if (nodeName === "SELECT") {
          // 对比value
          const selectElement = htmlElement as HTMLSelectElement;
          // 稍微延迟下，因为内部的模板可能没有解析
          setTimeout(() => {
            reaction(
              () => [this._getData(value, state)],
              states => {
                const data = states[0];
                const selectOptions = Array.from(selectElement.options);
                let notFind = true;
                // 多选参数必须为 array
                if (selectElement.multiple && arrayp(data)) {
                  selectElement.selectedIndex = -1;
                  for (let index = 0; index < selectOptions.length; index++) {
                    const option = selectOptions[index];
                    const v = option.value;
                    if ((data as Array<any>).some(d => d === v)) {
                      notFind = false;
                      option.selected = true;
                    }
                  }
                } else {
                  // 没找到默认-1
                  const index = selectOptions.findIndex(
                    op => op.value === data
                  );
                  selectElement.selectedIndex = index;
                  notFind = false;
                }
                if (notFind) selectElement.selectedIndex = -1;
              }
            );
          });
          selectElement.addEventListener("change", () => {
            if (selectElement.multiple) {
              const multipleValue = Array.from(selectElement.options)
                .filter(op => op.selected)
                .map(op => op.value);
              this._setDate(value, multipleValue, state);
            } else {
              this._setDate(value, selectElement.value, state);
            }
          });
        }
        htmlElement.removeAttribute(name);
      }
    }
  }

  private _proxyState(options: Options): void {
    const state = createObject<State>(options.state);
    const computeds = createObject<Computeds>(options.computeds);
    const actions = createObject<Actions>(options.actions);

    this.$store = new Store({ state, computeds, actions });
  }

  /**
   * * 1. 优先寻找模板变量
   * * 2. 在传入的state中寻找
   * * 3. 在this.$store中找
   * * 'name' 'object.name'
   * ? 优先找模板变量的数据，再找state
   * ? 虽然返回的是any， 但是这个函数不会返回 undefined
   * @param key
   * @param state
   */
  private _getData(key: string, state: State): any {
    if (typeof key !== "string") return null;
    const keys = key.split(".");
    let _result: any;
    const firstKey = keys[0];
    // 模板变量
    //? 如果连第一个key都不存在，那么就别找了，找下去也会找错值
    if (firstKey in this._templateVariables) {
      for (const k of keys) {
        _result = _result ? _result[k] : this._templateVariables[k];
      }
    }

    // state
    if (_result === undefined) {
      if (firstKey in state) {
        for (const k of keys) {
          _result = _result ? _result[k] : state[k];
        }
      }
    }

    // this.$store
    if (_result === undefined && state !== this.$store) {
      if (firstKey in this.$store) {
        for (const k of keys) {
          _result = _result ? _result[k] : this.$store[k];
        }
      }
    }

    if (_result === undefined) {
      // 没救了， eval随便解析返回个值吧!
      _result = this._parseJsString(key, state);
    }

    return _result;
  }

  /**
   * 设置新数据，现在暂时在双向绑定的时候使用新数据, 数据来源于state
   * @param key
   * @param newValue
   * @param state
   */
  private _setDate(key: string, newValue: any, state: State) {
    if (typeof key !== "string") return null;
    const keys = key.split(".");
    const keysSize = keys.length;
    if (!keysSize) return;
    const firstKey = keys[0];
    let _result: any;
    if (keysSize === 1 && firstKey in state) {
      state[firstKey] = newValue;
      return;
    }
    for (let index = 0; index < keysSize - 1; index++) {
      const k = keys[index];
      _result = _result ? _result[k] : state[k];
    }

    if (_result) {
      const lastKey = keys[keysSize - 1];
      _result[lastKey] = newValue;
      return;
    }
    this._parseJsString(key, state, true, newValue);
  }

  /**
   * 解析一些奇怪的插值表达式
   * {{ el['age'] }}
   * :for="(i, el) in arr" (click)="foo( 'xxx-' + el.name  )"
   * @param key
   * @param state
   * @param setState
   */
  private _parseJsString(
    key: string,
    state: State,
    setState: boolean = false,
    newValue: any = ""
  ) {
    try {
      return ourEval(`return ${key}`);
    } catch (er) {
      // 利用错误来抓取变量
      const msg: string = er.message;
      if (msg.includes("is not defined")) {
        const match = msg.match(/(.*) is not defined/);
        if (!match) return emptyString;
        const varName = match[1];
        const context = this._getData(varName, state);
        if (setState) {
          const funBody =
            key.replace(new RegExp(`\\b${varName}`, "g"), "this") +
            `='${newValue}'`;
          ourEval.call(context, `${funBody}`);
        } else {
          const funBody = key.replace(new RegExp(`\\b${varName}`, "g"), "this");
          let _result = ourEval.call(context, `return ${funBody}`);
          if (_result === undefined) _result = emptyString;
          return _result;
        }
      } else {
        console.error(er);
        throw er;
      }
    }
  }

  /**
   * ['obj.age', 12, false, '"   "', alert('xxx')] -> [22, 12, false, "   ", eval(<other>)]
   * @param args
   * @param e
   * @param state
   * @param isModel 是否为展开的双向绑定事件  [(model)]="name" (modelChange)="nameChange($event)"
   */
  private _parseArgsToArguments(
    args: string[],
    e: Event,
    state: State,
    isModel = false
  ) {
    return args.map(arg => {
      if (!arg) return arg;
      let el = arg.trim();
      if (el === this._templateEvent) {
        let _result;
        if (isModel) {
          if (e.target) {
            _result = (e.target as HTMLInputElement).value;
          }
        } else {
          _result = e;
        }
        return _result;
      }
      return this._getData(el, state);
    });
  }

  /**
   * 解析一个节点上是否绑定了:if指令, 并更具指令的值来解析节点
   * @param node
   * @param attrs
   */
  private _parseBindIf(node: HTMLElement, state: State): boolean {
    let show = true;
    const bifb = new BindingIfBuilder(node, this._ifInstruction);
    if (bifb.hasIfAttr) {
      const value = bifb.value as string;
      if (boolStringp(value)) {
        show = value === "true";
        bifb.checked(show);
      } else {
        reaction(
          () => [this._getData(value, state)],
          states => {
            show = states[0];
            bifb.checked(show);
          }
        );
      }
    }
    return show;
  }

  /**
   * 解析节点上绑定的for指令
   * 如果节点绑定了for指令，这个节点将不会继续被解析
   * @param node
   * @param state
   */
  private _parseBindFor(node: HTMLElement, state: State): boolean {
    const bforb = new BindingForBuilder(node, this._forInstruction);
    if (bforb.hasForAttr) {
      // 创建注释节点
      if (bforb.isNumberData) {
        const _data = +(bforb.bindData as string);
        for (let v = 0; v < _data; v++) {
          const forState = bforb.createForContextState(v);
          const item = bforb.createItem();
          this._define(item as HTMLElement, forState);
        }
        bforb.draw(_data);
      } else {
        const _that = this;
        reaction(
          () => [this._getData(bforb.bindData as string, state)],
          states => {
            const _data = states[0];
            bforb.clear();
            let keys;
            if (arrayp(_data)) keys = Object.keys(_data);
            else keys = _data;
            for (const k in keys) {
              const forState = bforb.createForContextState(k, _data[k], false);
              const item = bforb.createItem();
              _that._define(item as HTMLElement, forState);
            }
            bforb.draw(_data);
          }
        );
      }
    }
    return !bforb.hasForAttr;
  }

  /**
   * 处理 [title]='xxx' 解析
   * @param htmlElement
   * @param param1
   */
  private _attrBindHandle(
    htmlElement: HTMLElement,
    { name, value }: Attr,
    state: State
  ): void {
    let [attrName, attrChild] = name
      .replace(attrStartExp, emptyString)
      .replace(attrEndExp, emptyString)
      .split(".");
    reaction(
      () => [this._getData(value, state)],
      states => {
        const data = states[0];
        if (attrName === "style") {
          if (attrChild && attrChild in htmlElement.style) {
            (htmlElement.style as { [k: string]: any })[attrChild] = data;
          } else {
            const styles: CSSStyleDeclaration = data;
            for (const key in styles) {
              if (
                Object.getOwnPropertyDescriptor(htmlElement.style, key) &&
                styles[key]
              ) {
                reaction(
                  () => [styles[key]],
                  states => {
                    htmlElement.style[key] = states[0];
                  }
                );
              }
            }
          }
        } else if (attrName === "class") {
          let _value = data;
          if (_value === null) _value = emptyString;
          if (!attrChild) {
            if (objectp(_value)) {
              for (const klass in _value) {
                reaction(
                  () => [_value[klass]],
                  states => {
                    if (states[0]) {
                      htmlElement.classList.add(klass);
                    } else {
                      htmlElement.classList.remove(klass);
                    }
                  }
                );
              }
            } else {
              htmlElement.setAttribute(attrName, _value);
            }
          } else {
            if (_value) {
              htmlElement.classList.add(attrChild);
            }
          }
        } else if (attrName === "innerhtml") {
          htmlElement.innerHTML = data;
        } else {
          let _value = data;
          if (_value === null) _value = emptyString;
          htmlElement.setAttribute(attrName, _value);
        }
      }
    );
    htmlElement.removeAttribute(name);
  }

  /**
   * 处理 (click)="echo('hello',$event)" 解析
   * @param htmlElement
   * @param param1
   */
  private _eventBindHandle(
    htmlElement: HTMLElement,
    { name, value }: Attr,
    state: State
  ): void {
    let eventName = name
      .replace(eventStartExp, emptyString)
      .replace(eventEndExp, emptyString);
    // 函数名
    let funcName: string = value;
    // 函数参数
    let args: string[] = [];
    if (value.includes("(")) {
      // 带参数的函数
      const index = value.indexOf("(");
      funcName = value.substr(0, index);
      args = parseTemplateEventArgs(value);
    }
    const modelChangep: boolean = eventName === "modelchange";
    if (modelChangep) eventName = "input";
    htmlElement.addEventListener(eventName, e => {
      //? 每次点击都需解析参数?
      //! 如果只解析一次，那么模板变量需要提前声明, 并且模板变量不会更新!
      if (this.$actions && funcName in this.$actions) {
        this.$actions[funcName].apply(
          this.$store,
          this._parseArgsToArguments(args, e, state, modelChangep)
        );
      }
    });
    htmlElement.removeAttribute(name);
  }

  /**
   * * 处理模板变量 #input 解析
   * @param htmlElement
   * @param param1
   */
  private _tempvarBindHandle(htmlElement: HTMLElement, { name }: Attr): void {
    this._templateVariables[
      name.replace(tempvarExp, emptyString)
    ] = htmlElement;
    htmlElement.removeAttribute(name);
  }

  /**
   * * 克隆DOM节点，默认深度克隆，绑定模板事件
   * @param htmlElement
   * @param forState
   * @param deep
   */
  private _cloneNode(
    htmlElement: HTMLElement,
    forState: Object,
    deep: boolean = true
  ): Node {
    const item = htmlElement.cloneNode(deep);
    const forElementAttrs = Array.from(htmlElement.attributes);
    const eventAttrs = forElementAttrs.filter(e => eventp(e.name));
    if (eventAttrs.length) {
      for (const eventAttr of eventAttrs) {
        this._eventBindHandle(item as HTMLElement, eventAttr, forState);
      }
    }
    return item;
  }

  /**
   * * 递归解析子节点
   * @param childNodes
   * @param state
   */
  private _bindingChildrenAttrs(children: ChildNode[], state: State): any {
    if (!children.length) return;
    let node: ChildNode = children[0];
    if (elementNodep(node)) {
      this._define(node as HTMLElement, state);
    }
    if (textNodep(node)) {
      this._setTextContent(node, state);
    }
    return this._bindingChildrenAttrs(children.slice(1), state);
  }

  /**
   * * 解析文本节点的插值表达式
   * @param childNode
   * @param state
   */
  private _setTextContent(childNode: ChildNode, state: State): void {
    const btextb = new BindingTextBuilder(childNode);
    if (!btextb.needParse) return;
    reaction(
      () => btextb.bindVariables!.map(k => this._getData(k[0], state)),
      (states: any[]) => {
        childNode.textContent = this._parseBindingTextContent(
          btextb,
          states,
          state
        );
      }
    );
  }

  /**
   * * 解析文本的表达式
   *
   * @param textContent  "{{ age }} - {{ a }} = {{ a }}""
   * @param states [12, "x", "x"]
   * @returns "12 - x = x"
   */
  private _parseBindingTextContent(
    btextb: BindingTextBuilder,
    states: any[],
    contextState: State
  ): string {
    if (btextb.matchs.length !== states.length)
      return "[[aja.js: 框架意外的解析错误!!!]]";
    let result = btextb.text;
    for (let index = 0; index < btextb.matchs.length; index++) {
      const m = btextb.matchs[index];
      const pipes = btextb.bindVariables[index].slice(1);
      let state = states[index];
      if (pipes.length) {
        pipes.forEach(pipe => {
          const [p, ...pipeArgs] = pipe.split(":");
          if (p in this._pipes) {
            const parsePipeArgs = pipeArgs.map(arg => {
              if (isNumber(arg)) return arg;
              return this._getData(arg, contextState);
            });
            state = this._pipes[p](state, ...parsePipeArgs);
          }
        });
      }
      if (state === null) state = "";
      state =
        typeof state === "string" ? state : JSON.stringify(state, null, " ");
      result = result.replace(new RegExp(escapeRegExp(m), "g"), state);
    }
    return result;
  }
}

export default Aja;
