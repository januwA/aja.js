import { Computeds } from "./store";
interface ModelData {
    [key: string]: any;
}
interface ModelInterface {
    data?: ModelData;
    readonly methods?: {
        [key: string]: Function;
    };
    readonly computeds?: Computeds;
}
/**
 * *  指令前缀
 * [:for] [:if]
 */
export declare const instructionPrefix = ":";
export declare function define(view: string | HTMLElement, model: ModelInterface): null | {
    [key: string]: any;
};
export {};
