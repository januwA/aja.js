export declare class AjaModel {
    node: HTMLInputElement;
    static classes: {
        touched: string;
        untouched: string;
        dirty: string;
        pristine: string;
        valid: string;
        invalid: string;
    };
    /**
     * * 初始化class服务
     * @param node
     */
    static classListSetup(node: HTMLElement): void;
    /**
     * * 验证节点的值
     * @param node
     */
    static checkValidity(node: HTMLInputElement): boolean | undefined;
    /**
     * * 节点的值发生了变化
     * @param node
     */
    static valueChange(node: HTMLElement): void;
    /**
     * * 节点被访问
     */
    static touched(node: HTMLElement): void;
    get model(): string;
    /**
     * * 跟踪绑定到指令的名称。父窗体使用此名称作为键来检索此控件的值。
     */
    get name(): any;
    get value(): string;
    /**
     * * 跟踪控件是否被禁用
     */
    get disabled(): boolean;
    get enabled(): boolean;
    control: {
        [k: string]: any;
    };
    get dirty(): boolean;
    get pristine(): boolean;
    get valid(): boolean;
    get invalid(): boolean;
    get touched(): boolean;
    get untouched(): boolean;
    constructor(node: HTMLInputElement);
    private _setup;
}
