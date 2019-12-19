import { observable, toJS, runInAction } from "mobx";
import { objectp, arrayp, nullp } from "../utils/p";

const l = console.log;

export const VALID = "VALID";
export const INVALID = "INVALID";
export const PENDING = "PENDING";
export const DISABLED = "DISABLED";

/**
 * 将errors数组转化为{}
 * @param arrayOfErrors
 */
function _mergeErrors(
  arrayOfErrors: ValidationErrors[]
): ValidationErrors | null {
  const res: { [key: string]: any } = arrayOfErrors.reduce(
    (acc: ValidationErrors | null, errors: ValidationErrors | null) => {
      // return nullp(errors) ? acc! : { ...acc!, ...errors };
      return nullp(errors) ? acc! : Object.assign(acc, errors);
    },
    {}
  );
  return Object.keys(res).length === 0 ? null : res;
}

/**
 * * 将验证器数组转化为一个验证器
 * @param validators
 */
function compose(
  validators: (ValidatorFn | null | undefined)[] | null
): ValidatorFn | null {
  if (!validators) return null;
  // 过滤无效的验证器
  const presentValidators: ValidatorFn[] = validators.filter(
    o => o != null
  ) as any;
  if (presentValidators.length == 0) return null;

  return function(control: AbstractControl) {
    // 运行所有验证器，获取错误数组
    const errors: ValidationErrors[] = presentValidators.map(v =>
      v(control)
    ) as any[];
    return _mergeErrors(errors);
  };
}

async function forkJoinPromise(promises: any[]): Promise<ValidationErrors[]> {
  const errors: any[] = [];
  for (const v of promises) {
    const r = await v;
    errors.push(r);
  }
  return errors;
}

function composeAsync(
  validators: (AsyncValidatorFn | null)[]
): AsyncValidatorFn | null {
  // 这里的逻辑和[compose]的差不多
  if (!validators) return null;
  const presentValidators: AsyncValidatorFn[] = validators.filter(
    o => o != null
  ) as any;
  if (presentValidators.length == 0) return null;

  return async function(control: AbstractControl): Promise<any> {
    // 一组Promise验证器数组
    const promises = presentValidators.map(v => v(control));

    // 获取所有错误
    const errors = await forkJoinPromise(promises);
    return _mergeErrors(errors);
  };
}

function composeValidators(validators: Array<ValidatorFn>): ValidatorFn | null {
  return nullp(validators) ? null : compose(validators);
}

function composeAsyncValidators(
  validators: Array<AsyncValidatorFn>
): AsyncValidatorFn | null {
  return !nullp(validators) ? composeAsync(validators) : null;
}

function coerceToValidator(
  validatorOrOpts?: ValidatorFn | ValidatorFn[] | AbstractControlOptions | null
): ValidatorFn | null {
  // 如果是[AbstractControlOptions]就获取[AbstractControlOptions.validators]
  const validator = (objectp(validatorOrOpts)
    ? (validatorOrOpts as AbstractControlOptions).validators
    : validatorOrOpts) as ValidatorFn | ValidatorFn[] | null;

  return arrayp(validator) ? composeValidators(validator) : validator || null;
}

function coerceToAsyncValidator(
  asyncValidator?: AsyncValidatorFn | AsyncValidatorFn[] | null,
  validatorOrOpts?: ValidatorFn | ValidatorFn[] | AbstractControlOptions | null
): AsyncValidatorFn | null {
  // 如果参数是一个[AbstractControlOptions]
  // 那么就获取[AbstractControlOptions.asyncValidators]
  // 否则就返回 [asyncValidator]
  const origAsyncValidator = (objectp(validatorOrOpts)
    ? (validatorOrOpts as AbstractControlOptions).asyncValidators
    : asyncValidator) as AsyncValidatorFn | AsyncValidatorFn | null;

  return arrayp(origAsyncValidator)
    ? composeAsyncValidators(origAsyncValidator)
    : origAsyncValidator || null;
}

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

export abstract class AbstractControl {
  // TODO
  // private _parent;
  constructor(
    public validator: ValidatorFn | null,
    public asyncValidator: AsyncValidatorFn | null
  ) {}
  private _control: {
    [k: string]: any;
  } = observable({
    touched: false,

    dirty: false,

    disabled: false,

    pending: false,

    // 没有错误 valid
    // 有错误 invalid
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
    if (!this._control.errors) return VALID;
    if (this._control.errors) return INVALID;
    if (this._control.pending) return PENDING;
    return DISABLED;
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
    return this.status === VALID;
  }

  /**
   * 控件的值无效
   */
  get invalid(): boolean {
    return this.status === INVALID;
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
    return !this.disabled;
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
    return !this.dirty;
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
    return !this.touched;
  }

  setValidators(newValidator: ValidatorFn | ValidatorFn[] | null): void {
    this.validator = coerceToValidator(newValidator);
  }
  setAsyncValidators(
    newValidator: AsyncValidatorFn | AsyncValidatorFn[] | null
  ): void {
    this.asyncValidator = coerceToAsyncValidator(newValidator);
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
  }

  /**
   * 将控件标记为“未触摸”。
   * @param opts
   */
  markAsUntouched(): void {
    this._control.touched = false;
  }

  /**
   * 控件的值变化
   */
  markAsDirty(): void {
    this._control.dirty = true;
  }

  /**
   * 控件的值没发生变化
   */
  markAsPristine(): void {
    this._control.dirty = false;
  }

  /**
   * 禁用控件
   */
  disable(): void {
    this._control.disabled = true;
  }

  /**
   * 启用控件
   */
  enable(): void {
    this._control.disabled = false;
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
    // if (this.enabled) {
    this._control.errors = this._runValidator();

    if (this.status === VALID || this.status === PENDING) {
      this._runAsyncValidator();
    }
    // }
  }
  private _runValidator() {
    return this.validator ? this.validator(this) : null;
  }

  private async _runAsyncValidator() {
    if (!this.asyncValidator) return;
    // 挂起
    this.markAsPending();
    this._control.errors = await this.asyncValidator(this);
    this._control.pending = false;
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
    validatorOrOpts?:
      | ValidatorFn
      | ValidatorFn[]
      | AbstractControlOptions
      | null,
    asyncValidator?: AsyncValidatorFn | AsyncValidatorFn[] | null
  ) {
    super(
      coerceToValidator(validatorOrOpts),
      coerceToAsyncValidator(asyncValidator, validatorOrOpts)
    );
    this._value.set(formState || "");
  }

  setValue(value: any): void {
    this._value.set(value);
  }

  reset(value?: any): void {
    this._value.set(value || "");
  }
}

// export class FormGroup extends AbstractControl {
//   controls: {
//     [key: string]: AbstractControl;
//   };

//   constructor(
//     controls: {
//       [key: string]: AbstractControl;
//     },
//     validatorOrOpts?:
//       | ValidatorFn
//       | ValidatorFn[]
//       | AbstractControlOptions
//       | null,
//     asyncValidator?: AsyncValidatorFn | AsyncValidatorFn[] | null
//   ) {
//     super();
//   }

//   setValue(value: any): void {
//     throw new Error("Method not implemented.");
//   }
//   reset(value?: any): void {
//     throw new Error("Method not implemented.");
//   }
// }
