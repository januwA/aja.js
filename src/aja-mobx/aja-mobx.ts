import { Observable } from "./observable";
import { AnyObject, Type } from "./interfaces";

function createObservable(obj: AnyObject, key: string) {
  let value = obj[key];
  // 强制绑定下函数的上下文
  if (typeof value === "function") {
    value = value.bind(obj);
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

function transform<T>(context: T, key: string, o: any) {
  const des = Object.getOwnPropertyDescriptor(o, key);
  if (des) {
    if (des.value) {
      createObservable(context, key);
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
  export function box<T = any>(value: T) {
    return new Observable(value);
  }

  export function object<T = any>(obj: T) {
    Object.keys(obj).forEach(key => {
      transform(obj, key, obj);
    });
    return obj;
  }

  const filterMethods: string[] = [
    "constructor",
    "render",
    "inputChanges",
    "initState"
  ];

  export function cls<T>(cls: Type<T>) {
    const obj: T = new cls();
    observable.object(obj);

    (<string[]>Reflect.ownKeys(cls.prototype))
      .filter(name => !filterMethods.includes(name))
      .forEach(key => {
        transform(obj, key, cls.prototype);
      });

    return obj;
  }
}

export function extendObservable(target: any, obj: { [key: string]: any }) {
  for (let key in obj) {
    target[key] = obj[key];
    transform(target, key, target);
  }
}
