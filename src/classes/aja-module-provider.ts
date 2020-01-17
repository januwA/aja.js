import { arrayp } from "../utils/p";
import { Pipes } from "./pipes";
import { AjaModule, Widget, Pipe } from "../metadata/directives";
import { AjaWidgetProvider, Widgets } from "./aja-weidget-provider";
import { Type } from "../interfaces/type";
import { ANNOTATIONS } from "../utils/decorators";
import { ParseAnnotations } from "../utils/parse-annotations";

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
    const hasModule = AjaModules.has(moduleName);
    if (hasModule) {
      ajaModule = AjaModules.get(moduleName);
    } else {
      const ajaModuleProvider = createAjaModuleProvider(ajaModuleItem);
      if (ajaModuleProvider) {
        ajaModule = ajaModuleProvider;
        AjaModules.add(moduleName, ajaModule);
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

/**
 * 导入其它模块的导出
 * @param exportModule
 * @param importModule
 */
function parseExports(
  exportModule: AjaModuleProvider,
  importModule: AjaModuleProvider
) {
  exportModule.exports?.forEach(el => {
    const parseAnnotations = new ParseAnnotations(el);
    if (parseAnnotations.annotations) {
      if (parseAnnotations.isWidget) {
        const widgetMetaData = parseAnnotations.annotations as Widget;
        if (exportModule.hasWidget(widgetMetaData.selector)) {
          importModule.addWidget(widgetMetaData.selector);
        }
      } else if (parseAnnotations.isPipe) {
        const pipeMetaData = parseAnnotations.annotations as Pipe;
        if (exportModule.hasPipe(pipeMetaData.name)) {
          importModule.addPipe(pipeMetaData.name);
        }
      }
    }
  });
}

function parseDeclarations(m: AjaModuleProvider) {
  m.declarations?.forEach(el => {
    const parseAnnotations = new ParseAnnotations(el);
    if (parseAnnotations.annotations) {
      if (parseAnnotations.isWidget) {
        const widgetMetaData = parseAnnotations.annotations as Widget;
        Widgets.addWidget({
          widgetMetaData,
          module: m,
          widget: el
        });
        m.addWidget(widgetMetaData.selector);
      } else if (parseAnnotations.isPipe) {
        const pipeMetaData = parseAnnotations.annotations as Pipe;
        if (!Pipes.has(pipeMetaData.name)) {
          m.addPipe(pipeMetaData.name);
          Pipes.add(pipeMetaData.name, el);
        } else {
          throw `Error: Pipe ${pipeMetaData.name}已经注册。`;
        }
      }
    }
  });
}

export function bootstrapModule(
  moduleType: Type<any>,
  opt?: {
    prefix: string;
  }
) {
  if (opt && opt.prefix) AjaWidgetProvider.prefix = `${opt.prefix}-`;
  const ajaModuleProvider = createAjaModuleProvider(moduleType);
  if (ajaModuleProvider) {
    AjaModules.add(moduleType.name, ajaModuleProvider);

    const bootstrap = arrayp(ajaModuleProvider.bootstrap)
      ? ajaModuleProvider.bootstrap[0]
      : ajaModuleProvider.bootstrap;
    if (bootstrap) {
      // 解析 declarations
      parseDeclarations(ajaModuleProvider);

      // 解析imports导入的模块
      parseImports(ajaModuleProvider);

      const meta = new ParseAnnotations(bootstrap);
      if (meta.annotations && meta.isWidget) {
        const widgetMetaData = meta.annotations;
        const host = document.querySelector<HTMLElement>(
          widgetMetaData.selector
        );
        if (host) {
          if (ajaModuleProvider.hasWidget(widgetMetaData.selector)) {
            new AjaWidgetProvider({
              widgetItem: Widgets.getWidget(widgetMetaData.selector),
              host
            });
          }
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

  static add(name: string, m: AjaModuleProvider) {
    if (this.has(name)) {
      throw `模块[${name}]已存在`;
    }
    this._modules[name] = m;
  }

  static get(name: string) {
    return this._modules[name];
  }

  static has(name: string) {
    return !!this.get(name);
  }

  static get modules() {
    return this._modules;
  }
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
    [widgetName: string]: boolean;
  } = {};

  addWidget(widgetName: string): void {
    this._widgets[widgetName] = true;
  }

  /**
   *
   * @param name app-home or APP-HOME
   */
  hasWidget(name: string): boolean {
    return !!this._widgets[name.toLowerCase()];
  }

  private _pipes: { [pipeName: string]: boolean } = {};

  hasPipe(name: string): boolean {
    return !!this._pipes[name];
  }

  addPipe(name: string): void {
    this._pipes[name] = true;
  }
}
