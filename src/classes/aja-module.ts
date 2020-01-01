import Aja, { Actions, AjaConfigOpts, Type } from "../aja";
import {
  templatep,
  attrp,
  eventp,
  elementNodep,
  numberStringp
} from "../utils/p";
import { ContextData } from "./context-data";
import { BindingAttrBuilder, BindingEventBuilder } from "./binding-builder";
import { autorun } from "mobx";
import { getData } from "../core";
import { getAttrs } from "../utils/util";

const l = console.log;

export function createWidgetName(name: string) {
  let newName = name.charAt(0).toLowerCase() + name.substr(1);
  newName = newName.replace(/([A-Z])/g, "-$1");
  return newName.toLowerCase();
}

export abstract class AjaPipe {
  readonly module?: AjaModule;

  setModule(m: AjaModule) {
    if (this.module) {
      throw `管道只能有一个模块`;
    }
    (this as { module: AjaModule }).module = m;
  }

  abstract pipeName: string;
  abstract transform(...value: any[]): any;
}

/**
 * 全部大写
 * @param value
 */
class UppercasePipe extends AjaPipe {
  pipeName = "uppercase";

  transform(value: string) {
    return value.toUpperCase();
  }
}

/**
 * 全部小写
 * @param value
 */
class LowercasePipe extends AjaPipe {
  pipeName = "lowercase";

  transform(value: string) {
    return value.toLowerCase();
  }
}

/**
 * 首字母小写
 * @param str
 */
class CapitalizePipe extends AjaPipe {
  pipeName = "capitalize";

  transform(value: string) {
    return value.charAt(0).toUpperCase() + value.substring(1);
  }
}

class JsonPipe extends AjaPipe {
  pipeName = "json";

  transform(value: string) {
    return JSON.stringify(value, null, " ");
  }
}

class SlicePipe extends AjaPipe {
  pipeName = "slice";

  transform(value: string, start: number, end: number) {
    return value.slice(start, end);
  }
}

const defaultPipes = {
  [UppercasePipe.name]: new UppercasePipe(),
  [CapitalizePipe.name]: new CapitalizePipe(),
  [JsonPipe.name]: new JsonPipe(),
  [SlicePipe.name]: new SlicePipe()
};

export class AjaModules {
  private static _modules: {
    [moduleName: string]: AjaModule;
  } = {};

  static addModule(name: string, m: AjaModule) {
    this._modules[name] = m;
  }

  static getModule(name: string) {
    return this._modules[name];
  }

  static hasModule(name: string) {
    return !!this.getModule(name);
  }
}

export abstract class AjaModule {
  private _widgets: {
    [k: string]: AjaWidget;
  } = {};

  addWidget(name: string, widget: AjaWidget): void {
    widget.setModule(this);
    this._widgets[createWidgetName(name)] = widget;
  }

  importWidget(name: string, widget: AjaWidget) {
    this._widgets[createWidgetName(name)] = widget;
  }

  getWidget(name: string): AjaWidget | undefined {
    return this._widgets[createWidgetName(name)];
  }

  hasWidget(name: string): boolean {
    return !!this.getWidget(name);
  }

  private _pipes: { [name: string]: AjaPipe } = Object.assign(defaultPipes);

  /**
   * 使用pipeName属性查找
   * @param name [json]
   */
  findPipe(name: string): AjaPipe | undefined {
    return Object.values(this._pipes).find(pipe => pipe.pipeName === name);
  }

  /**
   * 使用对象名查找
   * @param name [JsonPipe]
   */
  getPipe(name: string) {
    return this._pipes[name];
  }

  hasPipe(name: string): boolean {
    return !!this.findPipe(name);
  }

  addPipe(name: string, pipe: AjaPipe): void {
    pipe.setModule(this);
    this._pipes[name] = pipe;
  }

  importPipe(pipe: AjaPipe): void {
    this._pipes[name] = pipe;
  }

  usePipes(data: any, pipeList: string[], contextData: ContextData): any {
    let _result = data;
    if (pipeList.length) {
      pipeList.forEach(pipe => {
        const [pipeName, ...pipeArgs] = pipe.split(":");
        const ajaPipe = this.findPipe(pipeName);
        if (ajaPipe) {
          const parsePipeArgs = pipeArgs.map(arg =>
            numberStringp(arg) ? arg : getData(arg, contextData)
          );
          try {
            _result = ajaPipe.transform(_result, ...parsePipeArgs);
          } catch (er) {
            console.error(er);
          }
        } else {
          console.error(`没有找到管道[${pipeName}], 请注册!!!`);
        }
      });
    }
    return _result;
  }

  /**
   * 属于此模块的一组组件，[指令: 暂时没有这个]和管道（可声明）
   */
  declarations?: any[] = [];

  /**
   * 导入模块中的导出
   */
  imports?: any[] = [];

  /**
   * 根组件
   */
  bootstrap?: Type<AjaWidget>;

  /**
   * 在此Module中声明的组件，指令和管道的集合，
   * 可在作为导入此Module的一部分的任何组件的模板中使用。
   * 导出的声明是模块的公共API。
   */
  exports?: any[] = [];
}

export abstract class AjaWidget {
  readonly module?: AjaModule;

  setModule(m: AjaModule) {
    if (this.module) {
      throw `组件只能有一个模块`;
    }
    (this as { module: AjaModule }).module = m;
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
    cb: (opt: {
      state: any;
      actions: any;
      initState: any;
      ajaModule: any;
    }) => Aja,
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
      initState: this.initState?.bind(this),
      ajaModule: this.module
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
