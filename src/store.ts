import { arrayp, objectp } from "./utils/p";
import { equal } from "./utils/util";

const l = console.log;

/**
 * state 对象
 */
export interface State {
  [key: string]: any;
}

/**
 * 事件函数
 */
export interface Actions {
  [key: string]: any;
}

/**
 * 计算函数
 */
export interface Computeds {
  [key: string]: Function;
}

export interface StoreOptions {
  state: State;
  actions?: Actions;
  computeds?: Computeds;
  context?: any;
}

export interface ListenerStateListInterface {
  (): any[];
}

export interface CbListInterface {
  (state: any[]): void;
}

export interface ReactionListenersInterface {
  listenerStateList: ListenerStateListInterface;
  cb: CbListInterface;
}

const reactionListeners: ReactionListenersInterface[] = [];
function reactionUpdate(some: any) {
  for (const reactionItem of reactionListeners) {
    const stateList: any[] = reactionItem.listenerStateList();
    // equal 深比较
    l(some, stateList[0])
    if (stateList.some(e => equal(e, some))) {
      reactionItem.cb(stateList);
    }
  }
}
/**
 * * 监听指定属性的变更
 * @param listenerStateList
 * @param cb
 *
 * ## Example
 *
 * ```ts
 * let store = new Store({
 *    state: {
 *      name: 22,
 *      age: 22
 *    }
 *  });
 *
 *  reaction(
 *    () => [store.name],
 *    state => {
 *      l(state); // ["ajanuw"]
 *    }
 *  );
 *
 *  store.age = 12;
 *  store.name = "ajanuw";
 * ```
 */
export function reaction(
  listenerStateList: ListenerStateListInterface,
  cb: CbListInterface
) {
  cb(listenerStateList());
  reactionListeners.push({
    listenerStateList,
    cb
  });
}

const autorunListeners: Function[] = [];
function autorunUpdate() {
  for (const f of autorunListeners) {
    f();
  }
}
/**
 * * 任意一个属性的变化，都会触发所有的监听事件
 * @param f
 *
 * ## Example
 *
 * ```ts
 * let store = new Store({
 *    state: {
 *      name: 22,
 *      age: 22
 *    }
 *  });
 *
 *  autorun(() => {
 *      l('state change'); // x 3
 *    }
 *  );
 *
 *  store.age = 12;
 *  store.name = "ajanuw";
 * ```
 */
export const autorun = (f: Function) => {
  f();
  autorunListeners.push(f);
};

export class Store {
  public $actions!: Actions;

  /**
   *
   * @param state 需要代理的数据
   */
  constructor({ state, computeds, actions }: StoreOptions) {
    Store.map(state, this);

    if (computeds) {
      for (const k in computeds) {
        Object.defineProperty(this, k, {
          get() {
            return computeds[k].call(this);
          },
          enumerable: true
        });
      }
    }

    // 只把actions绑定在store上
    if (actions) {
      this.$actions = actions;
      // 在actions中调用this.m()
      Object.assign(this, actions);
    }
  }

  /**
   * * 代理每个属性的 get， set
   */
  static map(object: State, context = {}): {} {
    for (const k in object) {
      Object.defineProperty(context, k, {
        get() {
          let v = object[k];

          if (arrayp(v)) {
            v = Store.list(v);
          }

          if (objectp(v)) {
            v = Store.map(v);
          }
          return v;
        },
        set(newValue) {
          // 设置了同样的值， 将跳过
          if (equal(newValue, object[k])) return;
          object[k] = newValue;
          autorunUpdate();
          reactionUpdate(object[k]);
        },
        enumerable: true,
        configurable: true
      });
    }

    return context;
  }

  /**
   * * 拦截数组的非幕等方, 并循环代理每个元素
   * @param list
   */
  static list(list: any[]): any[] {
    const resriteMethods = [
      "push",
      "pop",
      "shift",
      "unshift",
      "splice",
      "sort",
      "reverse"
    ];

    const proto = Object.create(Array.prototype);

    resriteMethods.forEach(m => {
      const original = (proto as { [k: string]: any })[m];
      Object.defineProperty(proto, m, {
        value: function(...args: any[]) {
          const r = original.apply(list, args);
          // 跟新
          autorunUpdate();
          reactionUpdate(list);
          return r;
        },
        writable: true, // value才能被赋值运算符改变 =
        configurable: true, // 能改变，删除
        enumerable: false // 可被枚举 for(let i in o)
      });
    });

    // 遍历代理数组每项的值
    const newList = list.map(el => {
      if (objectp(el)) {
        return Store.map(el);
      }
      if (arrayp(el)) {
        return Store.list(el);
      }
      return el;
    });

    Object.setPrototypeOf(newList, proto);
    return newList;
  }
}
