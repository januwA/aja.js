import { DependenceManager } from "./dependence-manager";
import { arrayp } from "../utils/p";

/**
 * 每个[Observable]都有一个唯一的name
 */
export class Observable<T> {
  private static _obIDCounter = 1;

  static getId(): number {
    return Observable._obIDCounter++;
  }

  readonly id: number;

  /**
   * 真实值
   * @type {null}
   */
  value: any = null;

  constructor(value: any) {
    this.id = Observable.getId();
    if (arrayp(value)) {
      this.value = this._wrapArrayProxy(value);
    } else {
      this.value = value;
    }
  }

  get() {
    // 调用依赖收集器，将此observable加入store
    DependenceManager.collect(this.id);
    return this.value;
  }

  set(v: any) {
    // 设置相同的值无效
    if (v === this.value) return;
    if (Array.isArray(v)) {
      this.value = this._wrapArrayProxy(v);
    } else {
      this.value = v;
    }
    this.trigger();
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
  _wrapArrayProxy(arrValue: any[]) {
    return new Proxy(arrValue, {
      set: (arr, index, newValue) => {
        (<any>arr)[index] = newValue;
        // 每当数组每一项的改变，都触发观察者做出相应
        if (index !== "length") this.trigger();
        return true;
      }
    });
  }
}
