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
    static proxyObject(object: State, context: any): any;
    /**
     * * 拦截数组的非幕等方, 并循环代理每个元素
     * @param array
     */
    static proxyArray(array: any[]): any[];
}
