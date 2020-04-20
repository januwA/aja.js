import { observable } from "../aja-mobx";
import { objectp, arrayp, nullp } from "../utils/p";
import { AnyObject } from "../interfaces";

const l = console.log;

export const VALID = "VALID";
export const INVALID = "INVALID";
export const PENDING = "PENDING";
export const DISABLED = "DISABLED";

function _find(control: AbstractControl, paths: string[]) {
  return paths.reduce((v: AbstractControl | null, name) => {
    if (v instanceof FormGroup) {
      return v.controls.hasOwnProperty(name) ? v.controls[name] : null;
    }

    if (v instanceof FormArray) {
      return v.at(Number(name)) || null;
    }

    return null;
  }, control);
}

/**
 * 将errors数组转化为{}
 * @param arrayOfErrors
 */
function _mergeErrors(
  arrayOfErrors: ValidationErrors[]
): ValidationErrors | null {
  const res: { [key: string]: any } = arrayOfErrors.reduce(
    (acc: ValidationErrors | null, errors: ValidationErrors | null) => {
      return nullp(errors) ? acc! : Object.assign(acc, errors);
    },
    {}
  );
  return Object.keys(res).length === 0 ? null : res;
}

/**
 * 将验证器数组转化为一个验证器
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

/**
 * 验证失败返回的错误对象
 */
export interface ValidationErrors extends AnyObject {}

/**
 * 同步验证函数
 * 成功返回[null]
 * 失败返回[ValidationErrors]
 */
export interface ValidatorFn {
  (control: AbstractControl): ValidationErrors | null;
}

