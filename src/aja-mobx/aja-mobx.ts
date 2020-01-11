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

export namespace observable {
  export function box<T = any>(value: T) {
    return new Observable(value);
  }

  export function object<T = any>(obj: T) {
    Object.keys(obj).forEach(key => {
      const des = Object.getOwnPropertyDescriptor(obj, key);
      if (des) {
        if (des.value) {
          createObservable(obj, key);
        } else if (des.get) {
          const getter = des.get;
          Object.defineProperty(obj, key, {
            get() {
              return getter.call(this);
            }
          });
        }
      }
    });
    return obj;
  }

  export function cls<T>(cls: Type<T>) {
    const obj: T = new cls();
    observable.object.call(observable, obj);

    (<string[]>Reflect.ownKeys(cls.prototype)).forEach(key => {
      /// 属性描述对象
      const des = Object.getOwnPropertyDescriptor(cls.prototype, key);
      if (des) {
        if (des.value) {
          createObservable(obj, key);
        } else if (des.get) {
          const getter = des.get;
          // var computed = new Computed(obj, getter);
          Object.defineProperty(obj, key, {
            get() {
              return getter.call(obj);
              // computed.target = this;
              // return computed.get();
            }
          });
        }
      }
    });

    return obj;
  }
}
