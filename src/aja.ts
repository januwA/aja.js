import {
  toArray,
  getAttrs,
  hasMultipleStructuredInstructions
} from "./utils/util";

import { observable, autorun, action } from "mobx";
import {
  eventp,
  boolStringp,
  attrp,
  elementNodep,
  textNodep,
  arrayp
} from "./utils/p";
import { ContextData } from "./classes/context-data";
import {
  FormControl,
  FormGroup,
  FormBuilder,
  FormArray
} from "./classes/forms";
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
import { AjaWidget, AjaWidgets } from "./classes/aja-widget";
import { AjaModule } from "./classes/aja-module";
import { AjaPipes, AjaPipe } from "./classes/aja-pipe";

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

function getBootstrap(bootstrap?: Type<AjaWidget> | undefined) {
  return arrayp(bootstrap) ? bootstrap[0] : bootstrap;
}

function mergeExports(m: AjaModule) {
  if (m.imports && m.imports.length) {
    m.imports.forEach(el => {
      const x = new el();
      if (x instanceof AjaModule) {
        if (x.exports) {
          if (m.declarations) {
            m.declarations = m.declarations.concat(x.exports);
          } else {
            m.declarations = x.exports;
          }
        }
      }
    });
  }
}

function parseDeclarations(declarations: any[] | undefined) {
  declarations?.forEach(el => {
    const x = new el();
    if (x instanceof AjaWidget) {
      AjaWidgets.add(el.name, x);
    } else if (x instanceof AjaPipe) {
      AjaPipes.add(x);
    }
  });
}

class Aja {
  static FormControl = FormControl;
  static FormGroup = FormGroup;
  static FormArray = FormArray;
  static fb = FormBuilder;
  static AjaWidget = AjaWidget;
  static AjaModule = AjaModule;
  static AjaPipe = AjaPipe;

  /**
   * 运行根模块
   */
  static bootstrapModule(moduleType: Type<AjaModule>) {
    const m = new moduleType();
    const bootstrap = getBootstrap(m.bootstrap);
    if (!bootstrap) return;

    // 将 module.export 合并到 declarations
    mergeExports(m);

    // 解析 declarations
    parseDeclarations(m.declarations);

    const rootName = AjaWidget.createWidgetName(bootstrap.name);
    const host = document.querySelector<HTMLElement>(rootName);
    if (!host) return;
    const ajaWidget = AjaWidgets.get(rootName);
    if (!ajaWidget) return;
    ajaWidget.isRoot = true;
    ajaWidget.setup(host, opt => new Aja(host, opt));
  }

  public $store?: any;
  public $actions?: Actions;

  constructor(public root: HTMLElement, options: AjaConfigOpts = {}) {
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
          this._setupWidget(node, attrs, contextData);
          return;
        } else {
          this._parseBindAttrs(node, attrs, contextData);
        }
      }
    } else {
      if (isWidget) {
        this._setupWidget(node, attrs, contextData);
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
    const ajaWidget = AjaWidgets.get(node.nodeName);
    return ajaWidget && node !== this.root;
  }

  private _setupWidget(
    node: HTMLElement,
    attrs: Attr[],
    contextData: ContextData
  ) {
    const ajaWidget = AjaWidgets.get(node.nodeName);
    ajaWidget!.bindOutput(node, attrs, this.$actions, contextData);
    ajaWidget!.setup(node, opt => new Aja(node, opt), contextData);
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
      new BindingTextBuilder(node, contextData);
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