/**
 * 异步验证器，我这里只支持了[Promise]
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
  /**
   * 父级表单
   */
  private _parent?: FormGroup | FormArray;
  get parent() {
    return this._parent;
  }
  setParent(parent: FormGroup | FormArray) {
    this._parent = parent;
  }

  /**
   * * 当前控件的值。
   * * 对于`FormControl`，当前value。
   * * 对于已启用的“ FormGroup”，已启用控件的值作为一个对象 *带有组中每个成员的键/值对。
   * * 对于禁用的“ FormGroup”，所有控件的值均作为对象
   * * 带有组中每个成员的键/值对。
   * * 对于“ FormArray”，已启用控件的值作为数组
   *
   */
  readonly value: any;

  /**
   * 当控件组发生改变，将调用这个回调
   */
  _onCollectionChange = () => {};

  /**
   * 默认注册一个全新的回调函数
   * @param fn
   */
  _registerOnCollectionChange(fn: () => void = () => {}): void {
    this._onCollectionChange = fn;
  }

  constructor(
    public validator: ValidatorFn | null,
    public asyncValidator: AsyncValidatorFn | null
  ) {}

  _control: {
    touched: boolean;
    dirty: boolean;
    disabled: boolean;
    pending: boolean;
    errors: null | any;
  } = observable.object({
    touched: false,

    dirty: false,

    disabled: false,

    pending: false,

    // 没有错误 valid
    // 有错误 invalid
    errors: null
  }) as any;

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

  /**
   * this.profileForm.get('firstName')
   * this.profileForm.get('firstName/xxx')
   * @param path
   */
  get(path: string /* a/b/c */): AbstractControl | null {
    if (!path) return null;
    const paths = path.split(/\/|\./).map(p => p.trim());
    if (paths.length === 0) return null;

    return _find(this, paths);
  }

  /**
   * 包含验证失败产生的任何错误的对象，
   * 如果没有错误，则返回null。
   */
  get errors(): ValidationErrors | null {
    return this._control.errors;
  }

  /**
   * * 获取错误
   * @param errorCode
   * @param path
   */
  getError(errorCode: string, path?: string): any {
    const control = path ? this.get(path) : this;
    return control && control.errors ? control.errors[errorCode] : null;
  }

  hasError(errorCode: string, path?: string): boolean {
    return !!this.getError(errorCode, path);
  }

  /**
   * 获取最顶层的父级
   */
  get root(): AbstractControl {
    let x: AbstractControl = this;

    while (x._parent) {
      x = x._parent;
    }

    return x;
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
   * [opts.onlySelf]：为true时，仅标记此控件。 如果为假或未提供
   * 标记着所有[parent]。 默认为false。
   *
   * ?什么时候可能为[true]，当父级更新子级时
   * ?什么时候可能为[false]，当控件与control同步时
   */
  markAsTouched(opts: { onlySelf?: boolean } = {}): void {
    this._control.touched = true;

    if (this._parent && !opts.onlySelf) {
      this._parent.markAsTouched(opts);
    }
  }

  /**
   * 将控件及其所有后代控件标记为“已触摸”。
   */
  markAllAsTouched(): void {
    this.markAsTouched({ onlySelf: true });

    this._forEachChild((control: AbstractControl) =>
      control.markAllAsTouched()
    );
  }

  /**
   * 将控件标记为“未触摸”。
   *
   * 如果控件有children，也将所有children都标记为“未修改”, 并重新计算所有父控件的“触摸”状态。
   * @param opts
   */
  markAsUntouched(opts: { onlySelf?: boolean } = {}): void {
    this._control.touched = false;

    this._forEachChild((control: AbstractControl) => {
      control.markAsUntouched({ onlySelf: true });
    });

    if (this._parent && !opts.onlySelf) {
      this._parent._updateTouched(opts);
    }
  }

  /**
   * 控件的值变化
   */
  markAsDirty(opts: { onlySelf?: boolean } = {}): void {
    this._control.dirty = true;

    if (this._parent && !opts.onlySelf) {
      this._parent.markAsDirty(opts);
    }
  }

  /**
   * 将控件标记为“原始(未发生变化)”。
   * 如果控件有任何子控件，则将所有子控件标记为“原始”，并重新计算所有父控件的“原始”状态。
   */
  markAsPristine(opts: { onlySelf?: boolean } = {}): void {
    this._control.dirty = false;

    this._forEachChild((control: AbstractControl) => {
      control.markAsPristine({ onlySelf: true });
    });

    if (this._parent && !opts.onlySelf) {
      this._parent._updatePristine(opts);
    }
  }

  /**
   * 将控件标记为“待处理”。
   * 当控件执行异步验证时，该控件处于挂起状态。
   */
  markAsPending(opts: { onlySelf?: boolean; emitEvent?: boolean } = {}): void {
    this._control.pending = true;

    if (this._parent && !opts.onlySelf) {
      this._parent.markAsPending(opts);
    }
  }

  /**
   * 禁用控件。
   * 这意味着该控件免于进行验证检查，并从任何父级的合计值中排除。
   * 其状态为“已禁用”。
   *
   * 如果控件有孩子，则所有孩子也将被禁用。
   */
  disable(opts: { onlySelf?: boolean; emitEvent?: boolean } = {}): void {
    this._control.disabled = true;
    this._control.errors = null;
    this._forEachChild((control: AbstractControl) => {
      control.disable({ ...opts, onlySelf: true });
    });
  }

  /**
   * 启用控件。
   * 这意味着控件包含在验证检查中，并且其父级的合计值。 根据其值重新计算其状态，其验证者。
   * 默认情况下，如果控件有孩子，则启用所有孩子。
   */
  enable(opts: { onlySelf?: boolean; emitEvent?: boolean } = {}): void {
    this._control.disabled = false;
    this._forEachChild((control: AbstractControl) => {
      control.enable({ ...opts, onlySelf: true });
    });

    this.updateValueAndValidity({ onlySelf: true, emitEvent: opts.emitEvent });
  }

  /**
   * * 值的变动将通知控件, 会跳过相同的值
   * @param value
   * @param options
   */
  abstract setValue(value: any, options?: Object): void;
  abstract patchValue(value: any, options?: Object): void;
  /**
   * * 初始化控件
   * @param value
   * @param options
   */
  abstract reset(value?: any, options?: Object): void;

  /**
   * 循环子级
   * @param cb
   */
  abstract _forEachChild(cb: Function): void;

  /**
   * * 当有一个[condition()]为[true]就返回[true]，否则返回[false]
   * @param condition
   */
  abstract _anyControls(condition: Function): boolean;

  /**
   * * 重新计算控件的值和验证状态。
   */
  updateValueAndValidity(
    opts: { onlySelf?: boolean; emitEvent?: boolean } = {}
  ): void {
    if (this.enabled) {

      // TODO: 当子级验证错误时，如何把错误传递给父级
      this._control.errors = this._runValidator();

      if (this.status === VALID || this.status === PENDING) {
        this._runAsyncValidator();
      }
    }

    if (this._parent && !opts.onlySelf) {
      this._parent.updateValueAndValidity(opts);
    }
  }

  // TODO: 当子级改变, 父级如何运行检查器
  private _runValidator() {
    return this.validator ? this.validator(this) : null;
  }

  private _runAsyncValidator() {
    if (!this.asyncValidator) return;
    // 挂起
    this.markAsPending();
    this.asyncValidator(this).then(errors => {
      this._control.errors = errors;
      this._control.pending = false;
    });
  }

  _anyControlsTouched(): boolean {
    return this._anyControls((control: AbstractControl) => control.touched);
  }

  _updateTouched(opts: { onlySelf?: boolean } = {}): void {
    this._control.touched = this._anyControlsTouched();

    if (this._parent && !opts.onlySelf) {
      this._parent._updateTouched(opts);
    }
  }

  _anyControlsDirty(): boolean {
    return this._anyControls((control: AbstractControl) => control.dirty);
  }

  _updatePristine(opts: { onlySelf?: boolean } = {}): void {
    this._control.dirty = this._anyControlsDirty();

    if (this._parent && !opts.onlySelf) {
      this._parent._updatePristine(opts);
    }
  }
}

