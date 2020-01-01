import Aja, { Actions, AjaConfigOpts } from "../aja";
import { templatep, attrp, eventp, elementNodep } from "../utils/p";
import { ContextData } from "./context-data";
import { BindingAttrBuilder, BindingEventBuilder } from "./binding-builder";
import { autorun } from "mobx";
import { getData } from "../core";
import { getAttrs } from "../utils/util";

const l = console.log;
export abstract class AjaWidget {
  static createWidgetName(name: string) {
    let newName = name.charAt(0).toLowerCase() + name.substr(1);
    newName = newName.replace(/([A-Z])/g, "-$1");
    return newName.toLowerCase();
  }

  public isRoot: boolean = false;

  public readonly host?: HTMLElement;
  private _setHost(host: HTMLElement) {
    (this as { host: HTMLElement }).host = host;
  }

  public readonly $store?: any;
  private _setStore(store: any) {
    (this as { $store: any }).$store = store;
    return this;
  }

  abstract inputs?: string[];
  abstract state?: any = {};
  abstract actions?: Actions = {};

  abstract render: () => HTMLTemplateElement | string | undefined;
  abstract initState?: Function;

  constructor() {}

  getWidget() {
    const t = this.render();
    if (!t) {
      throw `没有找到模板!!! ${this}`;
    }
    if (elementNodep(t) && templatep(t)) {
      return document.importNode(t.content, true);
    } else {
      if (this.host) {
        this.host.insertAdjacentHTML("beforeend", t);
      }
    }
  }

  setup(
    host: HTMLElement,
    cb: (opt: AjaConfigOpts) => Aja,
    parentContextData?: ContextData
  ) {
    this._setHost(host);
    if (!this.host) return;

    const attrs = getAttrs(host);

    this.host.innerHTML = "";
    const widget = this.getWidget();
    if (widget) {
      this.host.append(widget);
    }
    const aja = cb({
      state: this.state,
      actions: this.actions,
      initState: this.initState?.bind(this)
    });
    this._setStore(aja.$store);
    if (parentContextData)
      this.bindInputs(aja.$store, parentContextData, attrs);
  }

  /**
   * 解析在组建上绑定的属性
   * @param store
   * @param attrs
   */
  bindInputs(store: any, parentStore: any, attrs: Attr[]) {
    attrs
      .filter(attr => attrp(attr.name))
      .forEach(attr => {
        const { attrName } = BindingAttrBuilder.parseAttr(attr);
        if (this.inputs?.includes(attrName)) {
          autorun(() => {
            if (store) {
              store[attrName] = getData(attr.value.trim(), parentStore);
            }
          });
        }
      });
  }

  /**
   * 解析在组件上绑定的事件
   * @param attrs
   * @param parentActions
   * @param context
   */
  bindOutput(
    node: HTMLElement,
    attrs: Attr[],
    parentActions?: Actions,
    parentContextData?: any
  ) {
    if (!parentActions) return;
    attrs
      .filter(attr => eventp(attr.name))
      .forEach(attr => {
        const type = BindingEventBuilder.parseEventType(attr);
        if (!(`on${type}` in window)) {
          let { funcName } = BindingEventBuilder.parseFun(attr);
          const f = parentActions[funcName];
          this.actions = Object.assign(this.actions || {}, {
            [type]: f.bind(parentContextData.store)
          });
          node.removeAttribute(attr.name);
        } else {
          new BindingEventBuilder(node, attr, parentContextData, parentActions);
        }
      });
  }
}

export class AjaWidgets {
  private static _widgets: {
    [k: string]: AjaWidget;
  } = {};

  static add(name: string, widget: AjaWidget): void {
    this._widgets[AjaWidget.createWidgetName(name)] = widget;
  }

  static get(name: string): AjaWidget | undefined {
    return this._widgets[name.toLowerCase()];
  }

  static has(name: string): boolean {
    return !!this.get(name);
  }
}
