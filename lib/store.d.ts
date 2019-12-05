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
    [key: string]: any;
}
export interface Store {
    state?: State;
    actions?: Actions;
    computeds?: Computeds;
}
export declare const autorun: (f: Function) => void;
export declare function createStore({ state, computeds, actions }: Store): any;