export class FormControl extends AbstractControl {
  _anyControls(condition: Function): boolean {
    return false;
  }
  _forEachChild(cb: Function): void {}

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
    this.setValue(formState || "");
  }

  setValue(value: any): void {
    this._value.set(value);
    this.updateValueAndValidity();
  }

  patchValue(value: any): void {
    this.setValue(value);
  }

  reset(value?: any): void {
    this._control.dirty = false;
    this._control.touched = false;
    this.setValue(value || "");
  }
}

export class FormGroup extends AbstractControl {
  _anyControls(cb: Function): boolean {
    let res = false;
    this._forEachChild((control: AbstractControl, name: string) => {
      res = res || (this.contains(name) && cb(control));
    });
    return res;
  }

  get value() {
    return Object.keys(this.controls).reduce(
      (acc: { [k: string]: any }, item: string) => {
        return Object.assign(acc, {
          [item]: this.controls[item].value
        });
      },
      {}
    );
  }

  constructor(
    public controls: {
      [key: string]: AbstractControl;
    },
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
    this._setUpControls();
  }

  /**
   * 在组的控件列表中注册一个控件。
   * 此方法不会更新控件的值或有效性。
   * @param name
   * @param control
   */
  registerControl(name: string, control: AbstractControl): AbstractControl {
    if (this.controls[name]) return this.controls[name];
    this.controls[name] = control;
    control.setParent(this);
    control._registerOnCollectionChange(this._onCollectionChange);
    return control;
  }

  /**
   * 将控件添加到该组。
   * 此方法还会更新控件的值和有效性。
   * @param name
   * @param control
   */
  addControl(name: string, control: AbstractControl): void {
    this.registerControl(name, control);
    this.updateValueAndValidity();
    this._onCollectionChange();
  }

  /**
   * 从该组中删除一个控件。
   * @param name
   */
  removeControl(name: string): void {
    if (this.controls[name]) this.controls[name]._registerOnCollectionChange();
    delete this.controls[name];
    this.updateValueAndValidity();
    this._onCollectionChange();
  }

