import { Type, Aja } from "../aja";
import {
  templatep,
  attrp,
  eventp,
  elementNodep,
  numberStringp,
  arrayp
} from "../utils/p";
import { ContextData } from "./context-data";
import { BindingAttrBuilder, BindingEventBuilder } from "./binding-builder";
import { autorun } from "mobx";
import { getData } from "../core";
import { getAttrs, LowerTrim, proxyMobx } from "../utils/util";
import { AjaPipe, defaultPipes } from "./aja-pipe";

const l = console.log;

function parseImports(m: AjaModule) {
  m.imports?.forEach(ajaModuleItem => {
    const moduleName = ajaModuleItem.name;
    let ajaModule: AjaModule;
    const hasModule = AjaModules.hasModule(moduleName);
    if (hasModule) {
      ajaModule = AjaModules.getModule(moduleName);
    } else {
      ajaModule = new ajaModuleItem();
      AjaModules.addModule(moduleName, ajaModule);
    }
    if (ajaModule instanceof AjaModule) {
      if (!hasModule) {
        if (ajaModule.declarations) {
          parseDeclarations(ajaModule);
        }

        if (ajaModule.imports) {
          parseImports(ajaModule);
        }
      }

      if (ajaModule.exports) {
        parseExports(ajaModule, m);
      }
    }
  });
}

function parseExports(ajaModule: AjaModule, module: AjaModule) {
  ajaModule.exports?.forEach(el => {
    if (el.prototype instanceof AjaWidget) {
      const widgetItem = ajaModule.getWidget(el.name);
      if (widgetItem) {
        module.addWidget(el.name, widgetItem);
      }
    } else if (el.prototype instanceof AjaPipe) {
      const pipe = ajaModule.getPipe(el.name);
      if (pipe) {
        module.importPipe(pipe);
      }
    }
  });
}

function parseDeclarations(m: AjaModule) {
  m.declarations?.forEach(el => {
    if (el.prototype instanceof AjaWidget) {
      proxyMobx(el);
      const widgetItem = {
        module: m,
        widget: el,
      };
      m.addWidget(el.name, widgetItem);
    } else if (el.prototype instanceof AjaPipe) {
      m.addPipe(el.name, new el());
    }
  });
}

function _usePipes(
  data: any,
  pipeList: string[],
  contextData: ContextData,
  m: AjaModule
) {
  let _result = data;
  if (pipeList.length) {
    pipeList.forEach(pipe => {
      const [pipeName, ...pipeArgs] = pipe.split(":");
      const ajaPipe = m.findPipe(pipeName);
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

function _createWidgetName(name: string) {
  let newName = name.charAt(0).toLowerCase() + name.substr(1);
  newName = newName.replace(/([A-Z])/g, "-$1");
  return newName.toLowerCase();
}

export function bootstrapModule(moduleType: Type<AjaModule>) {
  if (moduleType.prototype instanceof AjaModule) {
    const rootModule: AjaModule = new moduleType();
    const bootstrap = arrayp(rootModule.bootstrap)
      ? rootModule.bootstrap[0]
      : rootModule.bootstrap;
    if (bootstrap) {
      // 解析 declarations
      parseDeclarations(rootModule);

      // 解析imports导入的模块
      parseImports(rootModule);

      const rootName = _createWidgetName(bootstrap.name);
      const host = document.querySelector<HTMLElement>(rootName);
      if (host) {
        const widgetItem = rootModule.getWidget(rootName);
        if (widgetItem) {
          const { widget, module } = widgetItem;
          const w = new widget;
          w.setup(host, module);
        }
      }
    }
  }
}
/**
 * 保存模块，确保只初始化一次
 */
export class AjaModules {
  private static _modules: {
    [moduleName: string]: AjaModule;
  } = {};

  static addModule(name: string, m: AjaModule) {
    if (this.hasModule(name)) {
      throw `模块[${name}]已存在`;
    }
    this._modules[name] = m;
  }

  static getModule(name: string) {
    return this._modules[name];
  }

  static hasModule(name: string) {
    return !!this.getModule(name);
  }
}

export interface WidgetItem {
  module: AjaModule;
  widget: Type<AjaWidget>;
}
export abstract class AjaModule {
  private _widgets: {
    [k: string]: WidgetItem;
  } = {};

  addWidget(name: string, widgetItem: WidgetItem): void {
    this._widgets[_createWidgetName(name)] = widgetItem;
  }

  /**
   *
   * @param name app-home
   */
  getWidget(name: string): WidgetItem | undefined {
    return this._widgets[LowerTrim(name)];
  }

  /**
   *
   * @param name app-home
   */
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
    return _usePipes(data, pipeList, contextData, this);
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

export interface AjaInit {
  initState(): void;
}

/**
 * 调用[bootstrapModule]后，就全部解析完毕
 * TODO: 在解析到组件的时候在调用new
 */
export abstract class AjaWidget implements AjaInit {
  initState(): void { }
  public readonly host!: HTMLElement;
  private _setHost(host: HTMLElement) {
    (this as { host: HTMLElement }).host = host;
  }

  abstract render(): HTMLTemplateElement | string | undefined;

  initWidget(): void {
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

  setup(
    host: HTMLElement,
    module: AjaModule,
    parentContextData?: ContextData
  ) {
    this._setHost(host);
    if (!this.host) return;
    const attrs = getAttrs(host);
    this.initWidget();
    if (this.initState) this.initState();
    new Aja(this, module);
    if (parentContextData)
      this.bindInputs(parentContextData, attrs);
  }

  /**
   * 解析在组建上绑定的属性
   * @param store
   * @param attrs
   */
  bindInputs(parentContextData: any, attrs: Attr[]) {
    attrs
      .filter(attr => attrp(attr.name))
      .forEach(attr => {

        const { attrName } = BindingAttrBuilder.parseAttr(attr);
        if (Reflect.has(this, attrName)) {
          autorun(() => {
            (<any>this)[attrName] = getData(attr.value.trim(), parentContextData);
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