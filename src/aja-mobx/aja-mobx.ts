import { Observable } from "./observable";
import { AnyObject, Type } from "../interfaces";

function isObservable(value: any): boolean {
  if (value === null || value === undefined) return false;
  return value.hasOwnProperty("__isObservable");
}

/**
 *
 * @param context 最后返回的代理对象
 * @param key 在[obj]中的[key]
 * @param obj input的object
 */
function transform<T>(context: T, key: string, obj: AnyObject) {
  const des = Object.getOwnPropertyDescriptor(obj, key);

  if (des) {
    if (des.hasOwnProperty("value")) {
      let value = obj[key];
      if (isObservable(value)) return;
      if (typeof value === "function") {
        value = value.bind(context);
      }

      try {
        const obser = new Observable(value);

        Object.defineProperty(context, key, {
          get() {
            return obser.get();
          },
          set(newValue) {
            return obser.set(newValue);
          },
          enumerable: true,
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
        enumerable: des.enumerable,
      });
    }
  }
}

export interface Iobservable {
  (value: any): any;

  box<T = any>(value: T): Observable<T>;
  object<T = any>(
    obj: T,
    opt?: {
      result?: AnyObject;
      depath: boolean;
    }
  ): AnyObject;

  cls<T>(
    cls: Type<T>,
    metadataCallback?: (resultObject: T) => void,
    args?: any[]
  ): T;
}

export const observable: Iobservable = function (value: any) {
  return observable.object(value);
};
observable.box = function box<T = any>(value: T): Observable<T> {
  return new Observable(value);
};
observable.object = function object<T = any>(
  obj: T,
  opt?: {
    result?: AnyObject;
    depath: boolean;
  }
) {
  const context = opt?.result ? opt.result : obj;
  Object.keys(obj).forEach((key) => {
    transform(context, key, obj);
  });

  // 获取原型上的方法
  if (opt?.depath) {
    const prototype = Object.getPrototypeOf(obj);
    (<string[]>Reflect.ownKeys(prototype)).forEach((key) => {
      transform(context, key, prototype);
    });
  }

  Object.defineProperty(context, "__isObservable", { value: true });
  return context;
};

/**
 * 将一个类实例化，在代理所有属性，并将所有方法的this绑定在实例后的对象上，返回实例对象
 * @param cls 需要实例化的类
 * @param metadataCallback 实例化之后立即调用该回调函数
 * @param ctorParameters  实例化需要的构造参数
 */
observable.cls = function cls<T>(
  cls: Type<T>,
  metadataCallback?: (resultObject: T) => void,
  ctorParameters: any[] = []
) {
  const context: any = new cls(...ctorParameters);

  // 先获取注入的元数据
  if (metadataCallback) metadataCallback(context as T);

  observable.object(context);

  // 下面被注释的代码为了避免上下文的改变
  // ```
  // const change = obj.change;
  // change(); // 找不到this
  // ```
  //
  (<string[]>Reflect.ownKeys(cls.prototype)).forEach((key) => {
    if (key in context && typeof context[key] === "function") {
      context[key] = context[key].bind(context);
    }
  });

  Object.defineProperty(context, "__isObservable", { value: true });
  return context as T;
};

export function extendObservable(target: any, obj: AnyObject) {
  for (const key in obj) {
    target[key] = obj[key];
    transform(target, key, target);
  }
  Object.defineProperty(target, "__isObservable", { value: true });
  return target;
}
