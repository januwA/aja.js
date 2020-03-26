import { arrayp } from "../utils/p";
import { AjaModule } from "../metadata/directives";
import { WidgetProxy } from "./widget-proxy";
import { Type } from "../interfaces/type";
import { ParseAnnotations } from "../utils/parse-annotations";
import { createDefaultPipes } from "../utils/create-default-pipes";
import { ModuleFactory } from "../factory/module-factory";
import { WidgetFactory } from "../factory/widget-factory";

/**
 *
 * @param moduleType 导入的根模块
 * @param opt 一些配置选项
 */
export function bootstrapModule(
  moduleType: Type<any>,
  opt?: {
    prefix: string;
  }
) {
  if (opt && opt.prefix) WidgetProxy.prefix = `${opt.prefix}-`;
  createDefaultPipes();
  new ModuleFactory(moduleType.name).value;
  const { value: ajaModuleProxy } = new ModuleFactory(moduleType.name);
  if (ajaModuleProxy) {
    const bootstrap = arrayp(ajaModuleProxy.bootstrap)
      ? ajaModuleProxy.bootstrap[0]
      : ajaModuleProxy.bootstrap;
    if (bootstrap) {
      const meta = new ParseAnnotations(bootstrap);
      if (meta.annotations && meta.isWidget) {
        const widgetMetaData = meta.annotations;
        const host = document.querySelector<HTMLElement>(
          widgetMetaData.selector
        );
        if (host) {
          if (ajaModuleProxy.hasWidget(widgetMetaData.selector)) {
            new WidgetProxy({
              widget: new WidgetFactory(widgetMetaData.selector).value,
              host,
              module: ajaModuleProxy
            });
          }
        }
      }
    }
  }
}

export class ModuleProxy {
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

  private _widgets = new Map<string, boolean>();

  addWidget(widgetName: string): void {
    this._widgets.set(widgetName, true);
  }

  /**
   *
   * @param name app-home or APP-HOME
   */
  hasWidget(name: string): boolean {
    return this._widgets.has(name.toLowerCase());
  }
}
