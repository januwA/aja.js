import { AbstractControl } from "../classes/forms";
/**
 * * 将dom节点和FormControl绑定在一起
 */
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
    constructor(node: HTMLElement, control: AbstractControl);
    /**
     * * 控件 <=> FormContril
     * @param node
     */
    setup(): void;
    /**
     * * 验证节点的值
     * * 如果控件被禁用，则不校验
     * @param node
     */
    private _checkValidity;
}
