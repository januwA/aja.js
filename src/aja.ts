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
  isTemplateEmptyString
} from "./utils/util";
import { Store, autorun } from "./store";

/**
 * state 对象
 */
export interface State {
  [key: string]: any;
}

/**
 * 事件函数对象
 */
export interface Actions {
  [key: string]: any;
}

/**
 * 计算函数
 */
export interface Computeds {
  [key: string]: Function;
}

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

  $store!: Store;

  constructor(view: string | HTMLElement, options: Options) {
    const root = createRoot(view);
    if (root === null) return;
    if (options.instructionPrefix)
      this._instructionPrefix = options.instructionPrefix;
    if (options.templateEvent) this._templateEvent = options.templateEvent;
    this._proxyState(options);
    this._define(root, this.$store);
  }

  private _define(root: HTMLElement, state: State): void {
    const children = Array.from(root.childNodes);
    for (let index = 0; index < children.length; index++) {
      const childNode = children[index];

      // dom节点
      if (
        childNode.nodeType === Node.ELEMENT_NODE ||
        childNode.nodeType === Node.DOCUMENT_FRAGMENT_NODE
      ) {
        const htmlElement: HTMLElement = childNode as HTMLElement;

        // 遍历节点属性
        // :if权限最大
        const attrs: Attr[] = Array.from(htmlElement.attributes);
        let depath = true;
        let ifAttr = attrs.find(({ name }) => name === this._ifInstruction);
        if (ifAttr) {
          const commentElement = document.createComment("");
          htmlElement.parentElement!.insertBefore(commentElement, htmlElement);
          autorun(() => {
            const show = this._getData(ifAttr!.value, state);
            if (show) {
              commentElement.after(htmlElement);
              depath = true;
              if (Array.from(childNode.childNodes).length) {
                this._define(htmlElement, state);
              }
            } else {
              htmlElement.replaceWith(commentElement);
              depath = false;
            }
            commentElement.data = createIfCommentData(show);
          });
          htmlElement.removeAttribute(this._ifInstruction);
        }

        if (depath) {
          for (const { name, value } of attrs) {
            // [title]='xxx'
            if (attrp(name)) {
              let attrName = name
                .replace(/^\[/, emptyString)
                .replace(/\]$/, emptyString);
              autorun(() => {
                if (attrName === "style") {
                  const styles: CSSStyleDeclaration = this._getData(
                    value,
                    state
                  );
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
                  htmlElement.setAttribute(
                    attrName,
                    this._getData(value, state)
                  ); // 属性扫描绑定
                }
              });
              htmlElement.removeAttribute(name);
            }

            // (click)="echo('hello',$event)"
            if (eventp(name)) {
              const eventName = name
                .replace(/^\(/, emptyString)
                .replace(/\)$/, emptyString);
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

              childNode.addEventListener(eventName, e => {
                //? 每次点击都需解析参数?
                //! 如果只解析一次，那么模板变量需要提前声明, 并且模板变量不会更新!
                if (this.$store.$actions && funcName in this.$store.$actions) {
                  this.$store.$actions[funcName].apply(
                    this.$store,
                    this._parseArgsToArguments(args, e, state)
                  );
                }
              });
              htmlElement.removeAttribute(name);
            }

            if (tempvarp(name)) {
              // 模板变量 #input
              this._templateVariables[name.replace(/^#/, "")] = htmlElement;
              htmlElement.removeAttribute(name);
            }

            // TODO 处理for指令
            if (name === this._forInstruction) {
              // 解析for指令的值
              let [varb, d] = value.split("in").map(s => s.trim());
              if (!varb) return;
              if (!isNaN(+d)) {
                const fragment = document.createDocumentFragment();
                htmlElement.removeAttribute(this._forInstruction);
                for (let index = 0; index < +d; index++) {
                  const item = childNode.cloneNode(true);
                  this._define(item as HTMLElement, {
                    ...state,
                    [varb]: index
                  });
                  fragment.append(item);
                }
                childNode.replaceWith(fragment);
              } else {
                // TODO: 循环Object or Array
              }
            }
          }
          // 递归遍历
          if (Array.from(childNode.childNodes).length) {
            this._define(htmlElement, state);
          }
        }
      } else if (childNode.nodeType === Node.TEXT_NODE) {
        // 插值表达式 {{ name }} {{ obj.age }}
        if (childNode.textContent) {
          const exp = /{{([\w\s\.][\s\w\.]+)}}/g;
          if (exp.test(childNode.textContent)) {
            const _initTextContent = childNode.textContent;
            autorun(() => {
              const text = _initTextContent.replace(exp, (...args) => {
                var key = args[1].replace(/\s/g, "");
                return this._getData(key, state);
              });
              childNode.textContent = text;
            });
          }
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
   * * 在state中寻找数据
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
          .replace(/^./, emptyString)
          .replace(/.$/, emptyString)
          .toString();
      }
      const data = this._getData(el, state);
      return data ? data : eval(el);
    });
  }
}

export default Aja;
