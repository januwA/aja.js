import { DependenceManager } from "./dependence-manager";
import { AnyObject } from "../interfaces/any-object";

export class Computed {
  private static _cpIDCounter = 1;

  static getId(): string {
    return "cp-" + ++Computed._cpIDCounter;
  }

  /**
   * 当前计算的值，如果
   */
  value = null;

  /**
   * 全局唯一的id
   * @type {number}
   */
  id: string = "";

  /**
   * 是否绑定过recompute依赖，只需要绑定一次
   * @type {boolean}
   */
  hasBindAutoReCompute = false;

  constructor(public target: AnyObject, public getter: Function) {
    this.id = Computed.getId();
  }

  /**
   * 依赖的属性发生变化的时候调用的函数
   */
  _reCompute() {
    if (this.getter) {
      this.value = this.getter.call(this.target);
      // 触发外部依赖的observer
      DependenceManager.trigger(this.id);
    }
  }

  /**
   * 绑定recompute 和 内部涉及到的观察值的关系
   * @private
   */
  private _bindAutoReCompute() {
    if (!this.hasBindAutoReCompute) {
      this.hasBindAutoReCompute = true;
      // 当计算get中引用的值变化的时候要触发 this.reCompute
      DependenceManager.beginCollect(this._reCompute, this);
      this._reCompute();
      DependenceManager.endCollect();
    }
  }

  /**
   * 供外部收集当前对象依赖的时候使用
   * @returns {*}
   */
  get() {
    this._bindAutoReCompute();
    DependenceManager.collect(this.id);
    return this.value;
  }
}

export function computed(target: any, name: string, descriptor: any) {
  const getter = descriptor.get;
  // 如果值是对象，为其值也创建observable
  var computed = new Computed(target, getter);

  return {
    enumerable: true,
    configurable: true,
    get() {
      computed.target = this;
      return computed.get();
    }
  };
}
