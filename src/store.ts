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
  private $state: State;

  constructor({ state, computeds, actions }: StoreOptions) {
    this.$state = state;
    for (const k in state) {
      const _that = this;
      Object.defineProperty(this, k, {
        get() {
          let value = state[k];
          if (_that._isObject(state[k])) {
            value = new Store({
              state: value,
              computeds: {}
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
      Object.defineProperty(this, k, {
        get() {
          return computeds[k].call(this);
        },
        enumerable: true
      });
    }
    if (actions) {
      this.$actions = actions;
      // 在actions中调用this.m()
      Object.assign(this, actions);
    }
  }

  private _isObject(val: any): boolean {
    return typeof val === "object" && val !== null;
  }

  public toString(): string {
    return JSON.stringify(this.$state);
  }
}
