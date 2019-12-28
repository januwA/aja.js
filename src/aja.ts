import {
  createObject,
  toArray,
  getAttrs,
  hasMultipleStructuredInstructions,
} from "./utils/util";

import { observable, autorun, action } from "mobx";
import {
  eventp,
  boolStringp,
  attrp,
  elementNodep,
  textNodep
} from "./utils/p";
import { ajaPipes, Pipes } from "./pipes";
import { ContextData } from "./classes/context-data";
import { FormControl, FormGroup, FormBuilder, FormArray } from "./classes/forms";
import { BindingAttrBuilder, BindingTextBuilder, BindingModelBuilder, BindingIfBuilder, BindingEventBuilder, BindingForBuilder, BindingTempvarBuilder, BindingSwitchBuilder } from "./classes/binding-builder";
import { AjaWidget, AjaWidgets } from "./classes/aja-widget";
import { getData } from "./core";
import { attrStartExp, attrEndExp, eventStartExp, eventEndExp } from "./utils/exp";

const l = console.log;

interface Constructable<T> {
  new(): T;
}

export interface Actions {
  [name: string]: Function;
}

export interface AjaConfigOpts {
  state?: any;
  actions?: Actions;
  initState?: Function;

  /**
   * 声明管道
   */
  pipes?: Pipes;

  /**
   * 声明组件
   */
  declarations?: Constructable<AjaWidget>[];
}

class Aja {
  static FormControl = FormControl;
  static FormGroup = FormGroup;
  static FormArray = FormArray;
  static fb = FormBuilder;
  static AjaWidget = AjaWidget;

  $store?: any;
  $actions?: Actions;

  constructor(public root: HTMLElement, options: AjaConfigOpts = {}) {
    if (options.pipes) Object.assign(ajaPipes, options.pipes);
    this._proxyState(options);
    if (options.initState) options.initState.call(this.$store);

    if (options.declarations) {
      options.declarations.forEach(widget => {
        AjaWidgets.register(widget.name, new widget());
      })
    }

    const contextData = new ContextData({
      store: this.$store,
      tData: new BindingTempvarBuilder(root)
    });
    this._scan(root, contextData);
  }

  /**
   * 扫描绑定
   * @param node
   */
  private _scan(node: HTMLElement, contextData: ContextData): void {
    if (hasMultipleStructuredInstructions(node)) {
      throw `一个元素不能绑定多个结构型指令。(${node.outerHTML})`;
    }
    const ajaWidget = AjaWidgets.get(node.nodeName);
    if (ajaWidget && node !== this.root) {
      node.innerHTML = '';
      node.append(ajaWidget.widget);
      const attrs = getAttrs(node);
      const aja = new Aja(node, {
        state: ajaWidget.state,
        actions: ajaWidget.actions,
        initState: ajaWidget.initState,
      });
      attrs.forEach(attr => {
        const { name } = attr;
        if (attrp(name)) {
          const attrName = name
            .replace(attrStartExp, '')
            .replace(attrEndExp, '')
            .split(".")[0]
          if (ajaWidget.inputs?.includes(attrName)) {
            autorun(() => {
              aja.$store[attrName] = getData(attr.value, contextData)
            })
          }
        } else if (eventp(name)) {
          const type = name.replace(eventStartExp, "")
            .replace(eventEndExp, "");
          aja.$store[type] = (this.$actions || {})[attr.value]
        }
      })
      return;
    }
    let depath = true;
    if (node.attributes && getAttrs(node).length) {
      depath = this._parseBindIf(node, contextData);
      if (depath) depath = this._parseBindFor(node, contextData);
      if (depath) depath = this._parseBindSwitch(node, contextData);
      if (depath) {
        this._parseBindAttrs(node, getAttrs(node), contextData);
      }
    }

    if (depath) {
      const childNodes = toArray(node.childNodes);
      if (childNodes.length) this._bindingChildNodesAttrs(childNodes, contextData);
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
        new BindingAttrBuilder(node, attr, contextData);
        continue;
      }

      // (click)="echo('hello',$event)"
      if (eventp(name)) {
        new BindingEventBuilder(node, attr, contextData, this.$actions);
        continue;
      }
    }
    new BindingModelBuilder(node, contextData);
  }

  private _proxyState(options: AjaConfigOpts): void {
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
    let ifAttr = BindingIfBuilder.findIfAttr(node);
    if (ifAttr) {
      const ifBuilder = new BindingIfBuilder(ifAttr, node, contextData);
      if (boolStringp(ifBuilder.bindKey)) {
        show = ifBuilder.bindKey === "true";
        ifBuilder.checked(show);
      } else {
        autorun(() => {
          show = ifBuilder.getPipeData();
          if (show) {
            this._scan(
              node,
              contextData.copyWith({
                tData: contextData.tData.copyWith(node)
              })
            );
          }
          ifBuilder.checked(show);
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
    let forAttr = BindingForBuilder.findForAttr(node);
    if (forAttr) {
      new BindingForBuilder(node, forAttr, contextData)
        .addRenderListener((root, newContextData) => {
          this._scan(root, newContextData)
        }).setup();
    }
    return !forAttr;
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
      this._scan(node, contextData);
    }
    if (textNodep(node)) {
      new BindingTextBuilder(node, contextData);
    }
    return this._bindingChildNodesAttrs(childNodes.slice(1), contextData);
  }

  /**
   * 解析节点上是否有 :case :default
   * @param root 
   * @param contextData 
   */
  private _parseBindSwitch(root: HTMLElement, contextData: ContextData): boolean {
    if (!contextData.switch) return true;
    let depath = true;
    const caseAttr = BindingSwitchBuilder.findCaseAttr(root);
    if (caseAttr) {
      new BindingSwitchBuilder(root, caseAttr, contextData);
    } else {
      const defaultAttr = BindingSwitchBuilder.findDefaultAttr(root);
      if (defaultAttr) {
        new BindingSwitchBuilder(root, defaultAttr, contextData);
      }
    }


    return depath;
  }
}

export default Aja;
