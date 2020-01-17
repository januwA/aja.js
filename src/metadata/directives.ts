import { Type } from "../interfaces/type";
import {
  TypeDecorator,
  makeDecorator,
  makePropDecorator
} from "../utils/decorators";

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
  (opts: AjaModule) => opts
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
  (opts: Widget) => opts
);

export interface Pipe {
  /**
   * 管道名
   */
  name: string;
}
export interface PipeDecorator {
  (obj: Pipe): TypeDecorator;
  new (obj: Pipe): Pipe;
}
export const Pipe: PipeDecorator = makeDecorator("Pipe", (p: Pipe) => p);
