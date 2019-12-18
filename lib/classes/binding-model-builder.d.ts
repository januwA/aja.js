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
    setup(contextData: ContextData): void;
    private _checkboxSetup;
    private _checkboxChangeListener;
    private _radioSetup;
    private _radioChangeListener;
    private _inputSetup;
    private _inputChangeListener;
    private _selectSetup;
    private _selectChangeListener;
}
