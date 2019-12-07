import { Store } from "./store";
/**
 * *  指令前缀
 * [:for] [:if]
 */
export declare const instructionPrefix = ":";
export declare function define(view: string | HTMLElement, model: Store): null | {
    [key: string]: any;
};
