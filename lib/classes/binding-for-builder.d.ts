export declare class BindingForBuilder {
    node: HTMLElement;
    forInstruction: string;
    /**
     * * 一个注释节点
     */
    private commentNode;
    private fragment;
    private forBuffer;
    private forAttr;
    constructor(node: HTMLElement, forInstruction: string);
    get hasForAttr(): boolean;
    private get forAttrValue();
    get bindVar(): string | undefined;
    get bindKey(): string | undefined;
    get bindValue(): string | undefined;
    get bindData(): string | undefined;
    get isNumberData(): boolean | undefined;
    /**
     * * 添加一个节点
     * @param item
     */
    add(item: Node): void;
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
