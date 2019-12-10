import { objectp, arrayp } from "./utils/util";

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
  computeds: Computeds;
  context?: any;
}

export const autorun = (f: Function) => {
  f();
  Store.autorunListeners.push(f);
};

export class Store {
  /**
   * * 任意一个属性的变化，都会触发所有的监听事件
   */
  static autorunListeners: Function[] = [];
  public $actions!: Actions;
  private $state!: State;

  constructor({ state, computeds, actions, context }: StoreOptions) {
    const _that = context ? context : this;

    // _that.$state = state;
    for (const k in state) {
      Object.defineProperty(_that, k, {
        get() {
          let value = state[k];
          if (Store._isObject(state[k])) {
            value = new Store({
              state: value,
              computeds: {},
              context: arrayp(value) ? [] : {}
            });
          }
          return value;
        },
        set(newValue) {
          state[k] = newValue;

          for (const f of Store.autorunListeners) {
            f();
          }
        },
        enumerable: true,
        configurable: true
      });
    }

    for (const k in computeds) {
      Object.defineProperty(_that, k, {
        get() {
          return computeds[k].call(_that);
        },
        enumerable: true
      });
    }

    // 只把actions绑定在store上
    if (actions) {
      this.$actions = actions;
      // 在actions中调用this.m()
      Object.assign(this, actions);
    }

    if (context) return context;
  }

  /**
   * 跳过null和空的对象
   * @param val
   */
  private static _isObject(val: any): boolean {
    return typeof val === "object" && val !== null;
  }

  public toString(): string {
    return JSON.stringify(this.$state);
  }
}
