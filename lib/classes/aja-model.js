"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const const_string_1 = require("../utils/const-string");
const mobx_1 = require("mobx");
class AjaModel {
    constructor(node) {
        this.node = node;
        AjaModel.classListSetup(node);
        this.control = mobx_1.observable({
            touched: this.node.classList.contains(AjaModel.classes.touched),
            untouched: this.node.classList.contains(AjaModel.classes.untouched),
            dirty: this.node.classList.contains(AjaModel.classes.dirty),
            pristine: this.node.classList.contains(AjaModel.classes.pristine),
            valid: this.node.classList.contains(AjaModel.classes.valid),
            invalid: this.node.classList.contains(AjaModel.classes.invalid)
        });
        this._setup();
    }
    /**
     * * 初始化class服务
     * @param node
     */
    static classListSetup(node) {
        node.classList.add(AjaModel.classes.untouched, AjaModel.classes.pristine);
        this.checkValidity(node);
    }
    /**
     * * 验证节点的值
     * @param node
     */
    static checkValidity(node) {
        if ("checkValidity" in node) {
            const inputNode = node;
            const ok = inputNode.checkValidity();
            node.classList.toggle(AjaModel.classes.valid, ok);
            node.classList.toggle(AjaModel.classes.invalid, !ok);
            return ok;
        }
    }
    /**
     * * 节点的值发生了变化
     * @param node
     */
    static valueChange(node) {
        node.classList.replace(AjaModel.classes.pristine, AjaModel.classes.dirty);
    }
    /**
     * * 节点被访问
     */
    static touched(node) {
        node.classList.replace(AjaModel.classes.untouched, AjaModel.classes.touched);
    }
    get model() {
        return this.node.value;
    }
    /**
     * * 跟踪绑定到指令的名称。父窗体使用此名称作为键来检索此控件的值。
     */
    get name() {
        return this.node.name || null;
    }
    get value() {
        return this.node.value;
    }
    /**
     * * 跟踪控件是否被禁用
     */
    get disabled() {
        return this.node.disabled;
    }
    get enabled() {
        return !this.disabled;
    }
    get dirty() {
        return this.control.dirty;
    }
    get pristine() {
        return this.control.pristine;
    }
    get valid() {
        return this.control.valid;
    }
    get invalid() {
        return this.control.invalid;
    }
    get touched() {
        return this.control.touched;
    }
    get untouched() {
        return this.control.untouched;
    }
    _setup() {
        // 值发生变化了
        this.node.addEventListener(const_string_1.EventType.input, () => {
            this.control.pristine = false;
            this.control.dirty = true;
            AjaModel.valueChange(this.node);
            const ok = AjaModel.checkValidity(this.node);
            if (ok) {
                // 控件的值有效
                this.control.valid = true;
                this.control.invalid = false;
            }
            else {
                // 控件的值无效
                this.control.valid = false;
                this.control.invalid = true;
            }
        });
        // 控件被访问了
        this.node.addEventListener(const_string_1.EventType.blur, () => {
            this.control.untouched = false;
            this.control.touched = true;
            AjaModel.touched(this.node);
        });
    }
}
exports.AjaModel = AjaModel;
AjaModel.classes = {
    // 控件被访问过
    // 一般就是监听blur事件
    touched: "aja-touched",
    untouched: "aja-untouched",
    // 控件的值变化了
    dirty: "aja-dirty",
    pristine: "aja-pristine",
    // 控件的值有效
    valid: "aja-valid",
    invalid: "aja-invalid" // false
};
//# sourceMappingURL=aja-model.js.map