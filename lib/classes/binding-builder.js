"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("../core");
const pipes_1 = require("../pipes");
const form_control_service_1 = require("../service/form-control.service");
const exp_1 = require("../utils/exp");
const util_1 = require("../utils/util");
const mobx_1 = require("mobx");
const aja_model_1 = require("./aja-model");
const util_2 = require("../utils/util");
const p_1 = require("../utils/p");
const const_string_1 = require("../utils/const-string");
const l = console.log;
class BindingBuilder {
    constructor(attr, contextData) {
        this.attr = attr;
        this.contextData = contextData;
    }
    get name() {
        return this.attr.name;
    }
    get value() {
        return this.attr.value;
    }
    get _parsePipe() {
        return util_2.parsePipe(this.attr.value);
    }
    get bindKey() {
        return this._parsePipe[0];
    }
    get pipeList() {
        return this._parsePipe[1];
    }
    /**
     * 自动将数据使用管道过滤后返回
     */
    getPipeData() {
        return pipes_1.usePipes(core_1.getData(this.bindKey, this.contextData), this.pipeList, this.contextData);
    }
}
exports.BindingBuilder = BindingBuilder;
class BindingAttrBuilder extends BindingBuilder {
    constructor(node, attr, contextData) {
        super(attr, contextData);
        this.node = node;
        this.attr = attr;
        this.contextData = contextData;
        if (this.isFormControl) {
            this._formControlSetup();
        }
        else {
            switch (this.attrName) {
                case "style":
                    this._styleSetup();
                    break;
                case "class":
                    this._classSetup();
                    break;
                case "html":
                    this._innerHTMLSetup();
                    break;
                default:
                    this._otherAttrSetup();
                    break;
            }
        }
        node.removeAttribute(this.name);
    }
    get isFormControl() {
        return this.name === const_string_1.formControlName;
    }
    // [style.coloe] => [style, coloe]
    get _parseAttr() {
        return this.name
            .replace(exp_1.attrStartExp, util_1.emptyString)
            .replace(exp_1.attrEndExp, util_1.emptyString)
            .split(".");
    }
    get attrName() {
        return this._parseAttr[0];
    }
    get attrChild() {
        return this._parseAttr[1];
    }
    _formControlSetup() {
        const formControl = core_1.getData(this.value, this.contextData);
        new form_control_service_1.FormControlSerivce(this.node, formControl);
    }
    _styleSetup() {
        mobx_1.autorun(() => {
            let data = this.getPipeData();
            if (this.attrChild && this.attrChild in this.node.style) {
                this.node.style[this.attrChild] = data;
            }
            else {
                const styles = data;
                for (const key in styles) {
                    if (Object.getOwnPropertyDescriptor(this.node.style, key)) {
                        this.node.style[key] = styles[key];
                    }
                }
            }
        });
    }
    _classSetup() {
        mobx_1.autorun(() => {
            let data = this.getPipeData();
            if (data === null)
                data = util_1.emptyString;
            if (!this.attrChild) {
                if (p_1.objectp(data)) {
                    for (const klass in data) {
                        if (data[klass])
                            this.node.classList.add(klass);
                        else
                            this.node.classList.remove(klass);
                    }
                }
                else {
                    this.node.setAttribute(this.attrName, data);
                }
            }
            else {
                if (data)
                    this.node.classList.add(this.attrChild);
            }
        });
    }
    _innerHTMLSetup() {
        mobx_1.autorun(() => {
            this.node.innerHTML = this.getPipeData();
        });
    }
    _otherAttrSetup() {
        mobx_1.autorun(() => {
            let data = this.getPipeData();
            if (data === null)
                data = util_1.emptyString;
            if (data) {
                this.node.setAttribute(this.attrName, data);
            }
            else {
                this.node.removeAttribute(this.attrName);
            }
        });
    }
}
exports.BindingAttrBuilder = BindingAttrBuilder;
class BindingTextBuilder {
    constructor(node, contextData) {
        this.node = node;
        this.contextData = contextData;
        this.text = node.textContent || "";
        this._setup();
    }
    _setup() {
        if (!exp_1.interpolationExpressionExp.test(this.text))
            return;
        mobx_1.autorun(() => {
            const text = this.text.replace(exp_1.interpolationExpressionExp, (match, g1) => {
                const pipeData = this.getPipeData(g1);
                return pipeData;
            });
            this.node.textContent = text;
        });
    }
    getPipeData(key) {
        const [bindKey, pipeList] = util_2.parsePipe(key);
        return pipes_1.usePipes(core_1.getData(bindKey, this.contextData), pipeList, this.contextData);
    }
}
exports.BindingTextBuilder = BindingTextBuilder;
class BindingModelBuilder {
    constructor(node, contextData) {
        this.node = node;
        this.contextData = contextData;
        this.attr = util_2.findModelAttr(node, const_string_1.modelDirective);
        if (!this.attr)
            return;
        this.node.removeAttribute(this.attr.name);
        this.setup();
    }
    get options() {
        if (!this.select)
            return [];
        return util_2.toArray(this.select.options);
    }
    get selectValues() {
        return this.options.filter(op => op.selected).map(op => op.value);
    }
    setup() {
        if (!this.attr || !this.attr.value)
            return;
        if (p_1.inputp(this.node) || p_1.textareap(this.node)) {
            if (p_1.checkboxp(this.node)) {
                this.checkbox = this.node;
                const data = core_1.getData(this.attr.value, this.contextData);
                mobx_1.autorun(() => {
                    this._checkboxSetup(data);
                });
                this._checkboxChangeListener(data, this.contextData);
            }
            else if (p_1.radiop(this.node)) {
                this.radio = this.node;
                mobx_1.autorun(() => {
                    this._radioSetup(core_1.getData(this.attr.value, this.contextData));
                });
                this._radioChangeListener(this.contextData);
            }
            else {
                // this.input = this.node;
                mobx_1.autorun(() => {
                    this._inputSetup(core_1.getData(this.attr.value, this.contextData));
                });
                this._inputChangeListener(this.contextData);
            }
        }
        else if (p_1.selectp(this.node)) {
            this.select = this.node;
            setTimeout(() => {
                mobx_1.autorun(() => {
                    this._selectSetup(core_1.getData(this.attr.value, this.contextData));
                });
            });
            this._selectChangeListener(this.contextData);
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
                let ivalue = util_2.getCheckboxRadioValue(this.checkbox);
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
                    let ivalue = util_2.getCheckboxRadioValue(this.checkbox);
                    if (this.checkbox.checked)
                        data.push(ivalue);
                    else
                        data.remove(ivalue);
                }
                else {
                    if (this.attr)
                        core_1.setData(this.attr.value, this.checkbox.checked, contextData);
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
                let newData = util_2.getCheckboxRadioValue(this.radio);
                this.radio.checked = true;
                aja_model_1.AjaModel.valueChange(this.radio);
                if (this.attr)
                    core_1.setData(this.attr.value, newData, contextData);
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
                if (this.input && this.attr) {
                    aja_model_1.AjaModel.valueChange(this.input);
                    aja_model_1.AjaModel.checkValidity(this.input);
                    core_1.setData(this.attr.value, this.input.value, contextData);
                }
            });
        }
    }
    _selectSetup(states) {
        if (this.select) {
            const data = states[0];
            const selectOptions = util_2.toArray(this.select.options);
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
                if (this.select && this.attr) {
                    const bindKey = this.attr.value;
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
class BindingIfBuilder {
    constructor(node) {
        this.node = node;
        let ifAttr = util_1.findIfAttr(node, const_string_1.structureDirectives.if);
        if (!ifAttr)
            return;
        this.attr = ifAttr;
        this.commentNode = document.createComment("");
        this.node.before(this.commentNode);
        this.node.removeAttribute(const_string_1.structureDirectives.if);
    }
    get value() {
        var _a;
        return ((_a = this.attr) === null || _a === void 0 ? void 0 : _a.value.trim()) || "";
    }
    /**
     * * 这里使用了回调把template标签给渲染了
     * @param show
     */
    checked(show) {
        if (!this.commentNode)
            return;
        if (show) {
            this.commentNode.after(this.node);
        }
        else {
            this.node.replaceWith(this.commentNode);
        }
        this.commentNode.data = this._createIfCommentData(show);
    }
    _createIfCommentData(value) {
        return `{":if": "${!!value}"}`;
    }
}
exports.BindingIfBuilder = BindingIfBuilder;
class BindingEventBuilder {
    constructor(node, attr, contextData, actions) {
        this.node = node;
        this.attr = attr;
        this.contextData = contextData;
        this.actions = actions;
        this.type = attr.name.replace(exp_1.eventStartExp, util_1.emptyString)
            .replace(exp_1.eventEndExp, util_1.emptyString);
        this.funcName = attr.value;
        let args = [];
        if (this.attr.value.includes("(")) {
            // 带参数的函数
            const index = this.attr.value.indexOf("(");
            // 砍出函数名
            this.funcName = this.attr.value.substr(0, index);
            args = this._parseTemplateEventArgs(this.attr.value);
        }
        const modelChangep = name === const_string_1.modelChangeEvent;
        if (modelChangep)
            this.type = const_string_1.EventType.input;
        if (this.actions && this.funcName in this.actions) {
            // 每次只需把新的event传入就行了
            node.addEventListener(this.type, e => {
                if (!this.actions)
                    return;
                //? 每次事件响应都解析，确保变量更改能够得到新数据
                //? 如果放在外面，则不会响应新数据
                const transitionArgs = this._parseArgsToArguments(args);
                this.actions[this.funcName].apply(this.contextData.store, this._parseArgsEvent(transitionArgs, modelChangep ? e.target.value : e));
            });
        }
        node.removeAttribute(name);
    }
    /**
     * 砍掉函数名
     * 去掉首尾圆括号
     * 用逗号分割参数
     * @param str
     */
    _parseTemplateEventArgs(str) {
        const index = str.indexOf("(");
        return str
            .substr(index)
            .trim()
            .replace(/(^\(*)|(\)$)/g, util_1.emptyString)
            .split(",");
    }
    _parseArgsToArguments(args) {
        return args.map(arg => {
            if (!arg)
                return arg;
            let el = arg.trim().toLowerCase();
            if (el === const_string_1.templateEvent)
                return el;
            return core_1.getData(el, this.contextData);
        });
    }
    _parseArgsEvent(args, e) {
        return args.map(arg => (arg === const_string_1.templateEvent) ? e : arg);
    }
}
exports.BindingEventBuilder = BindingEventBuilder;
class BindingForBuilder {
    constructor(node, contextData) {
        this.node = node;
        this.contextData = contextData;
        this.forBuffer = [];
        let forAttr = util_1.findForAttr(node, const_string_1.structureDirectives.for);
        // 没有for指令，就不构建下去了
        if (!forAttr)
            return;
        this.forAttr = forAttr;
        this.commentNode = document.createComment("");
        this.fragment = document.createDocumentFragment();
        node.replaceWith(this.commentNode);
        node.removeAttribute(const_string_1.structureDirectives.for);
    }
    get hasForAttr() {
        return !!this.forAttr;
    }
    get forAttrValue() {
        if (!this.forAttr)
            return;
        let [variable, bindKey] = this.forAttr.value
            .split(/\bin|of\b/)
            .map(s => s.trim());
        let variables = [];
        if (variable) {
            variables = variable
                .trim()
                .replace(exp_1.eventStartExp, util_1.emptyString)
                .replace(exp_1.eventEndExp, util_1.emptyString)
                .split(",")
                .map(v => v.trim());
        }
        const p = util_2.parsePipe(bindKey);
        return {
            variable,
            variables,
            bindData: p[0],
            pipes: p[1]
        };
    }
    get bindVar() {
        return this.forAttrValue.variable || this.contextData.forLet;
    }
    get bindKey() {
        return this.forAttrValue.variables[0] || this.contextData.forLet;
    }
    get bindValue() {
        if (this.hasForAttr) {
            return this.forAttrValue.variables[1];
        }
    }
    get bindData() {
        if (this.hasForAttr) {
            return this.forAttrValue.bindData;
        }
    }
    get isNumberData() {
        if (this.hasForAttr) {
            return p_1.numberStringp(this.bindData);
        }
    }
    get pipes() {
        var _a;
        if (this.hasForAttr) {
            return ((_a = this.forAttrValue) === null || _a === void 0 ? void 0 : _a.pipes) || [];
        }
        else {
            return [];
        }
    }
    /**
     * * 将所有节点插入DOM
     * @param data
     */
    draw(data) {
        if (this.commentNode && this.fragment) {
            this.commentNode.after(this.fragment);
            this.commentNode.data = this.createForCommentData(data);
        }
    }
    /**
     * * 清除所有节点
     */
    clear() {
        for (const forItem of this.forBuffer) {
            forItem.remove();
        }
        this.forBuffer = [];
    }
    createForContextState(k, v = null, isNumber = true) {
        const forState = {};
        if (isNumber) {
            forState[this.bindVar] = k;
        }
        else {
            if (this.bindKey && this.bindValue) {
                forState[this.bindKey] = k;
                forState[this.bindValue] = v;
            }
            else if (this.bindKey) {
                forState[this.bindKey] = v;
            }
        }
        return forState;
    }
    createForCommentData(obj) {
        let data = obj;
        if (p_1.arrayp(data)) {
            data = obj.slice(0, 6);
        }
        return `{":for": "${data}"}`;
    }
    createItem() {
        const item = this.node.cloneNode(true);
        if (this.fragment) {
            this.forBuffer.push(item);
            this.fragment.append(item);
        }
        return item;
    }
}
exports.BindingForBuilder = BindingForBuilder;
class BindingTempvarBuilder {
    constructor(node, templateVariables = {}) {
        /**
         * * 模板变量保存的DOM
         */
        this.templateVariables = {};
        // 浅克隆
        Object.assign(this.templateVariables, templateVariables);
        this.deepParse(node);
    }
    has(key) {
        return key.toLowerCase() in this.templateVariables;
    }
    get(key) {
        return this.templateVariables[key];
    }
    set(key, value) {
        this.templateVariables[key] = value;
    }
    copyWith(node) {
        return new BindingTempvarBuilder(node, this.templateVariables);
    }
    /**
     * * 解析模板引用变量
     * @param root
     */
    deepParse(root) {
        // 如果有结构指令，则跳过
        if (!util_1.hasStructureDirective(root)) {
            util_2.toArray(root.attributes)
                .filter(({ name }) => p_1.tempvarp(name))
                .forEach(attr => {
                this._tempvarBindHandle(root, attr);
            });
            util_2.toArray(root.childNodes).forEach(itemNode => {
                if (p_1.elementNodep(itemNode))
                    this.deepParse(itemNode);
            });
        }
    }
    /**
     * * 处理模板变量 #input 解析
     * @param node
     * @param param1
     */
    _tempvarBindHandle(node, { name, value }) {
        const _key = name.replace(exp_1.tempvarExp, util_1.emptyString);
        if (value === const_string_1.ajaModelString) {
            // 表单元素才绑定 ajaModel
            this.set(_key, new aja_model_1.AjaModel(node));
        }
        else {
            this.set(_key, node);
        }
        node.removeAttribute(name);
    }
}
exports.BindingTempvarBuilder = BindingTempvarBuilder;
//# sourceMappingURL=binding-builder.js.map