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
    private _parent?;
    /**
     * 当控件组发生改变，将调用这个回调
     */
    _onCollectionChange: () => void;
    /**
     * * 默认注册一个全新的回调函数
     * @param fn
     */
    _registerOnCollectionChange(fn?: () => void): void;
    constructor(validator: ValidatorFn | null, asyncValidator: AsyncValidatorFn | null);
    get parent(): FormGroup | undefined;
    setParent(parent: FormGroup): void;
    _control: {
        touched: boolean;
        dirty: boolean;
        disabled: boolean;
        pending: boolean;
        errors: null | any;
    };
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
    /**
     * this.profileForm.get('firstName')
     * this.profileForm.get('firstName/xxx')
     * @param path
     */
    get(path: string): AbstractControl | null;
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
    getError(errorCode: string, path?: string): any;
    hasError(errorCode: string, path?: string): boolean;
    /**
     * 获取最顶层的父级
     */
    get root(): AbstractControl;
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
    abstract patchValue(value: any, options?: Object): void;
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
    patchValue(value: any): void;
    reset(value?: any): void;
}
export declare class FormGroup extends AbstractControl {
    controls: {
        [key: string]: AbstractControl;
    };
    get value(): {
        [k: string]: any;
    } & {
        [x: string]: any;
    };
    constructor(controls: {
        [key: string]: AbstractControl;
    }, validatorOrOpts?: ValidatorFn | ValidatorFn[] | AbstractControlOptions | null, asyncValidator?: AsyncValidatorFn | AsyncValidatorFn[] | null);
    /**
     * 在组的控件列表中注册一个控件。
     * 此方法不会更新控件的值或有效性。
     * @param name
     * @param control
     */
    registerControl(name: string, control: AbstractControl): AbstractControl;
    /**
     * 将控件添加到该组。
     * 此方法还会更新控件的值和有效性。
     * @param name
     * @param control
     */
    addControl(name: string, control: AbstractControl): void;
    /**
     * 从该组中删除一个控件。
     * @param name
     */
    removeControl(name: string): void;
    /**
     * 替换现有的控件。
     * @param name
     * @param control
     */
    setControl(name: string, control: AbstractControl): void;
    /**
     * 检查组中是否存在具有给定名称的已启用控件。
     * 对于禁用控件，报告为false。 如果您想检查组中是否存在可以使用 [get]
     * @param controlName
     */
    contains(controlName: string): boolean;
    /**
     * 设置formGroup的值
     * @param value
     * @param options
     * `onlySelf` When true, each change only affects this control, and not its parent. Default is
     */
    setValue(value: {
        [key: string]: any;
    }, options?: {
        onlySelf?: boolean;
        emitEvent?: boolean;
    }): void;
    /**
     * 设置任意个值
     * @param value
     */
    patchValue(value: {
        [key: string]: any;
    }): void;
    /**
     *  重置所有的control
     * @param value
     */
    reset(value?: any): void;
    /**
     * * 循环自身的formControls
     * @param cb
     */
    _forEachChild(cb: (v: any, k: string) => void): void;
    /**
     * * 设置自己的父元素
     */
    _setUpControls(): void;
    /**
     * * 检查设置的新值，是否存在
     * @param value
     */
    _checkAllValuesPresent(value: any): void;
}
