import {
  createRoot,
  createObject,
  emptyString,
  parseTemplateEventArgs,
  parsePipe,
  toArray,
  getData,
  parseArgsToArguments,
  parseArgsEvent
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
  textNodep
} from "./utils/p";
import { BindingModelBuilder } from "./classes/binding-model-builder";
import { ajaPipes, usePipes } from "./pipes/pipes";
import {
  EventType,
  modelChangeEvent,
  formControlName
} from "./utils/const-string";
import { OptionsInterface } from "./interfaces/interfaces";
import { BindingTempvarBuilder } from "./classes/binding-tempvar-builder";
import { ContextData } from "./classes/context-data";
import { FormControlSerivce } from "./service/form-control.service";
import { FormControl } from "./classes/forms";

const l = console.log;

class Aja {
  static FormControl = FormControl;

  $store?: any;
  $actions?: {
    [name: string]: Function;
  };

  constructor(view?: string | HTMLElement, options?: OptionsInterface) {
    if (!options || !view) return;
    const root = createRoot(view);
    if (root === null) return;
    if (options.pipes) Object.assign(ajaPipes, options.pipes);
    this._proxyState(options);
    if (options.initState) options.initState.call(this.$store);

    const contextData = new ContextData({
      globalState: this.$store,
      tvState: new BindingTempvarBuilder(root)
    });
    this._define(root, contextData);
  }

  /**
   * 扫描绑定
   * @param root
   */
  private _define(root: HTMLElement, contextData: ContextData): void {
    let depath = true;
    // 没有attrs就不解析了
    if (root.attributes && root.attributes.length) {
      // 优先解析if -> for -> 其它属性
      depath = this._parseBindIf(root, contextData);
      if (depath) depath = this._parseBindFor(root, contextData);
      if (depath) {
        const attrs: Attr[] = toArray(root.attributes);
        this._parseBindAttrs(root, attrs, contextData);
      }
    }

    const childNodes = toArray(root.childNodes);
    if (depath && childNodes.length) {
      this._bindingChildNodesAttrs(childNodes, contextData);
    }
  }

  /**
   * * 解析指定HTMLElement的属性
   * @param node
   * @param contextData
   */
  private _parseBindAttrs(
    node: HTMLElement,
    attrs: Attr[],
    contextData: ContextData
  ) {
    for (const attr of attrs) {
      const { name } = attr;

      // [title]='xxx'
      if (attrp(name)) {
        this._attrBindHandle(node, attr, contextData);
        continue;
      }

      // (click)="echo('hello',$event)"
      if (eventp(name)) {
        this._eventBindHandle(node, attr, contextData);
        continue;
      }
    }
    const model = new BindingModelBuilder(node);
    model.setup(contextData);
  }

  private _proxyState(options: OptionsInterface): void {
    const state = createObject<any>(options.state);
    this.$actions = createObject<any>(options.actions);

    if (!this.$actions) return;

    const bounds: { [k: string]: any } = {};
    Object.keys(this.$actions).forEach(ac => (bounds[ac] = action.bound));
    this.$store = observable(Object.assign(state, this.$actions), bounds, {
      deep: true
    });
  }

  /**
   * 解析一个节点上是否绑定了:if指令, 更具指令的值来解析节点
   * @param node
   * @param attrs
   */
  private _parseBindIf(node: HTMLElement, contextData: ContextData): boolean {
    let show = true;
    const ifBuilder = new BindingIfBuilder(node);
    if (ifBuilder.ifAttr) {
      if (boolStringp(ifBuilder.value)) {
        show = ifBuilder.value === "true";
        ifBuilder.checked(show, () => {
          this._define(
            node,
            contextData.copyWith({
              tvState: contextData.tvState.copyWith(node)
            })
          );
        });
      } else {
        const [bindKey, pipeList] = parsePipe(ifBuilder.value);
        autorun(() => {
          show = getData(bindKey, contextData);
          show = usePipes(show, pipeList, contextData);
          ifBuilder.checked(show, () => {
            this._define(
              node,
              contextData.copyWith({
                tvState: contextData.tvState.copyWith(node)
              })
            );
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
   * @param contextData
   */
  private _parseBindFor(node: HTMLElement, contextData: ContextData): boolean {
    const forBuilder = new BindingForBuilder(node, contextData);
    if (forBuilder.hasForAttr) {
      if (forBuilder.isNumberData) {
        let _data = +(forBuilder.bindData as string);
        _data = usePipes(_data, forBuilder.pipes, contextData);

        for (let v = 0; v < _data; v++) {
          const item = forBuilder.createItem();
          const forLet = contextData.forLet + "_";
          this._define(
            item as HTMLElement,
            contextData.copyWith({
              contextState: forBuilder.createForContextState(v),
              tvState: contextData.tvState.copyWith(node),
              forLet: forLet
            })
          );
        }
        forBuilder.draw(_data);
      } else {
        const _that = this;
        autorun(() => {
          let _data = getData(forBuilder.bindData as string, contextData);
          _data = usePipes(_data, forBuilder.pipes, contextData);
          forBuilder.clear();
          for (const k in _data) {
            const item = forBuilder.createItem();
            _that._define(
              item as HTMLElement,
              contextData.copyWith({
                contextState: forBuilder.createForContextState(
                  k,
                  _data[k],
                  false
                ),
                tvState: contextData.tvState.copyWith(node),
                forLet: contextData.forLet + "_"
              })
            );
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
    contextData: ContextData
  ): void {
    if (name === formControlName) {
      const formControl: FormControl = getData(value, contextData);
      new FormControlSerivce(node, formControl);
    } else {
      // [style.coloe] => [style, coloe]
      let [attrName, attrChild] = name
        .replace(attrStartExp, emptyString)
        .replace(attrEndExp, emptyString)
        .split(".");
      const [bindKey, pipeList] = parsePipe(value);
      autorun(() => {
        let data = getData(bindKey, contextData);
        data = usePipes(data, pipeList, contextData);

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
    }
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
    contextData: ContextData
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
      // 每次只需把新的event传入就行了
      node.addEventListener(type, e => {
        //? 每次事件响应都解析，确保变量更改能够得到新数据
        //? 如果放在外面，则不会响应新数据
        const transitionArgs = parseArgsToArguments(args, contextData);
        if (this.$actions)
          this.$actions[funcName].apply(
            this.$store,
            parseArgsEvent(
              transitionArgs,
              modelChangep ? (e.target as HTMLInputElement).value : e
            )
          );
      });
    }

    node.removeAttribute(name);
  }

  /**
   * * 递归解析子节点
   * @param childNodes
   * @param contextData
   */
  private _bindingChildNodesAttrs(
    childNodes: ChildNode[],
    contextData: ContextData
  ): any {
    if (!childNodes.length) return;
    let node: ChildNode = childNodes[0];
    if (elementNodep(node)) {
      this._define(node as HTMLElement, contextData);
    }
    if (textNodep(node)) {
      this._setTextContent(node, contextData);
    }
    return this._bindingChildNodesAttrs(childNodes.slice(1), contextData);
  }

  /**
   * * 解析文本节点的插值表达式
   * @param textNode
   * @param contextData
   */
  private _setTextContent(textNode: ChildNode, contextData: ContextData): void {
    const textBuilder = new BindingTextBuilder(textNode);
    autorun(() => {
      textBuilder.setText(contextData);
    });
  }
}

export default Aja;
