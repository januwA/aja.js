import { observable, toJS } from "mobx";

const l = console.log;

export type ValidationErrors = {
  [key: string]: any;
};

/**
 * * 返回null验证成功
 * * 否则返回一个error对象
 */
export interface ValidatorFn {
  (control: AbstractControl): ValidationErrors | null;
}

export interface AsyncValidatorFn {
  (control: AbstractControl): Promise<ValidationErrors | null>;
}

export abstract class AbstractControl {
  // TODO
  // private _parent;
  constructor(
    public validator: ValidatorFn[] | null,
    public asyncValidator: AsyncValidatorFn[] | null
  ) {}
  private _control: {
    [k: string]: any;
  } = observable({
    touched: false,
    untouched: true,

    dirty: false,
    pristine: true,

    valid: false,
    invalid: true,

    disabled: false,
    enabled: true,

    pending: false,

    errors: null
  });

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
  get status(): string {
    if (this.disabled) return "DISABLED";
    if (this.pending) return "PENDING";
    if (this.valid) return "VALID";
    if (this.invalid) return "INVALID";
    return "";
  }

  // TODO
  // readonly parent: FormGroup | FormArray;

  // TODO
  // setParent(parent: FormGroup | FormArray): void {}

  // TODO
  get(path: Array<string | number> | string): AbstractControl | null {
    return null;
  }

  /**
   * 包含验证失败产生的任何错误的对象，
   * 如果没有错误，则返回null。
   */
  get errors(): ValidationErrors | null {
    return toJS(this._control.errors);
  }

  /**
   * * 获取错误
   * @param errorCode
   * @param path
   */
  getError(errorCode: string, path?: Array<string | number> | string): any {
    if (!path) {
      if (!this.errors) return null;
      return this.errors[errorCode];
    }

    // TODO: 添加path解析
    return null;
  }

  hasError(errorCode: string, path?: Array<string | number> | string): boolean {
    if (!path) {
      if (!this.errors) return false;
      return errorCode in this.errors;
    }

    // TODO: 添加path
    return false;
  }

  setErrors(errors: ValidationErrors | null): void {
    this._control.errors = errors;
  }

  /**
   * * 当控件的`status`为 `PENDING`时，控件为`pending`
   * * 如果此控件正在进行验证检查，则返回True，否则为false。
   */
  get pending(): boolean {
    return this._control.pending;
  }

  /**
   * *控件的值有效
   */
  get valid(): boolean {
    return this._control.valid;
  }

  /**
   * 控件的值无效
   */
  get invalid(): boolean {
    return this._control.invalid;
  }

  /**
   * 控件被禁用
   */
  get disabled(): boolean {
    return this._control.disabled;
  }

  /**
   * 控件被启用
   */
  get enabled(): boolean {
    return this._control.enabled;
  }
  /**
   * 控件的值变化了
   */
  get dirty(): boolean {
    return this._control.dirty;
  }

  /**
   * 控件的值没有变化
   * 只有用户的输入才会改变这个状态
   */
  get pristine(): boolean {
    return this._control.pristine;
  }
  /**
   * 控件被访问过
   */
  get touched(): boolean {
    return this._control.touched;
  }
  /**
   * 控件没有被访问过
   */
  get untouched(): boolean {
    return this._control.untouched;
  }

  setValidators(newValidator: ValidatorFn[] | null): void {
    this.validator = newValidator;
  }
  setAsyncValidators(newValidator: AsyncValidatorFn[] | null): void {
    this.asyncValidator = newValidator;
  }

  clearValidators(): void {
    this.validator = null;
  }

  clearAsyncValidators(): void {
    this.asyncValidator = null;
  }

  /**
   * 将控件标记为“已触摸”。
   * @param opts
   */
  markAsTouched(): void {
    this._control.touched = true;
    this._control.untouched = false;
  }

  /**
   * 将控件标记为“未触摸”。
   * @param opts
   */
  markAsUntouched(): void {
    this._control.untouched = true;
    this._control.touched = false;
  }

  /**
   * 控件的值变化
   */
  markAsDirty(): void {
    this._control.dirty = true;
    this._control.pristine = false;
  }

  /**
   * 控件的值没发生变化
   */
  markAsPristine(): void {
    this._control.dirty = false;
    this._control.pristine = true;
  }

  /**
   * 控件的值有效
   */
  markAsValid(): void {
    this._control.valid = true;
    this._control.invalid = false;
    this._control.pending = false;
  }

  /**
   * 控件的值无效效
   */
  markAsInValid(): void {
    this._control.valid = false;
    this._control.invalid = true;
    this._control.pending = false;
  }

  /**
   * 禁用控件
   */
  disable(): void {
    this._control.disabled = true;
    this._control.enabled = false;
    this._control.pending = false;
  }

  /**
   * 启用控件
   */
  enable(): void {
    this._control.disabled = false;
    this._control.enabled = true;
  }

  /**
   * 将控件标记为“待处理”。
   * 当控件执行异步验证时，该控件处于挂起状态。
   */
  markAsPending(): void {
    this._control.pending = true;
  }

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
  updateValueAndValidity(): void {
    this._runValidator();
  }
  private _runValidator() {
    if (!this.validator) return;

    for (const validatorFn of this.validator) {
      const error = validatorFn(this);
      // 返回了错误
      if (error !== null) {
        this._control.errors = error;
        this.markAsInValid();
        return;
      }
    }
    this._control.errors = null;
    this._runAsyncValidator();
  }
  private async _runAsyncValidator() {
    if (!this.asyncValidator) return;
    // 挂起
    this.markAsPending();
    for (const asyncValidatorFn of this.asyncValidator) {
      const error = await asyncValidatorFn(this);
      // 返回了错误
      if (error !== null) {
        this._control.errors = error;
        this.markAsInValid();
        return;
      }
    }
    this._control.errors = null;
    this.markAsValid();
  }
}

export class FormControl extends AbstractControl {
  private _value = observable.box("");

  get value() {
    return this._value.get();
  }
  /**
   *
   * @param formState 初始值
   */
  constructor(
    formState?: any,
    validatorOrOpts?: ValidatorFn[] | null,
    asyncValidator?: AsyncValidatorFn[] | null
  ) {
    super(validatorOrOpts || null, asyncValidator || null);
    this._value.set(formState || "");
  }

  setValue(value: any): void {
    this._value.set(value);
  }

  reset(value?: any): void {
    this._value.set(value || "");
  }
}
