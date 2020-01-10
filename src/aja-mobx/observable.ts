import { DependenceManager } from "./dependence-manager";

export class Observable {
  private static _obIDCounter = 1;

  static getId(): string {
    return "ob-" + ++Observable._obIDCounter;
  }

  // 全局唯一 id
  id: string = "";

  /**
   * 真实值
   * @type {null}
   */
  value: any = null;

  constructor(value: any) {
    this.id = Observable.getId();
    if (Array.isArray(value)) {
      this._wrapArrayProxy(value);
    } else {
      this.value = value;
    }
  }

  get() {
    // 这里的收集依赖，可能是在[autorun]里面
    DependenceManager.collect(this.id);
    return this.value;
  }

  set(v: any) {
    if (Array.isArray(v)) {
      this._wrapArrayProxy(v);
    } else {
      this.value = v;
    }
    DependenceManager.trigger(this.id);
  }

  /**
   * 手动触发依赖
   */
  trigger() {
    DependenceManager.trigger(this.id);
  }

  /**
   * 对数组包装Proxy拦截数组操作的动作
   */
  _wrapArrayProxy(arr: any[]) {
    this.value = new Proxy(arr, {
      set: (obj, key, value) => {
        (<any>obj)[key] = value;
        if (key !== "length") this.trigger();

        //? 为什么要返回true
        return true;
      }
    });
  }
}
