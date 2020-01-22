import "reflect-metadata";
import { Type } from "../interfaces/type";
import { AjaModule } from "../metadata/directives";
import { Services } from "../classes/services";

/**
 * 装饰器
 */

export const ANNOTATIONS = "__annotations__";
export const PROP_METADATA = "__prop__metadata__";
export const METADATANAME = "metadataName";

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

/**
 * 类装饰器
 * 如： @Widhet() @Piper() @AjaModule()
 * @param name
 * @param props
 */
export function makeDecorator<T>(
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
      if (name === "Widget") {
        annotationInstance.ctorParameters = [];
        const paramtypes: Type<any>[] = Reflect.getMetadata(
          "design:paramtypes",
          cls
        );
        if (paramtypes && paramtypes.length) {
          paramtypes.forEach(param => {
            if(Services.has(param.name)){
              annotationInstance.ctorParameters.push(Services.get(param.name));
            }
            
          });
        }
      }
      
      if (name === "Injectable") {
        Services.add(cls);
      }
      return cls;
    };
  }

  DecoratorFactory.prototype[METADATANAME] = name;
  return DecoratorFactory as any;
}

/**
 * 属性装饰器
 * 如： @Input() @Output()
 * @param name
 * @param props
 */
export function makePropDecorator(
  name: string,
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
  PropDecoratorFactory.prototype[METADATANAME] = name;
  return PropDecoratorFactory;
}
