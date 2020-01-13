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
import { autorun, observable } from "../aja-mobx";
import { getData } from "../core";
import { getAttrs, LowerTrim } from "../utils/util";
import { AjaPipe, defaultPipes } from "./aja-pipe";
import {
  AjaModule,
  ANNOTATIONS,
  PROP_METADATA,
  Input
} from "../metadata/directives";
import { AjaWidget } from "./aja-weidget-provider";

const l = console.log;

function createAjaModuleProvider<T>(
  cls: Type<T>
): AjaModuleProvider | undefined {
  if (Reflect.has(cls, ANNOTATIONS)) {
    const annotations = (<any>cls)[ANNOTATIONS];
    if (annotations && annotations.length) {
      const decoratorFactory = annotations[0] as AjaModule;
      new cls();
      const ajaModuleProvider: AjaModuleProvider = new AjaModuleProvider(
        decoratorFactory
      );
      return ajaModuleProvider;
    }
  }
}

function parseImports(m: AjaModuleProvider) {
  m.imports?.forEach(ajaModuleItem => {
    const moduleName = ajaModuleItem.name;
    let ajaModule: AjaModuleProvider | undefined;
    const hasModule = AjaModules.hasModule(moduleName);
    if (hasModule) {
      ajaModule = AjaModules.getModule(moduleName);
    } else {
      const ajaModuleProvider = createAjaModuleProvider(ajaModuleItem);
      if (ajaModuleProvider) {
        ajaModule = ajaModuleProvider;
        AjaModules.addModule(moduleName, ajaModule);
      }
    }

    if (ajaModule && ajaModule instanceof AjaModuleProvider) {
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

function parseExports(
  ajaModule: AjaModuleProvider,
  parentModule: AjaModuleProvider
) {
  ajaModule.exports?.forEach(el => {
    if (el.prototype instanceof AjaWidget) {
      const widgetItem = ajaModule.getWidget(_createWidgetName(el.name));
      if (widgetItem) {
        parentModule.addWidget(el.name, widgetItem);
      }
    } else if (el.prototype instanceof AjaPipe) {
      const pipe = ajaModule.getPipe(el.name);
      if (pipe) {
        parentModule.importPipe(pipe);
      }
    }
  });
}

function parseDeclarations(m: AjaModuleProvider) {
  m.declarations?.forEach(el => {
    if (el.prototype instanceof AjaWidget) {
      const widgetItem = {
        module: m,
        widget: el
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
  m: AjaModuleProvider
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

export function bootstrapModule(moduleType: Type<any>) {
  const ajaModuleProvider = createAjaModuleProvider(moduleType);
  if (ajaModuleProvider) {
    AjaModules.addModule(moduleType.name, ajaModuleProvider);

    const bootstrap = arrayp(ajaModuleProvider.bootstrap)
      ? ajaModuleProvider.bootstrap[0]
      : ajaModuleProvider.bootstrap;
    if (bootstrap) {
      // 解析 declarations
      parseDeclarations(ajaModuleProvider);

      // 解析imports导入的模块
      parseImports(ajaModuleProvider);

      const rootName = _createWidgetName(bootstrap.name);
      const host = document.querySelector<HTMLElement>(rootName);
      if (host) {
        const widgetItem = ajaModuleProvider.getWidget(rootName);
        if (widgetItem) {
          const { widget, module } = widgetItem;
          const w = observable.cls(widget);
          w.setup({ host, module });
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
    [moduleName: string]: AjaModuleProvider;
  } = {};

  static addModule(name: string, m: AjaModuleProvider) {
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

  static get modules() {
    return this._modules;
  }
}

export interface WidgetItem {
  module: AjaModuleProvider;
  widget: Type<AjaWidget>;
}
export class AjaModuleProvider {
  imports?: Type<any>[];
  declarations?: Type<any>[];
  exports?: Type<any>[];
  bootstrap?: Type<any>[];

  constructor(decoratorFactory: AjaModule) {
    this.imports = decoratorFactory.imports;
    this.declarations = decoratorFactory.declarations;
    this.exports = decoratorFactory.exports;
    this.bootstrap = decoratorFactory.bootstrap;
  }
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
}