"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("./utils/util");
const mobx_1 = require("mobx");
const exp_1 = require("./utils/exp");
const binding_if_builder_1 = require("./classes/binding-if-builder");
const binding_for_builder_1 = require("./classes/binding-for-builder");
const binding_text_builder_1 = require("./classes/binding-text-builder");
const p_1 = require("./utils/p");
const binding_model_builder_1 = require("./classes/binding-model-builder");
const pipes_1 = require("./pipes/pipes");
const const_string_1 = require("./utils/const-string");
const binding_tempvar_builder_1 = require("./classes/binding-tempvar-builder");
const context_data_1 = require("./classes/context-data");
const l = console.log;
class Aja {
    constructor(view, options) {
        if (!options || !view)
            return;
        const root = util_1.createRoot(view);
        if (root === null)
            return;
        if (options.pipes)
            Object.assign(pipes_1.ajaPipes, options.pipes);
        this._proxyState(options);
        if (options.initState)
            options.initState.call(this.$store);
        const contextData = new context_data_1.ContextData({
            globalState: this.$store,
            tvState: new binding_tempvar_builder_1.BindingTempvarBuilder(root)
        });
        this._define(root, contextData);
    }
    /**
     * 扫描绑定
     * @param root
     */
    _define(root, contextData) {
        let depath = true;
        // 没有attrs就不解析了
        if (root.attributes && root.attributes.length) {
            // 优先解析if -> for -> 其它属性
            depath = this._parseBindIf(root, contextData);
            if (depath)
                depath = this._parseBindFor(root, contextData);
            if (depath) {
                const attrs = util_1.toArray(root.attributes);
                this._parseBindAttrs(root, attrs, contextData);
            }
        }
        const childNodes = util_1.toArray(root.childNodes);
        if (depath && childNodes.length) {
            this._bindingChildNodesAttrs(childNodes, contextData);
        }
    }
    /**
     * * 解析指定HTMLElement的属性
     * @param node
     * @param contextData
     */
    _parseBindAttrs(node, attrs, contextData) {
        for (const attr of attrs) {
            const { name } = attr;
            // [title]='xxx'
            if (p_1.attrp(name)) {
                this._attrBindHandle(node, attr, contextData);
                continue;
            }
            // (click)="echo('hello',$event)"
            if (p_1.eventp(name)) {
                this._eventBindHandle(node, attr, contextData);
                continue;
            }
        }
        const model = new binding_model_builder_1.BindingModelBuilder(node);
        if (model.modelAttr) {
            if (p_1.inputp(node) || p_1.textareap(node)) {
                if (model.checkbox && p_1.checkboxp(model.checkbox)) {
                    const data = util_1.getData(model.modelAttr.value, contextData);
                    mobx_1.autorun(() => {
                        model.checkboxSetup(data);
                    });
                    model.checkboxChangeListener(data, contextData);
                }
                else if (model.radio && p_1.radiop(model.radio)) {
                    // 单选按钮
                    mobx_1.autorun(() => {
                        model.radioSetup(util_1.getData(model.modelAttr.value, contextData));
                    });
                    model.radioChangeListener(contextData);
                }
                else {
                    // 其它
                    mobx_1.autorun(() => {
                        model.inputSetup(util_1.getData(model.modelAttr.value, contextData));
                    });
                    model.inputChangeListener(contextData);
                }
            }
            else if (p_1.selectp(node)) {
                setTimeout(() => {
                    mobx_1.autorun(() => {
                        model.selectSetup(util_1.getData(model.modelAttr.value, contextData));
                    });
                });
                model.selectChangeListener(contextData);
            }
        }
    }
    _proxyState(options) {
        const state = util_1.createObject(options.state);
        this.$actions = util_1.createObject(options.actions);
        const bounds = {};
        Object.keys(this.$actions).forEach(ac => (bounds[ac] = mobx_1.action.bound));
        this.$store = mobx_1.observable(Object.assign(state, this.$actions), bounds, {
            deep: true
        });
    }
    /**
     * 解析一个节点上是否绑定了:if指令, 更具指令的值来解析节点
     * @param node
     * @param attrs
     */
    _parseBindIf(node, contextData) {
        let show = true;
        const ifBuilder = new binding_if_builder_1.BindingIfBuilder(node);
        if (ifBuilder.ifAttr) {
            if (p_1.boolStringp(ifBuilder.value)) {
                show = ifBuilder.value === "true";
                ifBuilder.checked(show, () => {
                    this._define(node, contextData.copyWith({
                        tvState: contextData.tvState.copyWith(node)
                    }));
                });
            }
            else {
                const [bindKey, pipeList] = util_1.parsePipe(ifBuilder.value);
                mobx_1.autorun(() => {
                    show = util_1.getData(bindKey, contextData);
                    show = pipes_1.usePipes(show, pipeList, contextData);
                    ifBuilder.checked(show, () => {
                        this._define(node, contextData.copyWith({
                            tvState: contextData.tvState.copyWith(node)
                        }));
                    });
                });
            }
        }
        return show;
    }
    /**
     * 解析节点上绑定的for指令
     * 如果节点绑定了for指令，这个节点将不会继续被解析
     * @param node
     * @param contextData
     */
    _parseBindFor(node, contextData) {
        const forBuilder = new binding_for_builder_1.BindingForBuilder(node, contextData);
        if (forBuilder.hasForAttr) {
            if (forBuilder.isNumberData) {
                let _data = +forBuilder.bindData;
                _data = pipes_1.usePipes(_data, forBuilder.pipes, contextData);
                for (let v = 0; v < _data; v++) {
                    const item = forBuilder.createItem();
                    const forLet = contextData.forLet + "_";
                    this._define(item, contextData.copyWith({
                        contextState: forBuilder.createForContextState(v),
                        tvState: contextData.tvState.copyWith(node),
                        forLet: forLet
                    }));
                }
                forBuilder.draw(_data);
            }
            else {
                const _that = this;
                mobx_1.autorun(() => {
                    let _data = util_1.getData(forBuilder.bindData, contextData);
                    _data = pipes_1.usePipes(_data, forBuilder.pipes, contextData);
                    forBuilder.clear();
                    for (const k in _data) {
                        const item = forBuilder.createItem();
                        _that._define(item, contextData.copyWith({
                            contextState: forBuilder.createForContextState(k, _data[k], false),
                            tvState: contextData.tvState.copyWith(node),
                            forLet: contextData.forLet + "_"
                        }));
                    }
                    forBuilder.draw(_data);
                });
            }
        }
        return !forBuilder.hasForAttr;
    }
    /**
     * 处理 [title]='xxx' 解析
     * @param node
     * @param param1
     */
    _attrBindHandle(node, { name, value }, contextData) {
        // [style.coloe] => [style, coloe]
        let [attrName, attrChild] = name
            .replace(exp_1.attrStartExp, util_1.emptyString)
            .replace(exp_1.attrEndExp, util_1.emptyString)
            .split(".");
        const [bindKey, pipeList] = util_1.parsePipe(value);
        mobx_1.autorun(() => {
            let data = util_1.getData(bindKey, contextData);
            data = pipes_1.usePipes(data, pipeList, contextData);
            let _value = data;
            switch (attrName) {
                case "style":
                    if (attrChild && attrChild in node.style) {
                        node.style[attrChild] = data;
                    }
                    else {
                        const styles = data;
                        for (const key in styles) {
                            if (Object.getOwnPropertyDescriptor(node.style, key)) {
                                node.style[key] = styles[key];
                            }
                        }
                    }
                    break;
                case "class":
                    if (_value === null)
                        _value = util_1.emptyString;
                    if (!attrChild) {
                        if (p_1.objectp(_value)) {
                            for (const klass in _value) {
                                if (_value[klass])
                                    node.classList.add(klass);
                                else
                                    node.classList.remove(klass);
                            }
                        }
                        else {
                            node.setAttribute(attrName, _value);
                        }
                    }
                    else {
                        if (_value)
                            node.classList.add(attrChild);
                    }
                    break;
                case "html":
                    if (data !== node.innerHTML)
                        node.innerHTML = data;
                    break;
                default:
                    if (_value === null)
                        _value = util_1.emptyString;
                    if (_value) {
                        if (node.getAttribute(attrName) !== _value) {
                            node.setAttribute(attrName, _value);
                        }
                    }
                    else {
                        if (node.hasAttribute(attrName))
                            node.removeAttribute(attrName);
                    }
                    break;
            }
        });
        node.removeAttribute(name);
    }
    /**
     * 处理 (click)="echo('hello',$event)" 解析
     * @param node
     * @param param1
     */
    _eventBindHandle(node, { name, value }, contextData) {
        let type = name
            .replace(exp_1.eventStartExp, util_1.emptyString)
            .replace(exp_1.eventEndExp, util_1.emptyString);
        // 函数名
        let funcName = value;
        // 函数参数
        let args = [];
        if (value.includes("(")) {
            // 带参数的函数
            const index = value.indexOf("(");
            // 砍出函数名
            funcName = value.substr(0, index);
            args = util_1.parseTemplateEventArgs(value);
        }
        const modelChangep = name === const_string_1.modelChangeEvent;
        if (modelChangep)
            type = const_string_1.EventType.input;
        if (this.$actions && funcName in this.$actions) {
            // 每次只需把新的event传入就行了
            node.addEventListener(type, e => {
                //? 每次事件响应都解析，确保变量更改能够得到新数据
                //? 如果放在外面，则不会响应新数据
                const transitionArgs = util_1.parseArgsToArguments(args, contextData);
                this.$actions[funcName].apply(this.$store, util_1.parseArgsEvent(transitionArgs, modelChangep ? e.target.value : e));
            });
        }
        node.removeAttribute(name);
    }
    /**
     * * 递归解析子节点
     * @param childNodes
     * @param contextData
     */
    _bindingChildNodesAttrs(childNodes, contextData) {
        if (!childNodes.length)
            return;
        let node = childNodes[0];
        if (p_1.elementNodep(node)) {
            this._define(node, contextData);
        }
        if (p_1.textNodep(node)) {
            this._setTextContent(node, contextData);
        }
        return this._bindingChildNodesAttrs(childNodes.slice(1), contextData);
    }
    /**
     * * 解析文本节点的插值表达式
     * @param textNode
     * @param contextData
     */
    _setTextContent(textNode, contextData) {
        const textBuilder = new binding_text_builder_1.BindingTextBuilder(textNode);
        mobx_1.autorun(() => {
            textBuilder.setText(contextData);
        });
    }
}
exports.default = Aja;
//# sourceMappingURL=aja.js.map