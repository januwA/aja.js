"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const aja_model_1 = require("./aja-model");
const util_1 = require("../utils/util");
const p_1 = require("../utils/p");
const store_1 = require("../store");
class BindingModelBuilder {
    constructor(node, modelAttr) {
        this.node = node;
        this.modelAttr = modelAttr;
        this._setup();
    }
    get options() {
        if (!this.select)
            return [];
        return util_1.toArray(this.select.options);
    }
    get selectValues() {
        return this.options.filter(op => op.selected).map(op => op.value);
    }
    _setup() {
        if (p_1.inputp(this.node) || p_1.textareap(this.node)) {
            if (p_1.checkboxp(this.node)) {
                this.checkbox = this.node;
            }
            else if (p_1.radiop(this.node)) {
                this.radio = this.node;
            }
            else {
                this.input = this.node;
            }
        }
        else if (p_1.selectp(this.node)) {
            this.select = this.node;
        }
        this.node.classList.add(aja_model_1.AjaModel.classes.untouched, aja_model_1.AjaModel.classes.pristine, aja_model_1.AjaModel.classes.valid);
        // 控件被访问了
        // 所有绑定的model的元素，都会添加这个服务
        this.node.addEventListener("blur", () => {
            this.touched();
        });
        this.node.removeAttribute(this.modelAttr.name);
    }
    checkboxSetup(states, isArray) {
        if (this.checkbox) {
            if (isArray) {
                const data = states[0];
                let ivalue = util_1.getCheckboxRadioValue(this.checkbox);
                const checkde = data.some((d) => d === ivalue);
                this.checkbox.checked = checkde;
            }
            else {
                this.checkbox.checked = !!states[0];
            }
        }
    }
    checkboxChangeListener(isArray, data, setData) {
        if (this.checkbox) {
            this.checkbox.addEventListener("change", () => {
                if (!this.checkbox)
                    return;
                if (isArray) {
                    let ivalue = util_1.getCheckboxRadioValue(this.checkbox);
                    if (this.checkbox.checked)
                        data.push(ivalue);
                    else
                        data.remove((d) => d === ivalue);
                }
                else {
                    setData(this.checkbox.checked);
                }
                this.dirty();
            });
        }
    }
    radioSetup(states) {
        if (this.radio) {
            this.radio.checked = states[0] === this.radio.value;
        }
    }
    radioChangeListener(setData) {
        if (this.radio) {
            this.radio.addEventListener("change", () => {
                if (!this.radio)
                    return;
                let newData = util_1.getCheckboxRadioValue(this.radio);
                this.radio.checked = true;
                this.dirty();
                setData(newData);
            });
        }
    }
    inputSetup(states) {
        if (this.input) {
            this.input.value = states[0];
        }
    }
    inputChangeListener(setData) {
        if (this.input) {
            // 值发生变化了
            this.input.addEventListener("input", () => {
                var _a;
                this.dirty();
                setData((_a = this.input) === null || _a === void 0 ? void 0 : _a.value);
            });
        }
    }
    selectSetup(states) {
        if (this.select) {
            const data = states[0];
            const selectOptions = util_1.toArray(this.select.options);
            // 多选参数必须为 array
            if (this.select.multiple && p_1.arrayp(data)) {
                let notFind = true;
                this.select.selectedIndex = -1;
                this.options.forEach(option => {
                    if (data.some((d) => d === option.value)) {
                        notFind = false;
                        option.selected = true;
                    }
                });
                if (notFind)
                    this.select.selectedIndex = -1;
            }
            else {
                // 没找到默认-1
                const index = selectOptions.findIndex(op => op.value === data);
                this.select.selectedIndex = index;
            }
        }
    }
    selectChangeListener(setData) {
        if (this.select) {
            this.select.addEventListener("change", () => {
                var _a, _b;
                if ((_a = this.select) === null || _a === void 0 ? void 0 : _a.multiple) {
                    setData(store_1.Store.list(this.selectValues));
                }
                else {
                    setData((_b = this.select) === null || _b === void 0 ? void 0 : _b.value);
                }
                this.dirty();
            });
        }
    }
    /**
     * * 控件的值有效时
     */
    valid() {
        this.node.classList.replace(aja_model_1.AjaModel.classes.invalid, aja_model_1.AjaModel.classes.valid);
    }
    /**
     * * 控件的值无效时
     */
    invalid() {
        this.node.classList.replace(aja_model_1.AjaModel.classes.valid, aja_model_1.AjaModel.classes.invalid);
    }
    /**
     * * 控件的值发生变化
     */
    dirty() {
        this.node.classList.replace(aja_model_1.AjaModel.classes.pristine, aja_model_1.AjaModel.classes.dirty);
    }
    /**
     * * 控件被访问
     */
    touched() {
        this.node.classList.replace(aja_model_1.AjaModel.classes.untouched, aja_model_1.AjaModel.classes.touched);
    }
}
exports.BindingModelBuilder = BindingModelBuilder;
//# sourceMappingURL=binding-model-builder.js.map