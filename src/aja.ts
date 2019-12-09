import _ from "lodash";

import {
  attrp,
  eventp,
  tempvarp,
  createRoot,
  createIfCommentData,
  createObject,
  emptyString,
  isNumber,
  isTemplateString,
  parseTemplateEventArgs,
  isTemplateEmptyString,
  isBoolString,
  ifp,
  forp,
  createForCommentData
} from "./utils/util";
import { Store, autorun, State, Actions, Computeds } from "./store";
import {
  interpolationExpressionExp,
  spaceExp,
  firstWithExclamationMarkExp,
  attrStartExp,
  attrEndExp,
  eventStartExp,
  eventEndExp,
  tempvarExp,
  firstAllValue,
  endAllValue
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
    this._define(root);
  }

  /**
   * 扫描绑定
   * @param root
   * @param contextState
   */
  private _define(root: HTMLElement, contextState: State | null = null): void {
    const state: State = contextState ? contextState : this.$store;
    const children = Array.from(root.childNodes);
    for (let index = 0; index < children.length; index++) {
      const childNode: ChildNode = children[index];

      // dom节点
      if (
        childNode.nodeType === Node.ELEMENT_NODE ||
        childNode.nodeType === Node.DOCUMENT_FRAGMENT_NODE
      ) {
        const htmlElement: HTMLElement = childNode as HTMLElement;

        // :if权限最大
        const attrs: Attr[] = Array.from(htmlElement.attributes);
        let depath = this._ifBindHandle(htmlElement, attrs, state);
        if (!depath) continue;

        // 遍历节点属性
        for (const attr of attrs) {
          const { name, value } = attr;
          // [title]='xxx'
          if (attrp(name)) {
            this._attrBindHandle(htmlElement, attr, state);
            continue;
          }

          // #input #username
          if (tempvarp(name)) {
            this._tempvarBindHandle(htmlElement, attr);
            continue;
          }

          // for
          if (forp(name, this._forInstruction)) {
            // 解析for指令的值
            let [varb, data] = value.split(/\bin\b/).map(s => s.trim());
            if (!varb) return;

            // 创建注释节点
            const commentElement = document.createComment("");
            htmlElement.replaceWith(commentElement);
            htmlElement.removeAttribute(this._forInstruction);
            const fragment = document.createDocumentFragment();
            let _data;
            if (isNumber(data)) {
              _data = +data;
              for (let _v = 0; _v < _data; _v++) {
                const state2 = {};
                const item = htmlElement.cloneNode(true);
                fragment.append(item);
                Object.defineProperty(state2, varb, {
                  get() {
                    return _v;
                  }
                });
                this._define(item as HTMLElement, state2);
              }
            } else {
              const _varb: string[] = varb
                .trim()
                .replace(eventStartExp, emptyString)
                .replace(eventEndExp, emptyString)
                .split(",")
                .map(v => v.trim());
              _data = this._getData(data, state);
              const _that = this;
              for (const _k in _data) {
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
                this._define(item as HTMLElement, forState);
              }
            }

            commentElement.after(fragment);
            commentElement.data = createForCommentData(_data);
            continue;
          }

          // (click)="echo('hello',$event)"
          if (eventp(name)) {
            this._eventBindHandle(htmlElement, attr, state);
            continue;
          }
        }
        // 递归遍历
        // if (Array.from(childNode.childNodes).length) {
        this._define(htmlElement);
        // }
      } else if (childNode.nodeType === Node.TEXT_NODE) {
        // 插值表达式 {{ name }} {{ obj.age }}
        if (childNode.textContent) {
          // 文本保函插值表达式的
          if (!interpolationExpressionExp.test(childNode.textContent)) continue;
          const _initTextContent = childNode.textContent;
          autorun(() => {
            const text = _initTextContent.replace(
              interpolationExpressionExp,
              (...args) => {
                var key = args[1].replace(spaceExp, emptyString);
                return this._getData(key, state);
              }
            );

            childNode.textContent = text;
          });
        }
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
   * ? 有限找模板变量的数据，再找state
   * @param key
   * @param state
   */
  private _getData(key: string, state: State): any {
    if (typeof key !== "string") return null;
    const keys = key.split(".");
    let _result: any;

    // 模板变量
    if (keys[0] in this._templateVariables) {
      for (const k of keys) {
        _result = _result ? _result[k] : this._templateVariables[k];
      }
    }

    // state
    if (_result === undefined) {
      for (const k of keys) {
        _result = _result ? _result[k] : state[k];
      }
    }

    // this.$store
    if (_result === undefined && state !== this.$store) {
      for (const k of keys) {
        _result = _result ? _result[k] : this.$store[k];
      }
    }

    // 避免返回 undefined 的字符串
    if (_result === undefined) _result = emptyString;
    return _result;
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
      if (isNumber(el)) return +arg;
      if (isTemplateEmptyString(el)) return arg;
      if (isTemplateString(el)) {
        return el
          .replace(firstAllValue, emptyString)
          .replace(endAllValue, emptyString)
          .toString();
      }
      const data = this._getData(el, state);
      return data ? data : eval(el);
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
        const match = value.match(firstWithExclamationMarkExp)![0]; // :if="!show"
        if (match) {
          // 砍掉! !true -> true
          value = value.replace(firstWithExclamationMarkExp, emptyString);
        }
        let show = true;
        if (isBoolString(value)) {
          show = value === "true";
        } else {
          show = this._getData(value, state);
        }
        if (match) {
          show = eval(`${match}${show}`);
        }
        if (show) {
          commentElement.after(htmlElement);
          depath = true;
          if (Array.from(htmlElement.childNodes).length) {
            this._define(htmlElement);
          }
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
          // 过滤掉无效的style
          if (
            Object.getOwnPropertyDescriptor(htmlElement.style, key) &&
            styles[key]
          ) {
            htmlElement.style[key] = styles[key];
          }
        }
      } else {
        htmlElement.setAttribute(attrName, this._getData(value, state)); // 属性扫描绑定
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
}

export default Aja;