  /**
   * 替换现有的控件。
   * @param name
   * @param control
   */
  setControl(name: string, control: AbstractControl): void {
    if (this.controls[name]) this.controls[name]._registerOnCollectionChange();
    delete this.controls[name];
    if (control) this.registerControl(name, control);
    this.updateValueAndValidity();
    this._onCollectionChange();
  }

  /**
   * 检查组中是否存在具有给定名称的已启用控件。
   * 对于禁用控件，报告为false。 如果您想检查组中是否存在可以使用 [get]
   * @param controlName
   */
  contains(controlName: string): boolean {
    return (
      this.controls.hasOwnProperty(controlName) &&
      this.controls[controlName].enabled
    );
  }

  /**
   * 设置formGroup的值
   * @param value
   * @param options
   * `onlySelf` When true, each change only affects this control, and not its parent. Default is
   */
  setValue(
    value: { [key: string]: any },
    options: { onlySelf?: boolean; emitEvent?: boolean } = {}
  ): void {
    this._checkAllValuesPresent(value);
    Object.keys(value).forEach(name => {
      this.controls[name].setValue(value[name]);
    });
    this.updateValueAndValidity();
  }

  /**
   * 设置任意个值
   * @param value
   */
  patchValue(value: { [key: string]: any }): void {
    Object.keys(value).forEach(name => {
      if (this.controls[name]) {
        this.controls[name].patchValue(value[name]);
      }
    });
    this.updateValueAndValidity();
  }

  /**
   *  重置所有的control
   * @param value
   */
  reset(value: any = {}): void {
    this._forEachChild((control: AbstractControl, name: string) => {
      control.reset(value[name]);
    });
    this._control.dirty = false;
    this._control.touched = false;
    this.updateValueAndValidity();
  }

  /**
   * * 循环自身的formControls
   * @param cb
   */
  _forEachChild(cb: (v: any, k: string) => void): void {
    Object.keys(this.controls).forEach(k => cb(this.controls[k], k));
  }

  /**
   * * 设置自己的父元素
   */
  _setUpControls(): void {
    this._forEachChild((control: AbstractControl) => {
      control.setParent(this);
      control._registerOnCollectionChange(this._onCollectionChange);
    });
  }

  /**
   * * 检查设置的新值，是否存在
   * @param value
   */
  _checkAllValuesPresent(value: any): void {
    this._forEachChild((control: AbstractControl, name: string) => {
      if (value[name] === undefined) {
        throw new Error(
          `Must supply a value for form control with name: '${name}'.`
        );
      }
    });
  }
}

export class FormArray extends AbstractControl {
  constructor(
    public controls: AbstractControl[],
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

    this.updateValueAndValidity({ onlySelf: true, emitEvent: false });
  }

  /**
   * 在数组中给定的索引处获取AbstractControl
   * @param index
   */
  at(index: number): AbstractControl {
    return this.controls[index];
  }

  /**
   * 添加一个新控制器
   * @param control
   */
  push(control: AbstractControl): void {
    this.controls.push(control);
    this._registerControl(control);
    this.updateValueAndValidity();
    this._onCollectionChange();
  }

  /**
   * 在指定位置插入一个新控制器
   * @param index
   * @param control
   */
  insert(index: number, control: AbstractControl): void {
    this.controls.splice(index, 0, control);

    this._registerControl(control);
    this.updateValueAndValidity();
  }

  removeAt(index: number): void {
    if (this.controls[index])
      this.controls[index]._registerOnCollectionChange(() => {});
    this.controls.splice(index, 1);
    this.updateValueAndValidity();
  }

  /**
   * 替换现有的控件
   * @param index
   * @param control
   */
  setControl(index: number, control: AbstractControl): void {
    if (this.controls[index])
      this.controls[index]._registerOnCollectionChange(() => {});
    this.controls.splice(index, 1);

    if (control) {
      this.controls.splice(index, 0, control);
      this._registerControl(control);
    }

    this.updateValueAndValidity();
    this._onCollectionChange();
  }

  /**
   * 返回控制器个数
   */
  get length(): number {
    return this.controls.length;
  }

