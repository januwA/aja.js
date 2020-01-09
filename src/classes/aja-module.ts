import { Type } from "../aja";

export const ANNOTATIONS = "__annotations__";

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
  return DecoratorFactory as any;
}

export const AjaModule: AjaModuleDecorator = makeDecorator(
  (opts: AjaModule) => opts
);
