export declare const VALID = "VALID";
export declare const INVALID = "INVALID";
export declare const PENDING = "PENDING";
export declare const DISABLED = "DISABLED";
export declare type ValidationErrors = {
    [key: string]: any;
};
/**
 * * 返回null验证成功
 * * 否则返回一个error对象
 */
export interface ValidatorFn {
    (control: AbstractControl): ValidationErrors | null;
}
/**
 * * 异步验证器，我这里只支持了[Promise]
 * angular 还支持rxjs
 */
export interface AsyncValidatorFn {
    (control: AbstractControl): Promise<ValidationErrors | null>;
}
export interface AbstractControlOptions {
    /**
     * 同步验证器
     */
    validators?: ValidatorFn | ValidatorFn[] | null;
    /**
     * 异步验证器
     */
    asyncValidators?: AsyncValidatorFn | AsyncValidatorFn[] | null;
    /**
     * 什么时候触发验证
     */
    updateOn?: "change" | "blur" | "submit";
}
export declare abstract class AbstractControl {
    validator: ValidatorFn | null;
    asyncValidator: AsyncValidatorFn | null;
    constructor(validator: ValidatorFn | null, asyncValidator: AsyncValidatorFn | null);
    private _control;
    /**
     * * 控件的当前值。
     * * 对于`FormControl`，当前值。
     * * 对于已启用的“ FormGroup”，已启用控件的值作为一个对象 *带有组中每个成员的键/值对。
     * * 对于禁用的“ FormGroup”，所有控件的值均作为对象
     * * 带有组中每个成员的键/值对。
     * * 对于“ FormArray”，已启用控件的值作为数组
     *
     */
    readonly value: any;
    /**
     * * 控件的确认状态。 有四种可能
     * * **VALID 有效**：此控件已通过所有验证检查。
     * * **INVALID 无效**：此控件至少未通过一项验证检查。
     * * **PENDING 待审核**：此控件正在执行验证检查。
     * * **DISABLED 已禁用**：此控件免于验证检查。
     * 这些状态值是互斥的，因此不能进行控制,有效和无效或无效和禁用。
     */
    get status(): string;
    get(path: Array<string | number> | string): AbstractControl | null;
    /**
     * 包含验证失败产生的任何错误的对象，
     * 如果没有错误，则返回null。
     */
    get errors(): ValidationErrors | null;
    /**
     * * 获取错误
     * @param errorCode
     * @param path
     */
    getError(errorCode: string, path?: Array<string | number> | string): any;
    hasError(errorCode: string, path?: Array<string | number> | string): boolean;
    setErrors(errors: ValidationErrors | null): void;
    /**
     * * 当控件的`status`为 `PENDING`时，控件为`pending`
     * * 如果此控件正在进行验证检查，则返回True，否则为false。
     */
    get pending(): boolean;
    /**
     * *控件的值有效
     */
    get valid(): boolean;
    /**
     * 控件的值无效
     */
    get invalid(): boolean;
    /**
     * 控件被禁用
     */
    get disabled(): boolean;
    /**
     * 控件被启用
     */
    get enabled(): boolean;
    /**
     * 控件的值变化了
     */
    get dirty(): boolean;
    /**
     * 控件的值没有变化
     * 只有用户的输入才会改变这个状态
     */
    get pristine(): boolean;
    /**
     * 控件被访问过
     */
    get touched(): boolean;
    /**
     * 控件没有被访问过
     */
    get untouched(): boolean;
    setValidators(newValidator: ValidatorFn | ValidatorFn[] | null): void;
    setAsyncValidators(newValidator: AsyncValidatorFn | AsyncValidatorFn[] | null): void;
    clearValidators(): void;
    clearAsyncValidators(): void;
    /**
     * 将控件标记为“已触摸”。
     * @param opts
     */
    markAsTouched(): void;
    /**
     * 将控件标记为“未触摸”。
     * @param opts
     */
    markAsUntouched(): void;
    /**
     * 控件的值变化
     */
    markAsDirty(): void;
    /**
     * 控件的值没发生变化
     */
    markAsPristine(): void;
    /**
     * 禁用控件
     */
    disable(): void;
    /**
     * 启用控件
     */
    enable(): void;
    /**
     * 将控件标记为“待处理”。
     * 当控件执行异步验证时，该控件处于挂起状态。
     */
    markAsPending(): void;
    /**
     * * 值的变动将通知控件, 会跳过相同的值
     * @param value
     * @param options
     */
    abstract setValue(value: any): void;
    /**
     * * 初始化控件
     * @param value
     * @param options
     */
    abstract reset(value?: any): void;
    /**
     * * 重新计算控件的值和验证状态。
     */
    updateValueAndValidity(): void;
    private _runValidator;
    private _runAsyncValidator;
}
export declare class FormControl extends AbstractControl {
    private _value;
    get value(): string;
    /**
     *
     * @param formState 初始值
     */
    constructor(formState?: any, validatorOrOpts?: ValidatorFn | ValidatorFn[] | AbstractControlOptions | null, asyncValidator?: AsyncValidatorFn | AsyncValidatorFn[] | null);
    setValue(value: any): void;
    reset(value?: any): void;
}
