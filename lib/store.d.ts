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
export interface Options {
    state: State;
    actions?: Actions;
    computeds: Computeds;
}
export declare const autorun: (f: Function) => void;
export declare class Store {
    /**
     * * 任意一个属性的变化，都会触发所有的监听事件
     */
    static autorunListeners: Function[];
    $actions: Actions;
    constructor({ state, computeds, actions }: Options);
}
