import {
  createRoot,
  createObject,
  emptyString,
  parseTemplateEventArgs,
  ourEval,
  findModelAttr,
  parsePipe,
  toArray
} from "./utils/util";

import { observable, autorun, action } from "mobx";

import {
  attrStartExp,
  attrEndExp,
  eventStartExp,
  eventEndExp
} from "./utils/exp";
import { BindingIfBuilder } from "./classes/binding-if-builder";
import { BindingForBuilder } from "./classes/binding-for-builder";
import { BindingTextBuilder } from "./classes/binding-text-builder";
import {
  eventp,
  objectp,
  boolStringp,
  attrp,
  elementNodep,
  textNodep,
  inputp,
  textareap,
  checkboxp,
  radiop,
  selectp
} from "./utils/p";
import { BindingModelBuilder } from "./classes/binding-model-builder";
import { ajaPipes, usePipes } from "./pipes/pipes";
import {
  EventType,
  strString,
  modelDirective,
  templateEvent,
  modelChangeEvent
} from "./utils/const-string";
import { Options } from "./interfaces/interfaces";
import { BindingTempvarBuilder } from "./classes/binding-tempvar-builder";

const l = console.log;

class Aja {
  $store!: any;

  $actions: any;

  constructor(view?: string | HTMLElement, options?: Options) {
    if (!options || !view) return;
    const root = createRoot(view);
    if (root === null) return;
    if (options.pipes) Object.assign(ajaPipes, options.pipes);
    this._proxyState(options);
    if (options.initState) options.initState.call(this.$store);
    this._define(root, this.$store);
  }

  /**
   * 扫描绑定
   * @param root
   */
  private _define(root: HTMLElement, state: any): void {
    // 优先解析模板引用变量
    BindingTempvarBuilder.deepParse(root);

    let depath = true;
    // 没有attrs就不解析了
    if (root.attributes && root.attributes.length) {
      // 优先解析if -> for -> 其它属性
      depath = this._parseBindIf(root, state);
      if (depath) depath = this._parseBindFor(root, state);
      if (depath) {
        const attrs: Attr[] = toArray(root.attributes);
        this._parseBindAttrs(root, attrs, state);
      }
    }

    const children = toArray(root.childNodes);
    if (depath && children.length) {
      this._bindingChildrenAttrs(children, state);
    }
  }

  /**
   * * 解析指定HTMLElement的属性
   * @param node
   * @param state
   */
  private _parseBindAttrs(node: HTMLElement, attrs: Attr[], state: any) {
    for (const attr of attrs) {
      const { name } = attr;

      // [title]='xxx'
      if (attrp(name)) {
        this._attrBindHandle(node, attr, state);
        continue;
      }

      // (click)="echo('hello',$event)"
      if (eventp(name)) {
        this._eventBindHandle(node, attr, state);
        continue;
      }
    }

    // 其它属性解析完，在解析双向绑定
    const modelAttr = findModelAttr(node, modelDirective);
    if (modelAttr) {
      const model = new BindingModelBuilder(node, modelAttr);
      const { value } = modelAttr;
      if (inputp(node) || textareap(node)) {
        if (model.checkbox && checkboxp(model.checkbox)) {
          const data = this._getData(value, state);
          autorun(() => {
            model.checkboxSetup(data);
          });

          model.checkboxChangeListener(data, newValue => {
            this._setDate(value, newValue, state);
          });
        } else if (model.radio && radiop(model.radio)) {
          // 单选按钮
          autorun(() => {
            model.radioSetup(this._getData(value, state));
          });

          model.radioChangeListener(newValue => {
            this._setDate(value, newValue, state);
          });
        } else {
          // 其它
          autorun(() => {
            model.inputSetup(this._getData(value, state));
          });
          model.inputChangeListener(newValue => {
            this._setDate(value, newValue, state);
          });
        }
      } else if (selectp(node)) {
        setTimeout(() => {
          autorun(() => {
            model.selectSetup(this._getData(value, state));
          });
        });
        model.selectChangeListener(newValue => {
          this._setDate(value, newValue, state);
        });
      }
    }
  }

