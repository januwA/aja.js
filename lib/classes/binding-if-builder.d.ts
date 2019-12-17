export declare class BindingIfBuilder {
    node: HTMLElement;
    /**
     * * 一个注释节点
     */
    commentNode?: Comment;
    ifAttr?: Attr;
    constructor(node: HTMLElement);
    get value(): string;
    /**
     * * 这里使用了回调把template标签给渲染了
     * @param show
     */
    checked(show: boolean, cb: () => void): void;
    private _createIfCommentData;
}
