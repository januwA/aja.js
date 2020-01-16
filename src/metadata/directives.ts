import { Type } from "../../src/aja-mobx/interfaces";

export const ANNOTATIONS = "__annotations__";
export const PROP_METADATA = "__prop__metadata__";

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

export interface TypeDecorator {
  /**
   * 调用作为装饰器。
   */
  <T extends Type<any>>(type: T): T;
  (
    target: Object,
    propertyKey?: string | symbol,
    parameterIndex?: number
  ): void;
}

export interface AjaModuleDecorator {
  (opts?: AjaModule): TypeDecorator;
  new (opts?: AjaModule): AjaModule;
}

function makeMetadataCtor(props?: (...args: any[]) => any): any {
  return function ctor(this: any, opts: AjaModule) {
    if (props) {
      const values = props(opts);
      for (const propName in values) {
        this[propName] = values[propName];
      }
    }
  };
}

function makeDecorator<T>(
  name: string,
  props?: (...args: any[]) => any
): {
  new (...args: any[]): any;
  (...args: any[]): any;
  (...args: any[]): (cls: any) => any;
} {
  const metaCtor = makeMetadataCtor(props);
  function DecoratorFactory(
    this: unknown | typeof DecoratorFactory,
    ...args: any[]
  ): (cls: Type<T>) => any {
    if (this instanceof DecoratorFactory) {
      // 将options挂在[this]上
      metaCtor.apply(this, args);
      return this as typeof DecoratorFactory;
    }

    const annotationInstance = new (DecoratorFactory as any)(...args);
    return function TypeDecorator(cls: Type<T>) {
      const annotations = cls.hasOwnProperty(ANNOTATIONS)
        ? (cls as any)[ANNOTATIONS]
        : Object.defineProperty(cls, ANNOTATIONS, { value: [] })[ANNOTATIONS];
      annotations.push(annotationInstance);
      return cls;
    };
  }

  DecoratorFactory.prototype.metadataName = name;
  return DecoratorFactory as any;
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

export function makePropDecorator(
  metadataName: string,
  props?: (...args: any[]) => any
): any {
  const metaCtor = makeMetadataCtor(props);
  function PropDecoratorFactory(
    this: unknown | typeof PropDecoratorFactory,
    ...args: any[]
  ): any {
    // 这里的套路和[AjaModule]哪里差不多
    if (this instanceof PropDecoratorFactory) {
      metaCtor.apply(this, args);
      return this;
    }
    const decoratorInstance = new (<any>PropDecoratorFactory)(...args);
    function PropDecorator(target: any, propName: string) {
      const constructor = target.constructor;
      // 使用Object.defineProperty非常重要，因为它会创建不可枚举的属性，
      // 防止在子类化过程中复制属性。
      const meta = constructor.hasOwnProperty(PROP_METADATA)
        ? (constructor as any)[PROP_METADATA]
        : Object.defineProperty(constructor, PROP_METADATA, { value: {} })[
            PROP_METADATA
          ];
      meta[propName] = (meta.hasOwnProperty(propName) && meta[propName]) || [];
      meta[propName].unshift(decoratorInstance);
    }
    return PropDecorator;
  }

  // 将[metadataName]写在私有属性上
  PropDecoratorFactory.prototype.metadataName = metadataName;
  return PropDecoratorFactory;
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