  private _proxyState(options: Options): void {
    const state = createObject<any>(options.state);
    this.$actions = createObject<any>(options.actions);

    const bounds: { [k: string]: any } = {};
    Object.keys(this.$actions).forEach(ac => (bounds[ac] = action.bound));
    this.$store = observable(Object.assign(state, this.$actions), bounds, {
      deep: true
    });
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
  private _getData(key: string, state: any): any {
    if (typeof key !== strString) return null;
    // 抽掉所有空格，再把管道排除
    const [bindKey, pipeList] = parsePipe(key);
    // 在解析绑定的变量
    const bindKeys = bindKey.split(".");
    let _result: any;
    const firstKey = bindKeys[0];

    // 模板变量
    if (BindingTempvarBuilder.has(firstKey)) {
      // 绑定的模板变量，全是小写
      const lowerKeys = bindKeys.map(k => k.toLowerCase());
      for (const k of lowerKeys) {
        _result = _result ? _result[k] : BindingTempvarBuilder.get(k);
      }
    }

    // state
    if (_result === undefined) {
      if (firstKey in state) {
        for (const k of bindKeys) {
          _result = _result ? _result[k] : state[k];
        }
      }
    }

    // this.$store
    if (_result === undefined && state !== this.$store) {
      if (firstKey in this.$store) {
        for (const k of bindKeys) {
          _result = _result ? _result[k] : this.$store[k];
        }
      }
    }

    if (_result === undefined) {
      // 没救了， eval随便解析返回个值吧!
      _result = this._parseJsString(bindKey, state);
    }

    return _result;
  }

  /**
   * 设置新数据，现在暂时在双向绑定的时候使用新数据, 数据来源于state
   * @param key
   * @param newValue
   * @param state
   */
  private _setDate(key: string, newValue: any, state: any) {
    if (typeof key !== strString) return null;
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
    state: any,
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
   * @param event
   * @param state
   * @param isModel 是否为展开的双向绑定事件  [(model)]="name" (modelChange)="nameChange($event)"
   */
  private _parseArgsToArguments(args: string[], event: any, state: any) {
    return args.map(arg => {
      if (!arg) return arg;
      let el = arg.trim();
      if (el === templateEvent) return event;
      return this._getData(el, state);
    });
  }

  /**
   * 解析一个节点上是否绑定了:if指令, 更具指令的值来解析节点
   * @param node
   * @param attrs
   */
  private _parseBindIf(node: HTMLElement, state: any): boolean {
    let show = true;
    const ifBuilder = new BindingIfBuilder(node);
    if (ifBuilder.ifAttr) {
      if (boolStringp(ifBuilder.value)) {
        show = ifBuilder.value === "true";
        ifBuilder.checked(show, () => {
          this._define(node, state);
        });
      } else {
        const [bindKey, pipeList] = parsePipe(ifBuilder.value);
        autorun(() => {
          show = this._getData(bindKey, state);
          show = usePipes(show, pipeList, key => this._getData(key, state));
          ifBuilder.checked(show, () => {
            this._define(node, state);
          });
        });
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
  private _parseBindFor(node: HTMLElement, state: any): boolean {
    const forBuilder = new BindingForBuilder(node);
    if (forBuilder.hasForAttr) {
      if (forBuilder.isNumberData) {
        let _data = +(forBuilder.bindData as string);
        _data = usePipes(_data, forBuilder.pipes, key =>
          this._getData(key, state)
        );

        for (let v = 0; v < _data; v++) {
          const forState = forBuilder.createForContextState(v);
          const item = forBuilder.createItem();
          this._define(item as HTMLElement, forState);
        }
        forBuilder.draw(_data);
      } else {
        const _that = this;
        autorun(() => {
          let _data = this._getData(forBuilder.bindData as string, state);
          _data = usePipes(_data, forBuilder.pipes, key =>
            this._getData(key, state)
          );
          forBuilder.clear();
          for (const k in _data) {
            const forState = forBuilder.createForContextState(
              k,
              _data[k],
              false
            );
            const item = forBuilder.createItem();
            _that._define(item as HTMLElement, forState);
          }
          forBuilder.draw(_data);
        });
      }
    }
    return !forBuilder.hasForAttr;
  }

  /**
   * 处理 [title]='xxx' 解析
   * @param node
   * @param param1
   */
  private _attrBindHandle(
    node: HTMLElement,
    { name, value }: Attr,
    state: any
  ): void {
    // [style.coloe] => [style, coloe]
    let [attrName, attrChild] = name
      .replace(attrStartExp, emptyString)
      .replace(attrEndExp, emptyString)
      .split(".");
    const [bindKey, pipeList] = parsePipe(value);
    autorun(() => {
      let data = this._getData(bindKey, state);
      data = usePipes(data, pipeList, arg => this._getData(arg, state));

      let _value = data;
      switch (attrName) {
        case "style":
          if (attrChild && attrChild in node.style) {
            (node.style as { [k: string]: any })[attrChild] = data;
          } else {
            const styles: CSSStyleDeclaration = data;
            for (const key in styles) {
              if (Object.getOwnPropertyDescriptor(node.style, key)) {
                node.style[key] = styles[key];
              }
            }
          }
          break;
        case "class":
          if (_value === null) _value = emptyString;
          if (!attrChild) {
            if (objectp(_value)) {
              for (const klass in _value) {
                if (_value[klass]) node.classList.add(klass);
                else node.classList.remove(klass);
              }
            } else {
              node.setAttribute(attrName, _value);
            }
          } else {
            if (_value) node.classList.add(attrChild);
          }
          break;
        case "html":
          if (data !== node.innerHTML) node.innerHTML = data;
          break;

        default:
          if (_value === null) _value = emptyString;
          if (_value) {
            if (node.getAttribute(attrName) !== _value) {
              node.setAttribute(attrName, _value);
            }
          } else {
            if (node.hasAttribute(attrName)) node.removeAttribute(attrName);
          }
          break;
      }
    });
    node.removeAttribute(name);
  }

  /**
   * 处理 (click)="echo('hello',$event)" 解析
   * @param node
   * @param param1
   */
  private _eventBindHandle(
    node: HTMLElement,
    { name, value }: Attr,
    state: any
  ): void {
    let type: string = name
      .replace(eventStartExp, emptyString)
      .replace(eventEndExp, emptyString);
    // 函数名
    let funcName: string = value;
    // 函数参数
    let args: string[] = [];
    if (value.includes("(")) {
      // 带参数的函数
      const index = value.indexOf("(");
      // 砍出函数名
      funcName = value.substr(0, index);
      args = parseTemplateEventArgs(value);
    }
    const modelChangep: boolean = name === modelChangeEvent;
    if (modelChangep) type = EventType.input;
    if (this.$actions && funcName in this.$actions) {
      node.addEventListener(type, e => {
        this.$actions[funcName].apply(
          this.$store,
          this._parseArgsToArguments(
            args,
            modelChangep ? (e.target as HTMLInputElement).value : e,
            state
          )
        );
      });
    }

    node.removeAttribute(name);
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
  private _bindingChildrenAttrs(children: ChildNode[], state: any): any {
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
   * @param textNode
   * @param state
   */
  private _setTextContent(textNode: ChildNode, state: any): void {
    const textBuilder = new BindingTextBuilder(textNode);
    autorun(() => {
      textBuilder.setText(key => this._getData(key, state));
    });
  }
}

export default Aja;
