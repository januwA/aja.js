import { BindingEventBuilder, BindingAttrBuilder } from "./binding-builder";
import { eventp, attrp, elementNodep, templatep } from "../utils/p";
import { autorun } from "../aja-mobx";
import { getData } from "../core";
import { PROP_METADATA, Input } from "../metadata/directives";
import { getAttrs } from "../utils/util";
import { Aja } from "../aja";
import { AjaModuleProvider } from "./aja-module-provider";
import { ContextData } from "./context-data";

function _findAliasName(value: Input[]): string {
  for (const { bindingPropertyName } of value) {
    if (bindingPropertyName) {
      return bindingPropertyName;
    }
  }
  return "";
}

export interface AjaInit {
  initState(): void;
}

export abstract class AjaWidget implements AjaInit {
  initState(): void {}
  public readonly host!: HTMLElement;
  private _setHost(host: HTMLElement): void {
    (this as { host: HTMLElement }).host = host;
  }

  abstract render(): HTMLTemplateElement | string;

  private _initWidget(): void {
    const t = this.render();
    if (!t) {
      throw `没有找到模板!!! ${this}`;
    }
    this.host.innerHTML = "";
    if (elementNodep(t) && templatep(t)) {
      this.host.append(document.importNode(t.content, true));
    } else {
      if (this.host) {
        this.host.insertAdjacentHTML("beforeend", t);
      }
    }
  }

  setup(opt: {
    host: HTMLElement;
    module: AjaModuleProvider;
    parentContextData?: ContextData;
  }) {
    this._setHost(opt.host);
    if (!this.host) return;
    const attrs = getAttrs(this.host);
    this._initWidget();
    if (this.initState) this.initState();
    new Aja(this, opt.module);
    if (opt.parentContextData) this.bindInputs(opt.parentContextData, attrs);
  }

  /**
   * 解析在组建上绑定的属性
   * @param store
   * @param attrs
   */
  bindInputs(parentContextData: any, attrs: Attr[]) {
    const constructor = this.constructor;
    const _self = this;
    attrs
      .filter(attr => attrp(attr.name))
      .forEach(attr => {
        const { attrName } = BindingAttrBuilder.parseAttr(attr);
        if (constructor.hasOwnProperty(PROP_METADATA)) {
          const meta: {
            [key: string]: Input[];
          } = (constructor as any)[PROP_METADATA];
          for (const [key, value] of Object.entries(meta)) {
            const hasAliasName = _findAliasName(value);
            if (
              (hasAliasName && hasAliasName === attrName) ||
              (!hasAliasName && key === attrName)
            ) {
              autorun(() => {
                (<any>_self)[key] = getData(
                  attr.value.trim(),
                  parentContextData
                );
              });
            }
          }
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
    parent?: AjaWidget,
    parentContextData?: any
  ) {
    if (!parent) return;
    attrs
      .filter(attr => eventp(attr.name))
      .forEach(attr => {
        const inputEventType: string = BindingEventBuilder.parseEventType(attr);
        if (!(`on${inputEventType}` in window)) {
          let { funcName } = BindingEventBuilder.parseFun(attr);
          const f = (<any>parent)[funcName];
          if (!f) return;
          const output = (<any>this)[inputEventType];
          if (output && output instanceof EventEmitter) {
            output.next = f.bind(parent);
          }
          node.removeAttribute(attr.name);
        } else {
          new BindingEventBuilder(node, attr, parentContextData, parent);
        }
      });
  }
}

export class EventEmitter<T> {
  next?: Function;
  emit(value: T) {
    if (this.next) {
      this.next(value);
    }
  }
}
