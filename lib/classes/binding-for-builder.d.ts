import { ContextData } from "./context-data";
export declare class BindingForBuilder {
    node: HTMLElement;
    contextData: ContextData;
    /**
     * * 一个注释节点
     */
    private commentNode?;
    private fragment?;
    private forBuffer;
    forAttr?: Attr;
    constructor(node: HTMLElement, contextData: ContextData);
    get hasForAttr(): boolean;
    private get forAttrValue();
    get bindVar(): string;
    get bindKey(): string;
    get bindValue(): string | undefined;
    get bindData(): string | undefined;
    get isNumberData(): boolean | undefined;
    get pipes(): string[];
    /**
     * * 将所有节点插入DOM
     * @param data
     */
    draw(data: any): void;
    /**
     * * 清除所有节点
     */
    clear(): void;
    createForContextState(k: any, v?: any, isNumber?: boolean): {};
    private createForCommentData;
    createItem(): Node;
}
