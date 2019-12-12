export declare class BindingIfBuilder {
    elem: HTMLElement;
    /**
     * * 一个注释节点
     */
    cm: Comment | undefined;
    ifAttr: Attr | undefined;
    constructor(elem: HTMLElement, ifInstruction: string);
    /**
     * * 只有存在if指令，其他的方法和属性才生效
     */
    get hasIfAttr(): boolean;
    get value(): string | undefined;
    checked(show: boolean): void;
    private _createIfCommentData;
}
