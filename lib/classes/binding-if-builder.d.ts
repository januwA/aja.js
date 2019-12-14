export declare class BindingIfBuilder {
    node: HTMLElement;
    /**
     * * 一个注释节点
     */
    commentNode: Comment | undefined;
    ifAttr: Attr | undefined;
    constructor(node: HTMLElement, ifInstruction: string);
    /**
     * * 只有存在if指令，其他的方法和属性才生效
     */
    get hasIfAttr(): boolean;
    get value(): string | undefined;
    /**
     * * 这里使用了回调把template标签给渲染了
     * @param show
     * @param cb
     */
    checked(show: boolean): void;
    private _createIfCommentData;
}
