import { BindingEventBuilder, BindingAttrBuilder } from "./binding-builder";
import { eventp, modelp } from "../utils/p";
import { autorun, extendObservable, observable } from "../aja-mobx";
import { getData } from "../core";
import { Input, Output, Widget } from "../metadata/directives";
import { getAttrs } from "../utils/util";
import { Aja } from "../aja";
import { ModuleProxy } from "./module-proxy";
import { ContextData } from "./context-data";
import { AjaModel } from "./aja-model";
import { AnyObject } from "../interfaces/any-object";
import { Type } from "../interfaces/type";
import { ANNOTATIONS, PROP_METADATA } from "../utils/decorators";

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

export class WidgetProxy {
  /**
   * 自定义组件的前缀，默认app-
   * 在调用[bootstrapModule]函数时，可以设置
   */
  static prefix: string = "app-";

  /**
   * 判断是否以[prefix]开始
   */
  static isWidgetNode(node: HTMLElement): boolean {
    const name = node.nodeName.toLowerCase();
    return name.startsWith(WidgetProxy.prefix);
  }

  private get _attrs() {
    return getAttrs(this.host);
  }

  private _metadata?: {
    [key: string]: (Input | Output)[];
  };

  private _eachMeta(cb: (key: string, value: (Input | Output)[]) => void) {
    if (!this._metadata) return;
    for (const [key, value] of Object.entries(this._metadata)) {
      cb(key, value);
    }
  }

  public readonly context: AnyObject;
  public readonly widget: Type<any>;
  public readonly host: HTMLElement;
  public readonly parent?: WidgetProxy;
  public readonly parentContextData?: ContextData;
  public readonly module?: ModuleProxy;

  get widgetMetaData() {
    return (<any>this.widget)[ANNOTATIONS][0];
  }

  /**
   *
   * @param template 模板
   * @param context 用户的widget配置
   */
  constructor(opt: {
    widget: Type<any>;
    host: HTMLElement;
    parent?: WidgetProxy;
    parentContextData?: ContextData;
    module?: ModuleProxy;
  }) {
    if (!opt.widget) {
      throw `没有找到widget!!!`;
    }
    this.widget = opt.widget;
    this.host = opt.host;
    this.parent = opt.parent;
    this.parentContextData = opt.parentContextData;
    this.module = opt.module;
    this.context = observable.cls<any>(
      this.widget,
      (context: any) => {
        this._metadata = context.constructor[PROP_METADATA];
      },
      (this.widgetMetaData as any).ctorParameters /*动态constructor依赖注入*/
    );

    // 检查input和output
    if (
      this.parentContextData &&
      this.parent &&
      this._metadata &&
      this._attrs.length
    ) {
      this._bindInputs();
      this._bindOutputs();
      this._bindModels();
    }

    // 执行钩子
    if (this.context.initState) this.context.initState();

    // 检查视图
    this.host.innerHTML = "";
    this.host.insertAdjacentHTML("beforeend", this.widgetMetaData.template);
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
      .filter(({ name }) => !eventp(name))
      .filter(({ name }) => !modelp(name))
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
   * 取消解析别名
   * @param attrs
   * @param parentActions
   * @param context
   */
  private _bindOutputs() {
    this._attrs
      .filter(attr => eventp(attr.name))
      .forEach(attr => {
        const eventType: string = BindingEventBuilder.parseEventType(attr);
        const { funcName, args } = BindingEventBuilder.parseFun(attr);
        const parentMethod = this.parent?.context[funcName];
        const output = this.context[eventType];

        if (output && output instanceof EventEmitter) {
          output.next = (emitRrg: any) => {
            if (this.parentContextData) {
              try {
                parentMethod(
                  ...BindingEventBuilder.argsToArguments(
                    args,
                    this.parentContextData,
                    emitRrg
                  )
                );
              } catch (er) {
                console.error(er);
              }
            }
          };
        } else {
          // 没注册output，当作普通事件处理
          if (this.parentContextData && this.parent) {
            new BindingEventBuilder(this.host, attr, this.parentContextData);
          }
        }
        this.host.removeAttribute(attr.name);
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
