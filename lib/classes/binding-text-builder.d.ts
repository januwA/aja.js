import { ContextData } from "./context-data";
export declare class BindingTextBuilder {
    private node;
    /**
     * * 保存插值表达式的模板，千万不要改变
     */
    text: string;
    constructor(node: ChildNode);
    setText(contextData: ContextData): void;
}