  setValue(
    value: any[],
    options: { onlySelf?: boolean; emitEvent?: boolean } = {}
  ): void {
    this._checkAllValuesPresent(value);
    value.forEach((newValue: any, index: number) => {
      if (this.at(index))
        this.at(index).setValue(newValue, {
          onlySelf: true,
          emitEvent: options.emitEvent
        });
    });
    this.updateValueAndValidity(options);
  }
  patchValue(
    value: any[],
    options: { onlySelf?: boolean; emitEvent?: boolean } = {}
  ): void {
    value.forEach((newValue: any, index: number) => {
      if (this.at(index)) {
        this.at(index).patchValue(newValue, {
          onlySelf: true,
          emitEvent: options.emitEvent
        });
      }
    });
    this.updateValueAndValidity(options);
  }
  reset(
    value: any = [],
    options: { onlySelf?: boolean; emitEvent?: boolean } = {}
  ): void {
    this._forEachChild((control: AbstractControl, index: number) => {
      control.reset(value[index], {
        onlySelf: true,
        emitEvent: options.emitEvent
      });
    });
    this._updatePristine(options);
    this._updateTouched(options);
    this.updateValueAndValidity(options);
  }

  /**
   * 获取所有孩子的值,包括禁用的
   */
  getRawValue(): any[] {
    return this.controls.map((control: AbstractControl) => {
      return control instanceof FormControl
        ? control.value
        : (<any>control).getRawValue();
    });
  }

  /**
   * 删除“ FormArray”中的所有控件
   */
  clear(): void {
    if (this.controls.length < 1) return;
    this._forEachChild((control: AbstractControl) =>
      control._registerOnCollectionChange(() => {})
    );
    this.controls.splice(0);
    this.updateValueAndValidity();
  }

  _forEachChild(cb: Function): void {
    this.controls.forEach((control: AbstractControl, index: number) => {
      cb(control, index);
    });
  }

  _anyControls(condition: Function): boolean {
    return this.controls.some(
      (control: AbstractControl) => control.enabled && condition(control)
    );
  }

  /**
   * 检查新值
   * @param value
   */
  _checkAllValuesPresent(value: any): void {
    this._forEachChild((control: AbstractControl, i: number) => {
      if (value[i] === undefined) {
        throw new Error(`Must supply a value for form control at index: ${i}.`);
      }
    });
  }

  private _registerControl(control: AbstractControl) {
    control.setParent(this);
    control._registerOnCollectionChange(this._onCollectionChange);
  }
}

export class FormBuilder {
  static group(
    controlsConfig: {
      [key: string]: any;
    },
    options?:
      | AbstractControlOptions
      | {
          [key: string]: any;
        }
      | null
  ): FormGroup {
    const controls = Object.keys(controlsConfig).reduce(
      (acc, name) =>
        Object.assign(acc, { [name]: this._el(controlsConfig[name]) }),
      {} as {
        [key: string]: AbstractControl;
      }
    );
    return new FormGroup(controls, options);
  }

  static control(
    formState: any,
    validatorOrOpts?:
      | ValidatorFn
      | ValidatorFn[]
      | AbstractControlOptions
      | null,
    asyncValidator?: AsyncValidatorFn | AsyncValidatorFn[] | null
  ): FormControl {
    return new FormControl(formState, validatorOrOpts, asyncValidator);
  }

  static array(
    controlsConfig: any[],
    validatorOrOpts?:
      | ValidatorFn
      | ValidatorFn[]
      | AbstractControlOptions
      | null,
    asyncValidator?: AsyncValidatorFn | AsyncValidatorFn[] | null
  ): FormArray {
    return new FormArray(
      controlsConfig.map(this._el),
      validatorOrOpts,
      asyncValidator
    );
  }

  private static _el(el: any) {
    if (
      el instanceof FormControl ||
      el instanceof FormArray ||
      el instanceof FormGroup
    ) {
      return el;
    }

    if (arrayp(el)) {
      return this.control(el[0] || null, el[1], el[2]);
    }

    return this.control(el);
  }
}
