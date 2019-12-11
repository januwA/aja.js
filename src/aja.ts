import {
  attrp,
  eventp,
  tempvarp,
  createRoot,
  createIfCommentData,
  createObject,
  emptyString,
  isNumber,
  parseTemplateEventArgs,
  isBoolString,
  ifp,
  createForCommentData,
  ourEval,
  modelp,
  escapeRegExp,
  elementNodep,
  textNodep
} from "./utils/util";
import { Store, autorun, State, Actions, Computeds } from "./store";
import {
  interpolationExpressionExp,
  spaceExp,
  attrStartExp,
  attrEndExp,
  eventStartExp,
  eventEndExp,
  tempvarExp
} from "./utils/exp";

export interface Options {
  state?: State;
  actions?: Actions;
  computeds?: Computeds;
  instructionPrefix?: string;
  templateEvent?: string;
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

  constructor(view: string | HTMLElement, options: Options) {
    const root = createRoot(view);
    if (root === null) return;
    if (options.instructionPrefix)
      this._instructionPrefix = options.instructionPrefix;
    if (options.templateEvent) this._templateEvent = options.templateEvent;
    this._proxyState(options);
    this._define(root, this.$store);
  }

  /**
   * 扫描绑定
   * @param root
   */
  private _define(root: HTMLElement, state: State): void {
    const depath = this._bindingAttrs(root, state);
    if (depath) this._bindingChildrenAttrs(Array.from(root.childNodes), state);
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
   */
  private _parseArgsToArguments(args: string[], e: Event, state: State) {
    return args.map(arg => {
      if (!arg) return arg;
      let el = arg.trim();
      if (el === this._templateEvent) return e;
      return this._getData(el, state);
    });
  }

  /**
   * 处理 :if 解析
   * @param htmlElement
   * @param attrs
   */
  private _ifBindHandle(
    htmlElement: HTMLElement,
    attrs: Attr[],
    state: State
  ): boolean {
    let depath = true;

    // 是否有 :if 指令
    let ifAttr = attrs.find(({ name }) => ifp(name, this._ifInstruction));
    if (ifAttr) {
      // 创建注释节点做标记
      const commentElement = document.createComment("");

      // 将注释节点插入到节点上面
      htmlElement.before(commentElement);
      autorun(() => {
        let value = ifAttr!.value.trim();
        let show = true;
        if (isBoolString(value)) {
          show = value === "true";
        } else {
          show = this._getData(value, state);
        }
        if (show) {
          commentElement.after(htmlElement);
          depath = true;
        } else {
          htmlElement.replaceWith(commentElement);
          depath = false;
        }
        commentElement.data = createIfCommentData(show);
      });
      htmlElement.removeAttribute(this._ifInstruction);
    }
    return depath;
  }

  private _forBindHandle(
    htmlElement: HTMLElement,
    attrs: Attr[],
    state: State
  ): boolean {
    let depath = true;
    // 是否有 :for 指令
    let forAttr = attrs.find(({ name }) => ifp(name, this._forInstruction));
    if (forAttr) {
      depath = false;
      const { name, value } = forAttr;
      // 解析for指令的值
      let [varb, data] = value.split(/\bin\b/).map(s => s.trim());
      if (!varb) return depath;

      // 创建注释节点
      const commentElement = document.createComment("");
      htmlElement.replaceWith(commentElement);
      htmlElement.removeAttribute(this._forInstruction);
      const fragment = document.createDocumentFragment();
      if (isNumber(data)) {
        const _data = +data;
        for (let _v = 0; _v < _data; _v++) {
          const forState = {};
          Object.defineProperty(forState, varb, {
            get() {
              return _v;
            }
          });
          const item = htmlElement.cloneNode(true);
          fragment.append(item);
          this._define(item as HTMLElement, forState);
        }
        // 创建完添加到节点
        commentElement.after(fragment);
      } else {
        const _varb: string[] = varb
          .trim()
          .replace(eventStartExp, emptyString)
          .replace(eventEndExp, emptyString)
          .split(",")
          .map(v => v.trim());
        const _data = this._getData(data, state);
        const _that = this;

        // 记录for生成的items，下次更新将全部删除
        const forBuffer: Node[] = [];
        // 不要直接 in _data, 原型函数能被枚举
        autorun(() => {
          for (const forItem of forBuffer) {
            (forItem as HTMLElement).remove();
          }
          const _keys = Object.keys(_data);
          for (const _k in _keys) {
            const forState = {};
            Object.defineProperties(forState, {
              [_varb[0]]: {
                get() {
                  return _k;
                }
              },
              [_varb[1]]: {
                get() {
                  return _that._getData(data, state)[_k];
                }
              }
            });
            const item = this._cloneNode(htmlElement, forState);
            fragment.append(item);
            forBuffer.push(item);
            this._define(item as HTMLElement, forState);
          }
          commentElement.after(fragment);
        });
      }
      commentElement.data = createForCommentData(data);
    }
    return depath;
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
    let attrName = name
      .replace(attrStartExp, emptyString)
      .replace(attrEndExp, emptyString);
    autorun(() => {
      if (attrName === "style") {
        const styles: CSSStyleDeclaration = this._getData(value, state);
        for (const key in styles) {
          // 过滤掉无效的style, 和空值
          if (
            Object.getOwnPropertyDescriptor(htmlElement.style, key) &&
            styles[key]
          ) {
            htmlElement.style[key] = styles[key];
          }
        }
      } else if (attrName === "innerhtml") {
        htmlElement.innerHTML = this._getData(value, state);
      } else {
        let _value = this._getData(value, state);
        if (_value === null) _value = emptyString;
        htmlElement.setAttribute(attrName, _value);
      }
    });
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
    const eventName = name
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

    htmlElement.addEventListener(eventName, e => {
      //? 每次点击都需解析参数?
      //! 如果只解析一次，那么模板变量需要提前声明, 并且模板变量不会更新!
      if (this.$actions && funcName in this.$actions) {
        this.$actions[funcName].apply(
          this.$store,
          this._parseArgsToArguments(args, e, state)
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
   * * 解析指定HTMLElement的属性
   * @param htmlElement
   * @param state
   */
  private _bindingAttrs(htmlElement: HTMLElement, state: State): boolean {
    let depath = true;

    const attrs: Attr[] = Array.from(htmlElement.attributes);
    if (!attrs.length) return depath;

    // :if
    depath = this._ifBindHandle(htmlElement, attrs, state);

    // :for
    depath = this._forBindHandle(htmlElement, attrs, state);
    if (!depath) return depath;
    // 遍历节点属性
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
      if (modelp(name)) {
        const inputElement = htmlElement as HTMLInputElement;
        autorun(() => {
          inputElement.value = `${this._getData(value, state)}`;
        });
        inputElement.addEventListener("input", () => {
          this._setDate(value, inputElement.value, state);
        });

        inputElement.removeAttribute(name);
      }
    }
    return depath;
  }

  /**
   * * 循环解析子节点
   * @param childNodes
   * @param state
   */
  private _bindingChildrenAttrs(children: ChildNode[], state: State): any {
    if (!children.length) return null;
    const childNode: ChildNode = children[0];
    // dom节点
    if (elementNodep(childNode)) {
      this._define(childNode as HTMLElement, state);
    }
    if (textNodep(childNode)) {
      this._setTextContent(childNode, state);
    }
    return this._bindingChildrenAttrs(children.slice(1), state);
  }

  /**
   * * 解析文本节点的插值表达式
   * @param childNode
   * @param state
   */
  private _setTextContent(childNode: ChildNode, state: State): void {
    // 创建一个变量保存源文本
    let _initTextContent = childNode.textContent || emptyString;

    // 文本不包含插值表达式的，那么就跳过
    if (!interpolationExpressionExp.test(_initTextContent)) return;
    autorun(() => {
      childNode.textContent = _initTextContent.replace(
        interpolationExpressionExp,
        (match, g1) => {
          // 获取插值表达式里面的文本 {{name}} -> name
          const key = g1.replace(spaceExp, emptyString);

          let _data = this._getData(key, state);
          // 如果返回null字符，不好看
          // hello null :(
          // hello      :)
          if (_data === null) return emptyString;
          return _data;
        }
      );
    });
  }
}

export default Aja;
