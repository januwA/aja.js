import { BindingEventBuilder, BindingAttrBuilder } from "./binding-builder";
import { eventp, attrp, elementNodep, templatep } from "../utils/p";
import { autorun, observable, extendObservable } from "../aja-mobx";
import { getData } from "../core";
import { PROP_METADATA, Input, Output } from "../metadata/directives";
import { getAttrs } from "../utils/util";
import { Aja } from "../aja";
import { AjaModuleProvider } from "./aja-module-provider";
import { ContextData } from "./context-data";

function _findAliasName(
  value: (Input | Output)[],
  metadataName: string
): string {
  for (const item of value) {
    if (Reflect.has(item, metadataName)) {
      if (item.bindingPropertyName) {
        return item.bindingPropertyName;
      }
    }
  }
  return "";
}

export interface AjaInputChanges {
  /**
   * 当input被改变就会运行一次
   *
   * 第一次运行在[initState]之前
   */
  inputChanges(): void;
}

export interface AjaInitState {
  /**
   * 在检查input和output后，在检测视图之前运行
   *
   * 只会运行一次
   */
  initState(): void;
}

export interface AjaViewInit {
  /**
   * 视图已经检查完毕
   */
  viewInit(): void;
}

export interface AjaDispose {
  /**
   * 清理资源
   */
  dispose(): void;
}

export abstract class AjaWidget
  implements AjaInitState, AjaInputChanges, AjaViewInit, AjaDispose {
  dispose(): void {}
  viewInit(): void {}
  inputChanges(): void {}
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
    parent?: AjaWidget;
    parentContextData?: ContextData;
  }) {
    this._setHost(opt.host);
    if (!this.host) return;

    // 检查input和output
    if (opt.parentContextData && opt.parent) {
      const attrs = getAttrs(this.host);
      this._bindInputs(opt.parentContextData, attrs);
      this._bindOutput(attrs, opt.parent, opt.parentContextData);
    }

    // 执行钩子
    this.initState();

    // 检查视图
    this._initWidget();
    new Aja(this, opt.module);

    // 视图检擦完毕
    this.viewInit();
  }

  /**
   * 解析在组建上绑定的属性
   * @param store
   * @param attrs
   */
  private _bindInputs(parentContextData: any, attrs: Attr[]) {
    if (!this._meta) return;
    let init = true;
    let t: number;
    attrs.forEach(attr => {
      const { attrName } = BindingAttrBuilder.parseAttr(attr);

      this._eachMeta((key, value) => {
        const hasAliasName = _findAliasName(value, "Input");
        if (
          (hasAliasName && hasAliasName === attrName) ||
          (!hasAliasName && key === attrName)
        ) {
          autorun(() => {
            const parentData = getData(attr.value.trim(), parentContextData);
            if (init) {
              extendObservable(this, {
                [key]: parentData
              });
            } else {
              (<any>this)[key] = parentData;
            }

            // 这里用异步是为了避免[inputChanges]里面使用了get，如
            //
            // ```
            //  inputChanges() { console.log(this.name); }
            // ```
            // 上面的情况很可能会造成无限的递归
            // 先用异步解决这种情况
            if (t) window.clearTimeout(t);
            t = setTimeout(() => {
              this.inputChanges();
            });
          });
        }
      });
      this.host.removeAttribute(attr.name);
    });
  }

  /**
   * 解析在组件上绑定的事件
   * @param attrs
   * @param parentActions
   * @param context
   */
  private _bindOutput(
    attrs: Attr[],
    parent: AjaWidget,
    parentContextData: any
  ) {
    if (!this._meta) return;
    attrs
      .filter(attr => eventp(attr.name))
      .forEach(attr => {
        // 全小写，还有可能是别名
        const eventType: string = BindingEventBuilder.parseEventType(attr);
        let { funcName } = BindingEventBuilder.parseFun(attr);
        const parentMethod = (<any>parent)[funcName];
        if (parentMethod && typeof parentMethod === "function") {
          const output = (<any>this)[eventType];
          this._eachMeta((key, value) => {
            const hasAliasName = _findAliasName(value, "Output");
            if (
              (hasAliasName && hasAliasName === eventType) ||
              (!hasAliasName && key === eventType)
            ) {
              if (output && output instanceof EventEmitter) {
                output.next = parentMethod.bind(parent);
              }
              this.host.removeAttribute(attr.name);
            } else {
              // 没注册output，当作普通事件处理
              new BindingEventBuilder(
                this.host,
                attr,
                parentContextData,
                parent
              );
            }
          });
        }
      });
  }

  private get _meta():
    | {
        [key: string]: (Input | Output)[];
      }
    | undefined {
    const constructor = this.constructor;
    if (constructor.hasOwnProperty(PROP_METADATA)) {
      return (constructor as any)[PROP_METADATA];
    }
  }

  private _eachMeta(cb: (key: string, value: (Input | Output)[]) => void) {
    if (!this._meta) return;
    for (const [key, value] of Object.entries(this._meta)) {
      cb(key, value);
    }
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
