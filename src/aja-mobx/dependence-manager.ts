// 收集依赖系统
export class DependenceManager {
  private static _observers: Function[] = [];
  private static get _lastObserver(): null | Function {
    return this._observers.length > 0
      ? this._observers[this._observers.length - 1]
      : null;
  }

  private static _targets: any[] = [];
  private static get _lastTarget(): null | Function {
    return this._targets.length > 0
      ? this._targets[this._targets.length - 1]
      : null;
  }

  /**
   * 存储所有observable和handler的映射关系
   */
  static _store: {
    [name: string]: {
      target: any;
      watchers: any[];
    };
  } = {};

  /**
   * 填一个当前栈中的依赖到 store 中
   * @param name
   */
  static _add(name: string) {
    this._store[name] = this._store[name] || {};
    this._store[name].target = this._lastTarget;
    this._store[name].watchers = this._store[name].watchers || [];
    this._store[name].watchers.push(this._lastObserver);
  }

  /**
   * update
   * 
   * 向[name]的所有监听者发出信号, value改变了，快做出响应
   * @param name
   */
  static trigger(name: string) {
    var ds = this._store[name];
    ds?.watchers?.forEach((d: Function) => {
      d.call(ds.target || this);
    });
  }

  /**
   * 开始收集依赖
   * @param observer 这个参数普遍是autorun的callback函数
   * @param target computed时，会传入target
   */
  static beginCollect(observer: Function, target: any = null) {
    this._observers.push(observer);
    this._targets.push(target);
  }

  /**
   * 结束收集依赖
   */
  static endCollect() {
    this._observers.pop();
    this._targets.pop();
  }

  /**
   * 收集依赖
   * @param name
   */
  static collect(name: string) {
    if (this._lastObserver) {
      this._add(name);
    }
    return false;
  }
}
