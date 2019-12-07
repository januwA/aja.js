const l = console.log;

/**
 * state 对象
 */
export interface State {
  [key: string]: any;
}

/**
 * 事件函数对象
 */
export interface Actions {
  [key: string]: Function;
}

/**
 * 计算函数
 */
export interface Computeds {
  [key: string]: Function;
}

export interface Store {
  state?: State;
  actions?: Actions;
  computeds?: Computeds;
}
const listeners: Function[] = [];

export const autorun = (f: Function) => {
  f();
  listeners.push(f);
};

export function createState(obj?: State): State {
  return obj ? obj : {};
}
export function createActions(obj?: Actions): Actions {
  return obj ? obj : {};
}
export function createComputeds(obj?: Computeds): Computeds {
  return obj ? obj : {};
}

export function createStore({ state, computeds, actions }: Store): any {
  let _result: Object = {};
  for (let k in state) {
    // 将所有state，重新代理
    Object.defineProperty(_result, k, {
      get: function proxyGetter() {
        let value;
        if (typeof state[k] === "object") {
          value = createStore({
            state: state[k]
          });
        } else {
          value = state[k];
        }
        return value;
      },
      set: function proxySetter(value) {
        state[k] = value;
        // 设置的时候调用回调
        for (const f of listeners) {
          f();
        }
      },
      enumerable: true,
      configurable: true
    });
  }
  for (let k in computeds) {
    Object.defineProperty(_result, k, {
      get: function proxyGetter() {
        return computeds[k].call(this);
      }
    });
  }
  Object.assign(_result, actions);
  return _result;
}
