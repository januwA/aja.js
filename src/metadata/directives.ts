import { Type } from "../interfaces/type";
import {
  TypeDecorator,
  makeDecorator,
  makePropDecorator
} from "../utils/decorators";
import { PipeFactory } from "../factory/pipe-factory";
import { ServiceFactory } from "../factory/service-factory";
import { ModuleFactory } from "../factory/module-factory";
import { WidgetFactory } from "../factory/widget-factory";

export interface AjaModule {
  /**
   * 属于此模块的一组组件，[指令: 暂时没有这个]和管道（可声明）
   */
  declarations?: Array<Type<any>>;

  /**
   * 导入模块中的导出
   */
  imports?: Array<Type<any>>;

  /**
   * 在此Module中声明的组件，指令和管道的集合，
   * 可在作为导入此Module的一部分的任何组件的模板中使用。
   * 导出的声明是模块的公共API。
   */
  exports?: Array<Type<any>>;

  /**
   * 根组件
   */
  bootstrap?: Array<Type<any>>;
}

export interface AjaModuleDecorator {
  (opts?: AjaModule): TypeDecorator;
  new (opts?: AjaModule): AjaModule;
}

export const AjaModule: AjaModuleDecorator = makeDecorator(
  "AjaModule",
  (opts: AjaModule) => opts,
  cls => new ModuleFactory(cls.name, cls)
);

export interface Input {
  bindingPropertyName?: string;
}

export interface InputDecorator {
  (bindingPropertyName?: string): any;
  new (bindingPropertyName?: string): any;
}

/**
 * 使用:
 *
 * ```
 * class A {
 *   @Input() title = "";
 * }
 * ```
 *
 * 向A的实例的constructor注入一个不可枚举的属性[PROP_METADATA], 默认是{} 。
 * 让后再把title写进去: { title, ... }, title的值是PropDecoratorFactory实例
 */
export const Input: InputDecorator = makePropDecorator(
  "Input",
  (bindingPropertyName: string) => ({ bindingPropertyName })
);

export interface Output {
  bindingPropertyName?: string;
}
export interface OutputDecorator {
  (bindingPropertyName?: string): any;
  new (bindingPropertyName?: string): any;
}
export const Output: OutputDecorator = makePropDecorator(
  "Output",
  (bindingPropertyName?: string) => ({ bindingPropertyName })
);

export interface Widget {
  /**
   * widget 标签
   */
  selector: string;

  /**
   * 模板位置
   */
  template: string;

  /**
   * 样式位置
   */
  styleUrls?: string[];
}

export interface WidgetDecorator {
  (obj: Widget): TypeDecorator;
  new (obj: Widget): Widget;
}

export const Widget: WidgetDecorator = makeDecorator(
  "Widget",
  (opts: Widget) => opts,
  (cls, opt: Widget) => new WidgetFactory(opt.selector, cls)
);

/**
 * 在ng中，穿的的pipe需要在模块的[declarations]中声明
 *
 * ```html
 * <p>{{ 'ajanuw' | myHello }}</p>
 * ```
 *
 * 在@Pipe期间，将会被注入到工厂，如果要在某个模块中使用，还需要的[declarations]中声明
 */
export interface Pipe {
  /**
   * 在模板绑定中使用的管道名称
   * 通常使用[lowerCamelCase]
   */
  name: string;
}
export interface PipeDecorator {
  (obj: Pipe): TypeDecorator;
  new (obj: Pipe): Pipe;
}

/**
 * 
  @Pipe({
    name: "json"
  })
  class JsonPipe implements PipeTransform {
    transform(value: string) {
      return JSON.stringify(value, null, " ");
    }
  }
 */
export const Pipe: PipeDecorator = makeDecorator(
  "Pipe",
  (p: Pipe) => p,
  (cls, opt) => new PipeFactory(opt.name, cls)
);

export interface Injectable {}

export interface InjectableDecorator {
  (): TypeDecorator;
  new (): Injectable;
}

export const Injectable: InjectableDecorator = makeDecorator(
  "Injectable",
  undefined,
  cls => new ServiceFactory(cls.name, cls)
);
