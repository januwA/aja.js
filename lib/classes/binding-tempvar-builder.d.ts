import { AjaModel } from "./aja-model";
export interface TemplateVariableInterface {
    [key: string]: ChildNode | Element | HTMLElement | AjaModel;
}
export declare class BindingTempvarBuilder {
    /**
     * * 模板变量保存的DOM
     */
    templateVariables: TemplateVariableInterface;
    constructor(node: HTMLElement, templateVariables?: TemplateVariableInterface);
    has(key: string): boolean;
    get(key: string): HTMLElement | Element | ChildNode | AjaModel;
    set(key: string, value: any): void;
    copyWith(node: HTMLElement): BindingTempvarBuilder;
    /**
     * * 解析模板引用变量
     * @param root
     */
    private deepParse;
    /**
     * * 处理模板变量 #input 解析
     * @param node
     * @param param1
     */
    private _tempvarBindHandle;
}
