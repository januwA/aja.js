"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mobx_1 = require("mobx");
const l = console.log;
class AbstractControl {
    // TODO
    // private _parent;
    constructor(validator, asyncValidator) {
        this.validator = validator;
        this.asyncValidator = asyncValidator;
        this._control = mobx_1.observable({
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
    }
    /**
     * * 控件的确认状态。 有四种可能
     * * **VALID 有效**：此控件已通过所有验证检查。
     * * **INVALID 无效**：此控件至少未通过一项验证检查。
     * * **PENDING 待审核**：此控件正在执行验证检查。
     * * **DISABLED 已禁用**：此控件免于验证检查。
     * 这些状态值是互斥的，因此不能进行控制,有效和无效或无效和禁用。
     */
    get status() {
        if (this.disabled)
            return "DISABLED";
        if (this.pending)
            return "PENDING";
        if (this.valid)
            return "VALID";
        if (this.invalid)
            return "INVALID";
        return "";
    }
    // TODO
    // readonly parent: FormGroup | FormArray;
    // TODO
    // setParent(parent: FormGroup | FormArray): void {}
    // TODO
    get(path) {
        return null;
    }
    /**
     * 包含验证失败产生的任何错误的对象，
     * 如果没有错误，则返回null。
     */
    get errors() {
        return mobx_1.toJS(this._control.errors);
    }
    /**
     * * 获取错误
     * @param errorCode
     * @param path
     */
    getError(errorCode, path) {
        if (!path) {
            if (!this.errors)
                return null;
            return this.errors[errorCode];
        }
        // TODO: 添加path解析
        return null;
    }
    hasError(errorCode, path) {
        if (!path) {
            if (!this.errors)
                return false;
            return errorCode in this.errors;
        }
        // TODO: 添加path
        return false;
    }
    setErrors(errors) {
        this._control.errors = errors;
    }
    /**
     * * 当控件的`status`为 `PENDING`时，控件为`pending`
     * * 如果此控件正在进行验证检查，则返回True，否则为false。
     */
    get pending() {
        return this._control.pending;
    }
    /**
     * *控件的值有效
     */
    get valid() {
        return this._control.valid;
    }
    /**
     * 控件的值无效
     */
    get invalid() {
        return this._control.invalid;
    }
    /**
     * 控件被禁用
     */
    get disabled() {
        return this._control.disabled;
    }
    /**
     * 控件被启用
     */
    get enabled() {
        return this._control.enabled;
    }
    /**
     * 控件的值变化了
     */
    get dirty() {
        return this._control.dirty;
    }
    /**
     * 控件的值没有变化
     * 只有用户的输入才会改变这个状态
     */
    get pristine() {
        return this._control.pristine;
    }
    /**
     * 控件被访问过
     */
    get touched() {
        return this._control.touched;
    }
    /**
     * 控件没有被访问过
     */
    get untouched() {
        return this._control.untouched;
    }
    setValidators(newValidator) {
        this.validator = newValidator;
    }
    setAsyncValidators(newValidator) {
        this.asyncValidator = newValidator;
    }
    clearValidators() {
        this.validator = null;
    }
    clearAsyncValidators() {
        this.asyncValidator = null;
    }
    /**
     * 将控件标记为“已触摸”。
     * @param opts
     */
    markAsTouched() {
        this._control.touched = true;
        this._control.untouched = false;
    }
    /**
     * 将控件标记为“未触摸”。
     * @param opts
     */
    markAsUntouched() {
        this._control.untouched = true;
        this._control.touched = false;
    }
    /**
     * 控件的值变化
     */
    markAsDirty() {
        this._control.dirty = true;
        this._control.pristine = false;
    }
    /**
     * 控件的值没发生变化
     */
    markAsPristine() {
        this._control.dirty = false;
        this._control.pristine = true;
    }
    /**
     * 控件的值有效
     */
    markAsValid() {
        this._control.valid = true;
        this._control.invalid = false;
        this._control.pending = false;
    }
    /**
     * 控件的值无效效
     */
    markAsInValid() {
        this._control.valid = false;
        this._control.invalid = true;
        this._control.pending = false;
    }
    /**
     * 禁用控件
     */
    disable() {
        this._control.disabled = true;
        this._control.enabled = false;
        this._control.pending = false;
    }
    /**
     * 启用控件
     */
    enable() {
        this._control.disabled = false;
        this._control.enabled = true;
    }
    /**
     * 将控件标记为“待处理”。
     * 当控件执行异步验证时，该控件处于挂起状态。
     */
    markAsPending() {
        this._control.pending = true;
    }
    /**
     * * 重新计算控件的值和验证状态。
     */
    updateValueAndValidity() {
        this._runValidator();
    }
    _runValidator() {
        if (!this.validator)
            return;
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
    _runAsyncValidator() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.asyncValidator)
                return;
            // 挂起
            this.markAsPending();
            for (const asyncValidatorFn of this.asyncValidator) {
                const error = yield asyncValidatorFn(this);
                // 返回了错误
                if (error !== null) {
                    this._control.errors = error;
                    this.markAsInValid();
                    return;
                }
            }
            this._control.errors = null;
            this.markAsValid();
        });
    }
}
exports.AbstractControl = AbstractControl;
class FormControl extends AbstractControl {
    /**
     *
     * @param formState 初始值
     */
    constructor(formState, validatorOrOpts, asyncValidator) {
        super(validatorOrOpts || null, asyncValidator || null);
        this._value = mobx_1.observable.box("");
        this._value.set(formState || "");
    }
    get value() {
        return this._value.get();
    }
    setValue(value) {
        this._value.set(value);
    }
    reset(value) {
        this._value.set(value || "");
    }
}
exports.FormControl = FormControl;
//# sourceMappingURL=forms.js.map