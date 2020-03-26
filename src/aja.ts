import {
  toArray,
  getAttrs,
  hasMultipleStructuredInstructions
} from "./utils/util";

import { autorun } from "./aja-mobx";
import { eventp, attrp, elementNodep, textNodep } from "./utils/p";
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
import { WidgetProxy } from "./classes/widget-proxy";
import {
  structureDirectivePrefix,
  structureDirectives
} from "./utils/const-string";
import { WidgetFactory } from "./factory/widget-factory";
import { ModuleProxy } from "./classes/module-proxy";

export class Aja {
  module?: ModuleProxy;
  constructor(private readonly widget: WidgetProxy) {
    this.module = widget.module;
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
      // 找到第一个结构型指令
      const attr = attrs.find(
        ({ name }) => name.charAt(0) === structureDirectivePrefix
      );
      if (attr) {
        switch (attr.name) {
          case structureDirectives.if:
            depath = false;
            this._parseBindIf({ node, contextData, attr });
            break;
          case structureDirectives.unless:
            depath = false;
            this._parseBindIf({ node, contextData, attr, unless: true });
            break;
          case structureDirectives.for:
            depath = false;
            new BindingForBuilder(node, attr, contextData)
              .addRenderListener((root, newContextData) => {
                this._scan(root, newContextData);
              })
              .setup();
            break;
          case structureDirectives.case:
            if (contextData.switch) {
              new BindingSwitchBuilder(node, attr, contextData);
            }
            break;
          case structureDirectives.default:
            if (contextData.switch) {
              new BindingSwitchBuilder(node, attr, contextData);
            }
            break;
          default:
            // 其它结构型指令
            break;
        }
      }

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
    return (
      WidgetProxy.isWidgetNode(node) &&
      this.module?.hasWidget(node.nodeName.toLowerCase()) &&
      node !== this.widget.host
    );
  }

  private _parseWidget(node: HTMLElement, contextData: ContextData) {
    new WidgetProxy({
      widget: new WidgetFactory(node.nodeName.toLowerCase()).value,
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
        new BindingAttrBuilder(node, attr, contextData);
        continue;
      }

      // (click)="echo('hello',$event)"
      if (eventp(name)) {
        new BindingEventBuilder(node, attr, contextData);
        continue;
      }
    }

    const modleAttr = BindingModelBuilder.findModelAttr(node);
    if (modleAttr) {
      new BindingModelBuilder(node, modleAttr, contextData);
    }
  }

  private _parseBindIf({
    node,
    contextData,
    attr,
    unless
  }: {
    node: HTMLElement;
    contextData: ContextData;
    attr: Attr;
    unless?: boolean;
  }) {
    const ifBuilder = new BindingIfBuilder(attr, node, contextData);
    autorun(() => {
      let show = ifBuilder.getPipeData();
      if (unless) show = !show;
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
}
