import { Computeds } from "./store";
export interface ModelData {
    (): {
        [key: string]: any;
    };
}
export interface ModelInterface {
    readonly data?: ModelData;
    readonly methods?: {
        [key: string]: Function;
    };
    readonly computeds?: Computeds;
}
export declare class Aja {
    static define(view: string | HTMLElement, model: ModelInterface): any;
}
