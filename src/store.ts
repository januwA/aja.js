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
  computeds?: Computeds;
  context?: any;
}

/**
 * * 任意一个属性的变化，都会触发所有的监听事件
 */
const autorunListeners: Function[] = [];

function updateAll() {
  for (const f of autorunListeners) {
    f();
  }
}

export const autorun = (f: Function) => {
  f();
  autorunListeners.push(f);
};

export class Store {
  public $actions!: Actions;
  private $state!: State;

  constructor({ state, computeds, actions, context }: StoreOptions) {
    const _that = context ? context : this;

    // _that.$state = state;
    for (const k in state) {
      let v = state[k];

      if (arrayp(v)) {
        // 如果是Array，那么拦截一些原型函数
        var aryMethods = [
          "push",
          "pop",
          "shift",
          "unshift",
          "splice",
          "sort",
          "reverse"
        ];
        var arrayAugmentations = Object.create(Array.prototype);

        aryMethods.forEach(method => {
          let original = (Array.prototype as { [k: string]: any })[method];
          arrayAugmentations[method] = function(...args: any[]) {
            // 将传递进来的值，重新代理
            const _applyArgs = new Store({
              state: args,
              context: []
            });

            // 调用原始方法
            const r = original.apply(this, _applyArgs);

            // 跟新
            updateAll();
            return r;
          };
        });

        v = (v as any[]).map(el => {
          return new Store({
            state: el,
            context: {}
          });
        });

        Object.setPrototypeOf(v, arrayAugmentations);
      }

      if (Store._isObject(v)) {
        if (objectp(v)) {
          const newContext = Object.create(v);
          v = new Store({
            state: v,
            context: newContext
          });
        }
      }

      state[k] = v;

      Object.defineProperty(_that, k, {
        get() {
          const _r = state[k];
          return _r;
        },
        set(newValue) {
          state[k] = newValue;
          updateAll();
        },
        enumerable: true,
        configurable: true
      });
    }

    if (computeds) {
      for (const k in computeds) {
        Object.defineProperty(_that, k, {
          get() {
            return computeds[k].call(_that);
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

function observifyArray(this: any, array: any[]) {
  var aryMethods = [
    "push",
    "pop",
    "shift",
    "unshift",
    "splice",
    "sort",
    "reverse"
  ];
  var arrayAugmentations = Object.create(Array.prototype);

  aryMethods.forEach(method => {
    let original = (Array.prototype as { [k: string]: any })[method];
    arrayAugmentations[method] = function(...args: any[]) {
      const r = original.apply(this, array);
      l(args[0], array);
      return r;
    };
  });
  Object.setPrototypeOf(array, arrayAugmentations);
}
