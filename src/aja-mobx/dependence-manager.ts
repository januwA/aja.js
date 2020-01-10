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
    [id: string]: {
      target: any;
      watchers: any[];
    };
  } = {};

  /**
   * 填一个当前栈中的依赖到 store 中
   * @param id
   */
  static _add(id: string) {
    this._store[id] = this._store[id] || {};
    this._store[id].target = this._lastTarget;
    this._store[id].watchers = this._store[id].watchers || [];
    this._store[id].watchers.push(this._lastObserver);
  }

  /**
   * 向[id]的所有监听者发出信号, value改变了，快做出响应
   * @param id
   */
  static trigger(id: string) {
    var ds = this._store[id];
    ds?.watchers?.forEach((d: Function) => {
      d.call(ds.target || this);
    });
  }

  /**
   * 开始收集依赖
   * @param observer
   * @param target computed时，会传入target
   */
  static beginCollect(observer: Function, target: any = null) {
    this._observers.push(observer);
    this._targets.push(target);
  }

  /**
   * 收集依赖
   * @param id
   * @returns {boolean}
   */
  static collect(id: string) {
    if (this._lastObserver) {
      this._add(id);
    }
    return false;
  }

  /**
   * 结束收集依赖
   */
  static endCollect() {
    this._observers.pop();
    this._targets.pop();
  }

  static delete(id: string): boolean {
    return Reflect.deleteProperty(this._store, id);
  }
}
