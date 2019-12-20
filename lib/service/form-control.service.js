"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const const_string_1 = require("../utils/const-string");
const mobx_1 = require("mobx");
const p_1 = require("../utils/p");
const l = console.log;
class FormControlSerivce {
    /**
     * * 响应式表单与dom的桥梁
     * * dom <=> FormControl
     */
    constructor(node, control) {
        this.node = node;
        this.control = control;
        this.setup();
    }
    /**
     * * 控件 <=> FormControl
     * @param node
     */
    setup() {
        mobx_1.autorun(() => {
            if (p_1.inputp(this.node)) {
                this.node.value = this.control.value;
            }
        });
        // 控件同步到formControl
        this._h5CheckValidity();
        // 是否禁用
        if (p_1.inputp(this.node)) {
            if (this.node.disabled)
                this.control.disable();
            else
                this.control.enable();
        }
        // 值发生变化了
        this.node.addEventListener(const_string_1.EventType.input, () => {
            if ("value" in this.node) {
                this.control.setValue(this.node.value);
            }
            this._h5CheckValidity();
            this.control.markAsDirty();
        });
        // 控件被访问了
        this.node.addEventListener(const_string_1.EventType.blur, () => this.control.markAsTouched());
        mobx_1.autorun(() => {
            this.node.classList.toggle(FormControlSerivce.classes.touched, this.control.touched);
            this.node.classList.toggle(FormControlSerivce.classes.untouched, this.control.untouched);
            this.node.classList.toggle(FormControlSerivce.classes.pristine, this.control.pristine);
            this.node.classList.toggle(FormControlSerivce.classes.dirty, this.control.dirty);
            this.node.classList.toggle(FormControlSerivce.classes.valid, this.control.valid);
            this.node.classList.toggle(FormControlSerivce.classes.invalid, this.control.invalid);
            if (p_1.inputp(this.node)) {
                this.node.disabled = this.control.disabled;
            }
        });
    }
    /**
     * * 验证节点的值
     * @param node
     */
    _h5CheckValidity() {
        if ("checkValidity" in this.node) {
            const inputNode = this.node;
            // 如果控件被禁用，h5将一直返回true
            // 初始化时只会验证required
            // 只有在input期间验证，才会验证到minlength之类的
            const ok = inputNode.checkValidity();
            if (!ok) {
                this.control.setErrors({
                    error: inputNode.validationMessage
                });
            }
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