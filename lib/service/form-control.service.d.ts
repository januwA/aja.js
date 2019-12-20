import { AbstractControl } from "../classes/forms";
export declare class FormControlSerivce {
    readonly node: HTMLElement;
    control: AbstractControl;
    static classes: {
        touched: string;
        untouched: string;
        dirty: string;
        pristine: string;
        valid: string;
        invalid: string;
    };
    /**
     * * 响应式表单与dom的桥梁
     * * dom <=> FormControl
     */
    constructor(node: HTMLElement, control: AbstractControl);
    /**
     * * 控件 <=> FormControl
     * @param node
     */
    setup(): void;
    /**
     * * 验证节点的值
     * @param node
     */
    private _h5CheckValidity;
}
