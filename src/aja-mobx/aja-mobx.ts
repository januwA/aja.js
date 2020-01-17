import { Observable } from "./observable";
import { Input, Output } from "../metadata/directives";
import { AnyObject } from "../interfaces/any-object";
import { Type } from "../interfaces/type";
import { PROP_METADATA } from "../utils/decorators";
import { undefinedp } from "../utils/p";

function createObservable(obj: AnyObject, key: string) {
  let value = obj[key];
  // 强制绑定下函数的上下文
  if (typeof value === "function") {
    value = value.bind(obj);
  }
  if (typeof value === "object") {
  }

  const obser = new Observable(value);
  Object.defineProperty(obj, key, {
    get() {
      return obser.get();
    },
    set(newValue) {
      return obser.set(newValue);
    }
  });

  // 递归下去
  if (typeof value === "object") {
    observable.object(value);
  }
}

export function observable(
  value: number | string | null | undefined | boolean | Type<any>
): never; // use box or cls
export function observable<T>(value: T): T;
export function observable<T>(value: any): any {
  return observable.object(value);
}

function transform<T>(context: T, key: string, obj: AnyObject) {
  const des = Object.getOwnPropertyDescriptor(obj, key);
  if (des) {
    if (des.hasOwnProperty("value")) {
      let value = obj[key];

      if (typeof value === "function") {
        value = value.bind(context);
      }

      // if (typeof value === "object") {
      //   value = Object.assign({}, value);
      // }
      try {
        const obser = new Observable(value);

        Object.defineProperty(context, key, {
          get() {
            return obser.get();
          },
          set(newValue) {
            return obser.set(newValue);
          },
          enumerable: true
        });

        // 递归下去
        if (value !== null && typeof value === "object") {
          observable.object(value);
        }
      } catch (error) {
        console.error(`构建Observable出现错误: {key: ${key}, value: ${value}}`);
        console.error(error);
      }
    } else if (des.get) {
      const getter = des.get;
      Object.defineProperty(context, key, {
        get() {
          return getter.call(context);
        },
        set: des.set,
        configurable: des.configurable,
        enumerable: des.enumerable
      });
    }
  }
}

export namespace observable {
  export function box<T = any>(value: T): Observable<T> {
    return new Observable(value);
  }

  export function object<T = any>(
    obj: T,
    result?: AnyObject,
    depath: boolean = false
  ) {
    const context = result ? result : obj;
    Object.keys(obj).forEach(key => {
      transform(context, key, obj);
    });

    // 获取原型上的方法
    if (depath) {
      const prototype = Object.getPrototypeOf(obj);
      (<string[]>Reflect.ownKeys(prototype)).forEach(key => {
        transform(context, key, prototype);
      });
    }
    return context;
  }

  export function cls<T>(
    cls: Type<T>,
    metadataCallback?: (
      metadata:
        | {
            [key: string]: (Input | Output)[];
          }
        | undefined
    ) => void
  ) {
    const context: T = new cls();

    // 先获取注入的元数据
    if (metadataCallback) {
      const constructor = (context as any).constructor;
      constructor.hasOwnProperty(PROP_METADATA)
        ? metadataCallback(constructor[PROP_METADATA])
        : metadataCallback(undefined);
    }

    observable.object(context);

    (<string[]>Reflect.ownKeys(cls.prototype)).forEach(key => {
      transform(context, key, cls.prototype);
    });

    return context;
  }
}

export function extendObservable(target: any, obj: { [key: string]: any }) {
  for (const key in obj) {
    target[key] = obj[key];
    transform(target, key, target);
  }
  return target;
}
