import {
  toArray,
  getAttrs,
  hasMultipleStructuredInstructions,
  LowerTrim
} from "./utils/util";

import { observable, autorun, action } from "mobx";
import { eventp, boolStringp, attrp, elementNodep, textNodep } from "./utils/p";
import { ContextData } from "./classes/context-data";
import {
  BindingAttrBuilder,
  BindingTextBuilder,
  BindingModelBuilder,
  BindingIfBuilder,
  BindingEventBuilder,
  BindingForBuilder,
  BindingTempvarBuilder,
  BindingSwitchBuilder
} from "./classes/binding-builder";
import { AjaModule } from "./classes/aja-module";

const l = console.log;

export interface Type<T> extends Function {
  new (...args: any[]): T;
}

export interface AnyObject {
  [k: string]: any;
}

export interface Actions {
  [name: string]: Function;
}

export interface AjaConfigOpts {
  state?: any;
  actions?: Actions;
  initState?: Function;
}

export class Aja {
  public $store?: any;
  public $actions?: Actions;

  constructor(
    public root: HTMLElement,
    options: AjaConfigOpts = {},
    public module: AjaModule
  ) {
    this._proxyState(options);
    if (options.initState) options.initState();

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
    const attrs = getAttrs(node);
    const isWidget = this._isWidget(node);
    let depath = true;
    if (attrs.length) {
      depath = this._parseBindIf(node, contextData);
      if (depath) depath = this._parseBindFor(node, contextData);
      if (depath) depath = this._parseBindSwitch(node, contextData);
      if (depath) {
        if (isWidget) {
          this._parseWidget(node, attrs, contextData);
          return;
        } else {
          this._parseBindAttrs(node, attrs, contextData);
        }
      }
    } else {
      if (isWidget) {
        this._parseWidget(node, attrs, contextData);
        return;
      }
    }

    if (depath) {
      const childNodes = toArray(node.childNodes).filter(
        e => e.nodeName !== "#comment"
      );
      if (childNodes.length)
        this._bindingChildNodesAttrs(childNodes, contextData);
    }
  }

  private _isWidget(node: HTMLElement) {
    const ajaWidget = this.module.getWidget(node.nodeName);
    return ajaWidget && node !== this.root;
  }

  private _parseWidget(
    node: HTMLElement,
    attrs: Attr[],
    contextData: ContextData
  ) {
    const ajaWidget = this.module.getWidget(node.nodeName);
    if (ajaWidget) {
      const w = new ajaWidget.widget();
      w.bindOutput(node, attrs, this.$actions, contextData);
      w.setup(node, ajaWidget.module, contextData);
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
        new BindingAttrBuilder(node, attr, contextData, this.module);
        continue;
      }

      // (click)="echo('hello',$event)"
      if (eventp(name)) {
        new BindingEventBuilder(node, attr, contextData, this.$actions);
        continue;
      }
    }

    const modleAttr = BindingModelBuilder.findModelAttr(node);
    if (modleAttr)
      new BindingModelBuilder(node, modleAttr, contextData, this.module);
  }

  private _proxyState(options: AjaConfigOpts): void {
    const state = options.state || {};
    this.$actions = options.actions || {};
    const bounds: AnyObject = Object.keys(this.$actions).reduce(
      (acc, ac) =>
        Object.assign(acc, {
          [ac]: action.bound
        }),
      {}
    );
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
      const ifBuilder = new BindingIfBuilder(
        ifAttr,
        node,
        contextData,
        this.module
      );
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
      new BindingForBuilder(node, forAttr, contextData, this.module)
        .addRenderListener((root, newContextData) => {
          this._scan(root, newContextData);
        })
        .setup();
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
      new BindingTextBuilder(node, contextData, this.module);
    }
    return this._bindingChildNodesAttrs(childNodes.slice(1), contextData);
  }

  /**
   * 解析节点上是否有 :case :default
   * @param root
   * @param contextData
   */
  private _parseBindSwitch(
    root: HTMLElement,
    contextData: ContextData
  ): boolean {
    if (!contextData.switch) return true;
    let depath = true;
    const caseAttr = BindingSwitchBuilder.findCaseAttr(root);
    if (caseAttr) {
      new BindingSwitchBuilder(root, caseAttr, contextData, this.module);
    } else {
      const defaultAttr = BindingSwitchBuilder.findDefaultAttr(root);
      if (defaultAttr) {
        new BindingSwitchBuilder(root, defaultAttr, contextData, this.module);
      }
    }

    return depath;
  }
}
