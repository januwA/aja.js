"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const aja_model_1 = require("./aja-model");
const util_1 = require("../utils/util");
const p_1 = require("../utils/p");
const const_string_1 = require("../utils/const-string");
const mobx_1 = require("mobx");
const core_1 = require("../core");
class BindingModelBuilder {
    constructor(node) {
        this.node = node;
        this.modelAttr = util_1.findModelAttr(node, const_string_1.modelDirective);
        if (!this.modelAttr)
            return;
        this.node.removeAttribute(this.modelAttr.name);
    }
    get options() {
        if (!this.select)
            return [];
        return util_1.toArray(this.select.options);
    }
    get selectValues() {
        return this.options.filter(op => op.selected).map(op => op.value);
    }
    setup(contextData) {
        if (!this.modelAttr || !this.modelAttr.value)
            return;
        if (p_1.inputp(this.node) || p_1.textareap(this.node)) {
            if (p_1.checkboxp(this.node)) {
                this.checkbox = this.node;
                const data = core_1.getData(this.modelAttr.value, contextData);
                mobx_1.autorun(() => {
                    this._checkboxSetup(data);
                });
                this._checkboxChangeListener(data, contextData);
            }
            else if (p_1.radiop(this.node)) {
                this.radio = this.node;
                mobx_1.autorun(() => {
                    this._radioSetup(core_1.getData(this.modelAttr.value, contextData));
                });
                this._radioChangeListener(contextData);
            }
            else {
                this.input = this.node;
                mobx_1.autorun(() => {
                    this._inputSetup(core_1.getData(this.modelAttr.value, contextData));
                });
                this._inputChangeListener(contextData);
            }
        }
        else if (p_1.selectp(this.node)) {
            this.select = this.node;
            setTimeout(() => {
                mobx_1.autorun(() => {
                    this._selectSetup(core_1.getData(this.modelAttr.value, contextData));
                });
            });
            this._selectChangeListener(contextData);
        }
        aja_model_1.AjaModel.classListSetup(this.node);
        // 控件被访问了
        // 所有绑定的model的元素，都会添加这个服务
        this.node.addEventListener(const_string_1.EventType.blur, () => aja_model_1.AjaModel.touched(this.node));
    }
    _checkboxSetup(data) {
        if (this.checkbox) {
            // array 处理数组，否则处理boolean值
            if (p_1.arrayp(data)) {
                let ivalue = util_1.getCheckboxRadioValue(this.checkbox);
                const checkde = data.some((d) => d === ivalue);
                this.checkbox.checked = checkde;
            }
            else {
                this.checkbox.checked = !!data;
            }
        }
    }
    _checkboxChangeListener(data, contextData) {
        if (this.checkbox) {
            this.checkbox.addEventListener(const_string_1.EventType.change, () => {
                if (!this.checkbox)
                    return;
                if (p_1.arrayp(data)) {
                    let ivalue = util_1.getCheckboxRadioValue(this.checkbox);
                    if (this.checkbox.checked)
                        data.push(ivalue);
                    else
                        data.remove(ivalue);
                }
                else {
                    if (this.modelAttr)
                        core_1.setData(this.modelAttr.value, this.checkbox.checked, contextData);
                }
                aja_model_1.AjaModel.valueChange(this.checkbox);
            });
        }
    }
    _radioSetup(states) {
        if (this.radio) {
            this.radio.checked = states[0] === this.radio.value;
        }
    }
    _radioChangeListener(contextData) {
        if (this.radio) {
            this.radio.addEventListener(const_string_1.EventType.change, () => {
                if (!this.radio)
                    return;
                let newData = util_1.getCheckboxRadioValue(this.radio);
                this.radio.checked = true;
                aja_model_1.AjaModel.valueChange(this.radio);
                if (this.modelAttr)
                    core_1.setData(this.modelAttr.value, newData, contextData);
            });
        }
    }
    _inputSetup(value) {
        if (this.input) {
            this.input.value = value;
        }
    }
    _inputChangeListener(contextData) {
        if (this.input) {
            // 值发生变化了
            this.input.addEventListener(const_string_1.EventType.input, () => {
                if (this.input && this.modelAttr) {
                    aja_model_1.AjaModel.valueChange(this.input);
                    aja_model_1.AjaModel.checkValidity(this.input);
                    core_1.setData(this.modelAttr.value, this.input.value, contextData);
                }
            });
        }
    }
    _selectSetup(states) {
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
    _selectChangeListener(contextData) {
        if (this.select) {
            this.select.addEventListener(const_string_1.EventType.change, () => {
                if (this.select && this.modelAttr) {
                    const bindKey = this.modelAttr.value;
                    if (this.select.multiple) {
                        core_1.setData(bindKey, this.selectValues, contextData);
                    }
                    else {
                        core_1.setData(bindKey, this.select.value, contextData);
                    }
                    aja_model_1.AjaModel.valueChange(this.select);
                }
            });
        }
    }
}
exports.BindingModelBuilder = BindingModelBuilder;
//# sourceMappingURL=binding-model-builder.js.map