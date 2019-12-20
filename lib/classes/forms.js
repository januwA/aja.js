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
const p_1 = require("../utils/p");
const l = console.log;
exports.VALID = "VALID";
exports.INVALID = "INVALID";
exports.PENDING = "PENDING";
exports.DISABLED = "DISABLED";
function _find(control, paths) {
    return paths.reduce((v, name) => {
        if (v instanceof FormGroup) {
            return v.controls.hasOwnProperty(name) ? v.controls[name] : null;
        }
        // if (v instanceof FormArray) {
        //   return v.at(<number>name) || null;
        // }
        return null;
    }, control);
}
/**
 * 将errors数组转化为{}
 * @param arrayOfErrors
 */
function _mergeErrors(arrayOfErrors) {
    const res = arrayOfErrors.reduce((acc, errors) => {
        // return nullp(errors) ? acc! : { ...acc!, ...errors };
        return p_1.nullp(errors) ? acc : Object.assign(acc, errors);
    }, {});
    return Object.keys(res).length === 0 ? null : res;
}
/**
 * * 将验证器数组转化为一个验证器
 * @param validators
 */
function compose(validators) {
    if (!validators)
        return null;
    // 过滤无效的验证器
    const presentValidators = validators.filter(o => o != null);
    if (presentValidators.length == 0)
        return null;
    return function (control) {
        // 运行所有验证器，获取错误数组
        const errors = presentValidators.map(v => v(control));
        return _mergeErrors(errors);
    };
}
function forkJoinPromise(promises) {
    return __awaiter(this, void 0, void 0, function* () {
        const errors = [];
        for (const v of promises) {
            const r = yield v;
            errors.push(r);
        }
        return errors;
    });
}
function composeAsync(validators) {
    // 这里的逻辑和[compose]的差不多
    if (!validators)
        return null;
    const presentValidators = validators.filter(o => o != null);
    if (presentValidators.length == 0)
        return null;
    return function (control) {
        return __awaiter(this, void 0, void 0, function* () {
            // 一组Promise验证器数组
            const promises = presentValidators.map(v => v(control));
            // 获取所有错误
            const errors = yield forkJoinPromise(promises);
            return _mergeErrors(errors);
        });
    };
}
function composeValidators(validators) {
    return p_1.nullp(validators) ? null : compose(validators);
}
function composeAsyncValidators(validators) {
    return !p_1.nullp(validators) ? composeAsync(validators) : null;
}
function coerceToValidator(validatorOrOpts) {
    // 如果是[AbstractControlOptions]就获取[AbstractControlOptions.validators]
    const validator = (p_1.objectp(validatorOrOpts)
        ? validatorOrOpts.validators
        : validatorOrOpts);
    return p_1.arrayp(validator) ? composeValidators(validator) : validator || null;
}
function coerceToAsyncValidator(asyncValidator, validatorOrOpts) {
    // 如果参数是一个[AbstractControlOptions]
    // 那么就获取[AbstractControlOptions.asyncValidators]
    // 否则就返回 [asyncValidator]
    const origAsyncValidator = (p_1.objectp(validatorOrOpts)
        ? validatorOrOpts.asyncValidators
        : asyncValidator);
    return p_1.arrayp(origAsyncValidator)
        ? composeAsyncValidators(origAsyncValidator)
        : origAsyncValidator || null;
}
class AbstractControl {
    constructor(validator, asyncValidator) {
        this.validator = validator;
        this.asyncValidator = asyncValidator;
        /**
         * 当控件组发生改变，将调用这个回调
         */
        this._onCollectionChange = () => { };
        this._control = mobx_1.observable({
            touched: false,
            dirty: false,
            disabled: false,
            pending: false,
            // 没有错误 valid
            // 有错误 invalid
            errors: null
        });
    }
    /**
     * * 默认注册一个全新的回调函数
     * @param fn
     */
    _registerOnCollectionChange(fn = () => { }) {
        this._onCollectionChange = fn;
    }
    get parent() {
        return this._parent;
    }
    setParent(parent) {
        this._parent = parent;
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
        if (!this._control.errors)
            return exports.VALID;
        if (this._control.errors)
            return exports.INVALID;
        if (this._control.pending)
            return exports.PENDING;
        return exports.DISABLED;
    }
    /**
     * this.profileForm.get('firstName')
     * this.profileForm.get('firstName/xxx')
     * @param path
     */
    get(path /* a/b/c */) {
        if (!path)
            return null;
        const paths = path.split('/').map(p => p.trim());
        if (paths.length === 0)
            return null;
        return _find(this, paths);
        ;
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
        const control = path ? this.get(path) : this;
        return control && control.errors ? control.errors[errorCode] : null;
    }
    hasError(errorCode, path) {
        return !!this.getError(errorCode, path);
    }
    /**
     * 获取最顶层的父级
     */
    get root() {
        let x = this;
        while (x._parent) {
            x = x._parent;
        }
        return x;
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
        return this.status === exports.VALID;
    }
    /**
     * 控件的值无效
     */
    get invalid() {
        return this.status === exports.INVALID;
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
        return !this.disabled;
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
        return !this.dirty;
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
        return !this.touched;
    }
    setValidators(newValidator) {
        this.validator = coerceToValidator(newValidator);
    }
    setAsyncValidators(newValidator) {
        this.asyncValidator = coerceToAsyncValidator(newValidator);
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
    }
    /**
     * 将控件标记为“未触摸”。
     * @param opts
     */
    markAsUntouched() {
        this._control.touched = false;
    }
    /**
     * 控件的值变化
     */
    markAsDirty() {
        this._control.dirty = true;
    }
    /**
     * 控件的值没发生变化
     */
    markAsPristine() {
        this._control.dirty = false;
    }
    /**
     * 禁用控件
     */
    disable() {
        this._control.disabled = true;
    }
    /**
     * 启用控件
     */
    enable() {
        this._control.disabled = false;
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
        // if (this.enabled) {
        this._control.errors = this._runValidator();
        if (this.status === exports.VALID || this.status === exports.PENDING) {
            this._runAsyncValidator();
        }
        // }
    }
    _runValidator() {
        return this.validator ? this.validator(this) : null;
    }
    _runAsyncValidator() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.asyncValidator)
                return;
            // 挂起
            this.markAsPending();
            this._control.errors = yield this.asyncValidator(this);
            this._control.pending = false;
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
        super(coerceToValidator(validatorOrOpts), coerceToAsyncValidator(asyncValidator, validatorOrOpts));
        this._value = mobx_1.observable.box("");
        this.setValue(formState || "");
    }
    get value() {
        return this._value.get();
    }
    setValue(value) {
        this._value.set(value);
        this.updateValueAndValidity();
    }
    patchValue(value) {
        this.setValue(value);
    }
    reset(value) {
        this._control.dirty = false;
        this._control.touched = false;
        this.setValue(value || "");
    }
}
exports.FormControl = FormControl;
class FormGroup extends AbstractControl {
    constructor(controls, validatorOrOpts, asyncValidator) {
        super(coerceToValidator(validatorOrOpts), coerceToAsyncValidator(asyncValidator, validatorOrOpts));
        this.controls = controls;
        this._setUpControls();
    }
    get value() {
        return Object.keys(this.controls).reduce((acc, item) => {
            return Object.assign(acc, {
                [item]: this.controls[item].value
            });
        }, {});
    }
    /**
     * 在组的控件列表中注册一个控件。
     * 此方法不会更新控件的值或有效性。
     * @param name
     * @param control
     */
    registerControl(name, control) {
        if (this.controls[name])
            return this.controls[name];
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
    addControl(name, control) {
        this.registerControl(name, control);
        this.updateValueAndValidity();
        this._onCollectionChange();
    }
    /**
     * 从该组中删除一个控件。
     * @param name
     */
    removeControl(name) {
        if (this.controls[name])
            this.controls[name]._registerOnCollectionChange();
        delete (this.controls[name]);
        this.updateValueAndValidity();
        this._onCollectionChange();
    }
    /**
     * 替换现有的控件。
     * @param name
     * @param control
     */
    setControl(name, control) {
        if (this.controls[name])
            this.controls[name]._registerOnCollectionChange();
        delete (this.controls[name]);
        if (control)
            this.registerControl(name, control);
        this.updateValueAndValidity();
        this._onCollectionChange();
    }
    /**
     * 检查组中是否存在具有给定名称的已启用控件。
     * 对于禁用控件，报告为false。 如果您想检查组中是否存在可以使用 [get]
     * @param controlName
     */
    contains(controlName) {
        return this.controls.hasOwnProperty(controlName) && this.controls[controlName].enabled;
    }
    /**
     * 设置formGroup的值
     * @param value
     * @param options
     * `onlySelf` When true, each change only affects this control, and not its parent. Default is
     */
    setValue(value, options = {}) {
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
    patchValue(value) {
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
    reset(value = {}) {
        this._forEachChild((control, name) => {
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
    _forEachChild(cb) {
        Object.keys(this.controls).forEach(k => cb(this.controls[k], k));
    }
    /**
     * * 设置自己的父元素
     */
    _setUpControls() {
        this._forEachChild((control) => {
            control.setParent(this);
            control._registerOnCollectionChange(this._onCollectionChange);
        });
    }
    /**
     * * 检查设置的新值，是否存在
     * @param value
     */
    _checkAllValuesPresent(value) {
        this._forEachChild((control, name) => {
            if (value[name] === undefined) {
                throw new Error(`Must supply a value for form control with name: '${name}'.`);
            }
        });
    }
}
exports.FormGroup = FormGroup;
//# sourceMappingURL=forms.js.map