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
export declare function reaction(listenerStateList: ListenerStateListInterface, cb: CbListInterface): void;
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
export declare const autorun: (f: Function) => void;
export declare class Store {
    $actions: Actions;
    /**
     *
     * @param state 需要代理的数据
     */
    constructor({ state, computeds, actions }: StoreOptions);
    /**
     * * 代理每个属性的 get， set
     */
    static map<T>(object: State, context: T): T;
    /**
     * * 拦截数组的非幕等方, 并循环代理每个元素
     * @param array
     */
    static list<T>(array: T[]): T[];
}
