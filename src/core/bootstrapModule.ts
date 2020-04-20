import { createDefault } from "../utils/create-default";
import { ModuleFactory } from "../factory/module-factory";
import { WidgetFactory } from "../factory/widget-factory";
import { getAnnotations, getMetadataName } from "../utils/util";
import { Type } from "../interfaces";
import { WidgetProxy } from "../classes/widget-proxy";
import { AjaModulep, Widgetp } from "../utils/p";

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
  // 1 初始化配置
  if (opt && opt.prefix) WidgetProxy.prefix = `${opt.prefix}-`;
  createDefault();

  if (!AjaModulep(moduleType)) {
    throw `请使用@AjaModule创建模块`;
  }

  const moduleProxy = new ModuleFactory(moduleType.name).value;

  if (!moduleProxy.bootstrap?.length) return;
  const bootstrapWidget = moduleProxy.bootstrap[0];

  if (!Widgetp(bootstrapWidget)) throw `请用@Widget创建组件.`;

  const annotations = getAnnotations(bootstrapWidget);
  const widgetConfig = new WidgetFactory(annotations.selector).value;

  const widgetProxy = new WidgetProxy({
    widget: widgetConfig,
    module: moduleProxy,
  });
  widgetProxy.initState();
  widgetProxy.clearInnerHTML();
  widgetProxy.toElement();
  widgetProxy.viewInit();
}
