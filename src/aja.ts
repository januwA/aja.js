import {
  toArray,
  getAttrs,
  hasMultipleStructuredInstructions
} from "./utils/util";

import { autorun } from "./aja-mobx";
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
import { AjaWidgetProvider, Widgets } from "./classes/aja-weidget-provider";

const l = console.log;

export interface Type<T> extends Function {
  new (...args: any[]): T;
}

export interface AnyObject {
  [k: string]: any;
}

export class Aja {
  get module() {
    return this.widget.widgetItem.module;
  }
  constructor(private readonly widget: AjaWidgetProvider) {
    const contextData = new ContextData({
      store: widget.context,
      tData: new BindingTempvarBuilder(widget.host)
    });
    this._scan(widget.host, contextData);
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
          this._parseWidget(node, contextData);
          return;
        } else {
          this._parseBindAttrs(node, attrs, contextData);
        }
      }
    } else {
      if (isWidget) {
        this._parseWidget(node, contextData);
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

  /**
   * 检查node是否为自定义widget
   * 检查模块是否存在这个widget
   * 检查node不等于host，避免无限递归
   * @param node
   */
  private _isWidget(node: HTMLElement) {
    const name = node.nodeName.toLowerCase();
    if (name.startsWith(AjaWidgetProvider.prefix)) {
      if (this.module.hasWidget(name) && node !== this.widget.host) {
        return true;
      }
    } else {
      return false;
    }
  }

  private _parseWidget(node: HTMLElement, contextData: ContextData) {
    new AjaWidgetProvider({
      widgetItem: Widgets.getWidget(node.nodeName),
      host: node,
      parent: this.widget,
      parentContextData: contextData
    });
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
        new BindingEventBuilder(node, attr, contextData, this.widget);
        continue;
      }
    }

    const modleAttr = BindingModelBuilder.findModelAttr(node);
    if (modleAttr)
      new BindingModelBuilder(node, modleAttr, contextData, this.module);
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
