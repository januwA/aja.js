import { SetDataCallBack } from "../aja";
export declare class BindingModelBuilder {
    node: HTMLElement;
    modelAttr: Attr;
    input: HTMLInputElement | undefined;
    checkbox: HTMLInputElement | undefined;
    radio: HTMLInputElement | undefined;
    select: HTMLSelectElement | undefined;
    get options(): HTMLOptionElement[];
    get selectValues(): string[];
    constructor(node: HTMLElement, modelAttr: Attr);
    private _setup;
    checkboxSetup(states: any[], isArray: boolean): void;
    checkboxChangeListener(isArray: boolean, data: any, setData: SetDataCallBack): void;
    radioSetup(states: any[]): void;
    radioChangeListener(setData: SetDataCallBack): void;
    inputSetup(states: any[]): void;
    inputChangeListener(setData: SetDataCallBack): void;
    selectSetup(states: any[]): void;
    selectChangeListener(setData: SetDataCallBack): void;
    /**
     * * 控件的值有效时
     */
    valid(): void;
    /**
     * * 控件的值无效时
     */
    invalid(): void;
    /**
     * * 控件的值发生变化
     */
    dirty(): void;
    /**
     * * 控件被访问
     */
    touched(): void;
}
