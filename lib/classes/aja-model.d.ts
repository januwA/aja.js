export declare class AjaModel {
    node: HTMLInputElement;
    static classes: {
        touched: string;
        untouched: string;
        dirty: string;
        pristine: string;
        valid: string;
        invalid: string;
    };
    get model(): string;
    get name(): any;
    get value(): string;
    get disabled(): boolean;
    get enabled(): boolean;
    control: {
        [k: string]: any;
    };
    get dirty(): boolean;
    get pristine(): boolean;
    get valid(): boolean;
    get invalid(): boolean;
    get touched(): boolean;
    get untouched(): boolean;
    constructor(node: HTMLInputElement);
    private _setup;
}
