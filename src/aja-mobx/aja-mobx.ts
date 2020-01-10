import { Observable } from "./observable";
import { AnyObject, Type } from "./interfaces";
function createObservableProperty(obj: AnyObject, key: string, isGet = false) {
  let value = obj[key];
  // 强制绑定下
  if (typeof value === "function") {
    value = value.bind(obj);
  }
  const observable = new Observable(value);
  Object.defineProperty(obj, key, {
    get() {
      return observable.get();
    },
    set(newValue) {
      return observable.set(newValue);
    }
  });

  //递归包装 observable
  if (typeof value === "object") {
    for (let k in value) {
      createObservableProperty(value, k, isGet);
    }
  }
}

export function createClass<T>(cls: Type<T>): T {
  const obj: T = new cls();
  Object.keys(obj).forEach(key => {
    createObservableProperty(obj, key);
  });

  (<string[]>Reflect.ownKeys(cls.prototype)).forEach(key => {
    /// 属性描述对象
    const des = Object.getOwnPropertyDescriptor(cls.prototype, key);
    if (des) {
      if (des.value) {
        createObservableProperty(obj, key);
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

export function createObservable<T>(obj: T): T {
  Object.keys(obj).forEach(key => {
    createObservableProperty(obj, key);
  });
  return obj;
}

export function createObservableBox<T>(value: T): Observable {
  return new Observable(value);
}
