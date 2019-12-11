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
    private $state;
    constructor({ state, computeds, actions, context }: StoreOptions);
    /**
     * 跳过null和空的对象
     * @param val
     */
    private static _isObject;
    toString(): string;
}
