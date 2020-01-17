import { DependenceManager } from "./dependence-manager";
import { arrayp } from "../utils/p";

/**
 * 每个[Observable]都有一个唯一的name
 */
export class Observable<T> {
  private static _obIDCounter = 1;

  static getName(): string {
    return "ob-" + ++Observable._obIDCounter;
  }

  readonly name: string = "";

  /**
   * 真实值
   * @type {null}
   */
  value: any = null;

  constructor(value: any) {
    this.name = Observable.getName();
    if (arrayp(value)) {
      this._wrapArrayProxy(value);
    } else {
      this.value = value;
    }
  }

  get() {
    // 这里的收集依赖，可能是在[autorun]里面
    DependenceManager.collect(this.name);
    return this.value;
  }

  set(v: any) {
    // 设置相同的值无效
    if (v === this.value) return;
    if (Array.isArray(v)) {
      this._wrapArrayProxy(v);
    } else {
      this.value = v;
    }
    this.trigger();
  }

  /**
   * 手动触发依赖
   */
  trigger() {
    DependenceManager.trigger(this.name);
  }

  /**
   * 对数组包装Proxy拦截数组操作的动作
   */
  _wrapArrayProxy(arrValue: any[]) {
    this.value = new Proxy(arrValue, {
      set: (arr, index, newValue) => {
        (<any>arr)[index] = newValue;
        if (index !== "length") this.trigger();

        //? 为什么要返回true
        return true;
      }
    });
  }
}
