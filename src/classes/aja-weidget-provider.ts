import { BindingEventBuilder, BindingAttrBuilder } from "./binding-builder";
import { eventp, modelp } from "../utils/p";
import { autorun, extendObservable, observable } from "../aja-mobx";
import { getData } from "../core";
import { Input, Output, Widget } from "../metadata/directives";
import { getAttrs } from "../utils/util";
import { Aja } from "../aja";
import { AjaModuleProvider } from "./aja-module-provider";
import { ContextData } from "./context-data";
import { AjaModel } from "./aja-model";
import { AnyObject } from "../interfaces/any-object";
import { Type } from "../interfaces/type";

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
   *
   * TODO: 增加changes参数，https://angular.cn/guide/component-interaction#intercept-input-property-changes-with-ngonchanges
   */
  inputChanges(): void;
}

export interface AjaInitState {
  /**
   * 在检查input和output后，在检测视图之前运行
   *
   * 只会运行一次
   *
   * :if true 会执行
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
   *
   * :if false 会执行
   */
  dispose(): void;
}

export class AjaWidgetProvider {
  /**
   * 自定义组件的前缀，默认app-
   * 在调用[bootstrapModule]函数时，可以设置
   */
  static prefix: string = "app-";

  private get _attrs() {
    return getAttrs(this.host);
  }

  private _metadata:
    | {
        [key: string]: (Input | Output)[];
      }
    | undefined;

  private _eachMeta(cb: (key: string, value: (Input | Output)[]) => void) {
    if (!this._metadata) return;
    for (const [key, value] of Object.entries(this._metadata)) {
      cb(key, value);
    }
  }

  public readonly context: AnyObject;
  public readonly widgetItem: WidgetItem;
  public readonly host: HTMLElement;
  public readonly parent?: AjaWidgetProvider;
  public readonly parentContextData?: ContextData;

  /**
   *
   * @param template 模板
   * @param context 用户的widget配置
   */
  constructor(opt: {
    widgetItem: WidgetItem;
    host: HTMLElement;
    parent?: AjaWidgetProvider;
    parentContextData?: ContextData;
  }) {
    if (!opt.widgetItem) {
      throw `没有找到widget!!!`;
    }
    this.widgetItem = opt.widgetItem;
    this.host = opt.host;
    this.parent = opt.parent;
    this.parentContextData = opt.parentContextData;
    this.context = observable.cls(this.widgetItem.widget, metadata => {
      // 获取注入的元数据
      this._metadata = metadata;
    }, (this.widgetItem.widgetMetaData as any).ctorParameters);

    // 检查input和output
    if (this.parentContextData && this.parent && this._metadata) {
      this._bindInputs();
      this._bindOutputs();
      this._bindModels();
    }

    // 执行钩子
    if (this.context.initState) this.context.initState();

    // 检查视图
    this.host.innerHTML = "";
    this.host.insertAdjacentHTML(
      "beforeend",
      this.widgetItem.widgetMetaData.template
    );
    new Aja(this);

    // 视图检擦完毕
    if (this.context.viewInit) this.context.viewInit();
  }

  /**
   * 解析在组建上绑定的属性
   * @param store
   * @param attrs
   */
  private _bindInputs() {
    let init = true;
    let t: number;
    this._attrs
      .filter(({ name }) => {
        // 过滤掉(click)和[(data)]
        return !eventp(name) || !modelp(name);
      })
      .forEach(attr => {
        const { attrName } = BindingAttrBuilder.parseAttr(attr);

        this._eachMeta((key, value) => {
          const hasAliasName = _findAliasName(value, "Input");
          if (
            (hasAliasName && hasAliasName === attrName) ||
            (!hasAliasName && key === attrName)
          ) {
            autorun(() => {
              if (!this.parentContextData) return;
              const parentData = getData(
                attr.value.trim(),
                this.parentContextData
              );
              if (init) {
                extendObservable(this.context, {
                  [key]: parentData
                });
                init = false;
              } else {
                this.context[key] = parentData;
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
                if (this.context.inputChanges) this.context.inputChanges();
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
  private _bindOutputs() {
    this._attrs
      .filter(attr => eventp(attr.name))
      .forEach(attr => {
        // 全小写，还有可能是别名
        const eventType: string = BindingEventBuilder.parseEventType(attr);
        let { funcName } = BindingEventBuilder.parseFun(attr);
        const parentMethod = this.parent?.context[funcName];
        if (parentMethod && typeof parentMethod === "function") {
          const output = this.context[eventType];
          this._eachMeta((key, value) => {
            const hasAliasName = _findAliasName(value, "Output");
            if (
              (hasAliasName && hasAliasName === eventType) ||
              (!hasAliasName && key === eventType)
            ) {
              if (output && output instanceof EventEmitter) {
                output.next = parentMethod.bind(this.parent?.context);
              }
              this.host.removeAttribute(attr.name);
            } else {
              // 没注册output，当作普通事件处理
              if (this.parentContextData && this.parent) {
                new BindingEventBuilder(
                  this.host,
                  attr,
                  this.parentContextData,
                  this.parent
                );
              }
            }
          });
        }
      });
  }

  /**
   * 解析[(data)]="data"
   * child需要设置[@Input() data]和[@Output dataChange]才生效
   * TODO: 读取属性别名
   * @param attrs
   * @param parent
   * @param parentContextData
   */
  private _bindModels() {
    let init = true;
    this._attrs
      .filter(({ name }) => modelp(name))
      .forEach(attr => {
        const prop = AjaModel.getModelprop(attr.name);
        if (prop && this._metadata) {
          const propEvent = `${prop}Change`;
          if (
            this._metadata.hasOwnProperty(prop) &&
            this._metadata.hasOwnProperty(propEvent) &&
            this.context[propEvent] instanceof EventEmitter
          ) {
            const parentProp = attr.value.trim();
            autorun(() => {
              if (!this.parentContextData) return;
              const parentData = getData(parentProp, this.parentContextData);
              if (init) {
                extendObservable(this.context, {
                  [prop]: parentData
                });
                this.context[propEvent].next = (value: any) => {
                  (<any>this.parent).context[parentProp] = value;
                };
                init = false;
              } else {
                this.context[prop] = parentData;
              }
            });
          }
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

export interface WidgetItem {
  /**
   * 注入的元数据
   */
  widgetMetaData: Widget;

  /**
   * 该widget属于那个模块
   */
  module: AjaModuleProvider;

  /**
   * widget对象
   */
  widget: Type<AjaWidgetProvider>;
}

/**
 * 保存所有widget
 * 每个widget的数据为[WidgetItem]
 */
export class Widgets {
  private static _widgets: {
    [k: string]: WidgetItem;
  } = {};

  static addWidget(widgetItem: WidgetItem): void {
    this._widgets[widgetItem.widgetMetaData.selector] = widgetItem;
  }

  /**
   *
   * @param name app-home or APP-HOME
   */
  static getWidget(name: string): WidgetItem {
    return this._widgets[name.toLowerCase()];
  }

  /**
   *
   * @param name app-home
   */
  static hasWidget(name: string): boolean {
    return !!this.getWidget(name);
  }
}
