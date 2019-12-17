import { ContextData } from "./context-data";
export declare class BindingModelBuilder {
    node: HTMLElement;
    input?: HTMLInputElement;
    checkbox?: HTMLInputElement;
    radio?: HTMLInputElement;
    select?: HTMLSelectElement;
    get options(): HTMLOptionElement[];
    get selectValues(): string[];
    modelAttr?: Attr;
    constructor(node: HTMLElement);
    private _setup;
    checkboxSetup(data: any): void;
    checkboxChangeListener(data: any, contextData: ContextData): void;
    radioSetup(states: any[]): void;
    radioChangeListener(contextData: ContextData): void;
    inputSetup(states: any[]): void;
    inputChangeListener(contextData: ContextData): void;
    selectSetup(states: any[]): void;
    selectChangeListener(contextData: ContextData): void;
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
