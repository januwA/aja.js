"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const const_string_1 = require("../utils/const-string");
const mobx_1 = require("mobx");
const l = console.log;
/**
 * * 将dom节点和FormControl绑定在一起
 */
class FormControlSerivce {
    constructor(node, control) {
        this.node = node;
        this.control = control;
        this.setup();
    }
    /**
     * * 控件 <=> FormContril
     * @param node
     */
    setup() {
        // 控件同步到formControl
        // 是否禁用
        if ("disabled" in this.node) {
            const inputNode = this.node;
            if (inputNode.disabled)
                this.control.disable();
            else
                this.control.enable();
        }
        // 值发生变化了
        this.node.addEventListener(const_string_1.EventType.input, () => {
            if ("value" in this.node) {
                this.control.setValue(this.node.value);
            }
            this.control.markAsDirty();
        });
        // 控件被访问了
        this.node.addEventListener(const_string_1.EventType.blur, () => this.control.markAsTouched());
        const that = this;
        // formControl同步到控件
        mobx_1.autorun(() => {
            // 这个主要监听setValue()，和初始化时，将新值同步到控件中去
            const inputNode = this.node;
            if (this.control.value !== inputNode.value) {
                inputNode.value = this.control.value;
            }
            this._checkValidity(inputNode);
        });
        mobx_1.autorun(() => {
            this.node.classList.toggle(FormControlSerivce.classes.touched, this.control.touched);
            this.node.classList.toggle(FormControlSerivce.classes.untouched, this.control.untouched);
            this.node.classList.toggle(FormControlSerivce.classes.pristine, this.control.pristine);
            this.node.classList.toggle(FormControlSerivce.classes.dirty, this.control.dirty);
            this.node.classList.toggle(FormControlSerivce.classes.valid, this.control.valid);
            this.node.classList.toggle(FormControlSerivce.classes.invalid, this.control.invalid);
            const inputNode = this.node;
            if ("disabled" in inputNode) {
                inputNode.disabled = this.control.disabled;
            }
        });
    }
    /**
     * * 验证节点的值
     * * 如果控件被禁用，则不校验
     * @param node
     */
    _checkValidity(node) {
        if ("checkValidity" in node) {
            const inputNode = node;
            // 如果控件被禁用，这将一直返回true
            // 初始化时只会验证required
            // 只有在input期间验证，才会验证到minlength之类的
            const ok = inputNode.checkValidity();
            if (ok)
                this.control.markAsValid();
            else
                this.control.markAsInValid();
            // h5验证完后启用内置的验证
            this.control.updateValueAndValidity();
        }
    }
}
exports.FormControlSerivce = FormControlSerivce;
FormControlSerivce.classes = {
    // 控件被访问过
    touched: "aja-touched",
    untouched: "aja-untouched",
    // 控件的值变化了
    dirty: "aja-dirty",
    pristine: "aja-pristine",
    // 控件的值有效
    valid: "aja-valid",
    invalid: "aja-invalid" // false
};
//# sourceMappingURL=form-control.service.js.map