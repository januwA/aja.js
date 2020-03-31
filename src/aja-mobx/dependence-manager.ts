/**
 * 依赖收集器
 */
export class DependenceManager {
  /**
   * 所有的依赖监听函数，通常是[autorun]函数的参数
   */
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
  static _store: Map<
    number,
    {
      /**
       * 上下文对象
       */
      target: any;
      watchers: Function[];
    }
  > = new Map();

  /**
   * 添加依赖
   * @param id
   */
  static _add(id: number) {
    // 如果存在，则在响应事件数组[watchers]中添加[_lastObserver]
    if (this._store.has(id)) {
      const map = this._store.get(id);
      map!.target = this._lastTarget;

      // 避免多次调用一个观察者
      // autorun(() => {
      //   console.log(obj.hello);
      //   console.log(obj.hello);
      // });
      // 如果上面的代码不添加下面的if处理
      // watchers = [fn, fn]
      // 下次响应的时候将会打印4次
      if (!map!.watchers.includes(this._lastObserver!)) {
        map!.watchers.push(this._lastObserver!);
      }
    } else {
      // 不存在，则初始化
      this._store.set(id, {
        target: this._lastTarget,
        watchers: [this._lastObserver!]
      });
    }
  }

  /**
   * update
   *
   * 向[name]的所有监听者[watchers]发出信号, value改变了，快做出响应
   * @param id
   */
  static trigger(id: number) {
    var ds = this._store.get(id);
    ds?.watchers?.forEach((fn: Function) => {
      fn.call(ds?.target || this);
    });
  }

  /**
   * 开始收集 observer
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
   * 在收集收集依赖期间，添加观察者
   * @param id
   */
  static collect(id: number) {
    if (this._lastObserver) this._add(id);
  }
}
