"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("./utils/util");
const store_1 = require("./store");
const exp_1 = require("./utils/exp");
const binding_if_builder_1 = require("./classes/binding-if-builder");
const binding_for_builder_1 = require("./classes/binding-for-builder");
const binding_text_builder_1 = require("./classes/binding-text-builder");
const l = console.log;
class Aja {
    constructor(view, options) {
        /**
         * * 模板变量保存的DOM
         */
        this._templateVariables = {};
        /**
         * *  指令前缀
         * [:for] [:if]
         */
        this._instructionPrefix = ":";
        /**
         * <button (click)="setName($event)">click me</button>
         */
        this._templateEvent = "$event";
        /**
         * * 双向绑定指令
         */
        this._modeldirective = "[(model)]";
        this._pipes = {
            /**
             * * 全部大写
             * @param value
             */
            uppercase(value) {
                return value.toUpperCase();
            },
            /**
             * * 全部小写
             * @param value
             */
            lowercase(value) {
                return value.toLowerCase();
            },
            /**
             * * 首字母小写
             * @param str
             */
            capitalize(str) {
                return str.charAt(0).toUpperCase() + str.substring(1);
            }
        };
        const root = util_1.createRoot(view);
        if (root === null)
            return;
        if (options.instructionPrefix)
            this._instructionPrefix = options.instructionPrefix;
        if (options.templateEvent)
            this._templateEvent = options.templateEvent;
        if (options.modeldirective)
            this._modeldirective = options.modeldirective;
        if (options.pipes)
            this._pipes = Object.assign(this._pipes, options.pipes);
        this._proxyState(options);
        if (options.initState)
            options.initState.call(this.$store);
        this._define(root, this.$store);
    }
    /**
     * * :if
     */
    get _ifInstruction() {
        return this._instructionPrefix + "if";
    }
    /**
     * * :for
     */
    get _forInstruction() {
        return this._instructionPrefix + "for";
    }
    get $actions() {
        return this.$store.$actions;
    }
    /**
     * 扫描绑定
     * @param root
     */
    _define(root, state) {
        let depath = true;
        // 没有attrs就不解析了
        if (root.attributes && root.attributes.length) {
            // 优先解析if -> for -> 其它属性
            depath = this._parseBindIf(root, state);
            if (depath)
                depath = this._parseBindFor(root, state);
            if (depath) {
                const attrs = Array.from(root.attributes);
                this._parseBindAttrs(root, attrs, state);
            }
        }
        const children = Array.from(root.childNodes);
        if (depath && children.length) {
            this._bindingChildrenAttrs(children, state);
        }
    }
    /**
     * * 解析指定HTMLElement的属性
     * @param htmlElement
     * @param state
     */
    _parseBindAttrs(htmlElement, attrs, state) {
        for (const attr of attrs) {
            const { name, value } = attr;
            // #input #username
            if (util_1.tempvarp(name)) {
                this._tempvarBindHandle(htmlElement, attr);
                continue;
            }
            // [title]='xxx'
            if (util_1.attrp(name)) {
                this._attrBindHandle(htmlElement, attr, state);
                continue;
            }
            // (click)="echo('hello',$event)"
            if (util_1.eventp(name)) {
                this._eventBindHandle(htmlElement, attr, state);
                continue;
            }
            // [(model)]="username"
            if (util_1.modelp(name, this._modeldirective)) {
                const nodeName = htmlElement.nodeName;
                if (nodeName === "INPUT" || nodeName === "TEXTAREA") {
                    const inputElement = htmlElement;
                    // l(inputElement.type);
                    if (inputElement.type === "checkbox") {
                        const data = this._getData(value, state);
                        // 这个时候的data如果是array, 就对value进行处理
                        // 不然就当作bool值处理
                        if (!util_1.arrayp(data)) {
                            store_1.reaction(() => [this._getData(value, state)], states => {
                                inputElement.checked = !!states[0];
                            });
                            inputElement.addEventListener("change", () => {
                                this._setDate(value, inputElement.checked, state);
                            });
                        }
                        else {
                            store_1.reaction(() => [this._getData(value, state)], states => {
                                const data = states[0];
                                let ivalue = util_1.getCheckBoxValue(inputElement);
                                inputElement.checked = data.some((d) => d === ivalue);
                            });
                            inputElement.addEventListener("change", () => {
                                const data = this._getData(value, state);
                                let ivalue = util_1.getCheckBoxValue(inputElement);
                                if (inputElement.checked) {
                                    data.push(ivalue);
                                }
                                else {
                                    const newData = store_1.Store.list(data.filter((d) => d !== ivalue));
                                    this._setDate(value, newData, state);
                                }
                            });
                        }
                    }
                    else if (inputElement.type === "radio") {
                        // 单选按钮
                        store_1.reaction(() => [this._getData(value, state)], states => {
                            inputElement.checked = states[0] === inputElement.value;
                        });
                        inputElement.addEventListener("change", () => {
                            let newData = inputElement.value;
                            if (newData === "on")
                                newData = "";
                            this._setDate(value, newData, state);
                            inputElement.checked = true;
                        });
                    }
                    else {
                        // 其它
                        store_1.reaction(() => [this._getData(value, state)], states => {
                            inputElement.value = `${states[0]}`;
                        });
                        inputElement.addEventListener("input", () => {
                            this._setDate(value, inputElement.value, state);
                        });
                    }
                }
                else if (nodeName === "SELECT") {
                    // 对比value
                    const selectElement = htmlElement;
                    // 稍微延迟下，因为内部的模板可能没有解析
                    setTimeout(() => {
                        store_1.reaction(() => [this._getData(value, state)], states => {
                            const data = states[0];
                            const selectOptions = Array.from(selectElement.options);
                            let notFind = true;
                            // 多选参数必须为 array
                            if (selectElement.multiple && util_1.arrayp(data)) {
                                selectElement.selectedIndex = -1;
                                for (let index = 0; index < selectOptions.length; index++) {
                                    const option = selectOptions[index];
                                    const v = option.value;
                                    if (data.some(d => d === v)) {
                                        notFind = false;
                                        option.selected = true;
                                    }
                                }
                            }
                            else {
                                // 没找到默认-1
                                const index = selectOptions.findIndex(op => op.value === data);
                                selectElement.selectedIndex = index;
                                notFind = false;
                            }
                            if (notFind)
                                selectElement.selectedIndex = -1;
                        });
                    });
                    selectElement.addEventListener("change", () => {
                        if (selectElement.multiple) {
                            const multipleValue = Array.from(selectElement.options)
                                .filter(op => op.selected)
                                .map(op => op.value);
                            this._setDate(value, multipleValue, state);
                        }
                        else {
                            this._setDate(value, selectElement.value, state);
                        }
                    });
                }
                htmlElement.removeAttribute(name);
            }
        }
    }
    _proxyState(options) {
        const state = util_1.createObject(options.state);
        const computeds = util_1.createObject(options.computeds);
        const actions = util_1.createObject(options.actions);
        this.$store = new store_1.Store({ state, computeds, actions });
    }
    /**
     * * 1. 优先寻找模板变量
     * * 2. 在传入的state中寻找
     * * 3. 在this.$store中找
     * * 'name' 'object.name'
     * ? 优先找模板变量的数据，再找state
     * ? 虽然返回的是any， 但是这个函数不会返回 undefined
     * @param key
     * @param state
     */
    _getData(key, state) {
        if (typeof key !== "string")
            return null;
        // 优先解析管道
        const [bindKey, ...pipes] = key.split("|").map(e => e.trim());
        // 在解析绑定的变量
        const bindKeys = bindKey.split(".");
        let _result;
        const firstKey = bindKeys[0];
        // 模板变量
        //? 如果连第一个key都不存在，那么就别找了，找下去也会找错值
        if (firstKey in this._templateVariables) {
            for (const k of bindKeys) {
                _result = _result ? _result[k] : this._templateVariables[k];
            }
        }
        // state
        if (_result === undefined) {
            if (firstKey in state) {
                for (const k of bindKeys) {
                    _result = _result ? _result[k] : state[k];
                }
            }
        }
        // this.$store
        if (_result === undefined && state !== this.$store) {
            if (firstKey in this.$store) {
                for (const k of bindKeys) {
                    _result = _result ? _result[k] : this.$store[k];
                }
            }
        }
        if (_result === undefined) {
            // 没救了， eval随便解析返回个值吧!
            _result = this._parseJsString(bindKey, state);
        }
        // 开始管道加工
        if (pipes.length) {
            pipes.forEach(pipe => {
                const [p, ...pipeArgs] = pipe.split(":");
                if (p in this._pipes) {
                    const parsePipeArgs = pipeArgs.map(arg => {
                        if (util_1.isNumber(arg))
                            return arg;
                        return this._getData(arg, state);
                    });
                    _result = this._pipes[p](_result, ...parsePipeArgs);
                }
            });
        }
        return _result;
    }
    /**
     * 设置新数据，现在暂时在双向绑定的时候使用新数据, 数据来源于state
     * @param key
     * @param newValue
     * @param state
     */
    _setDate(key, newValue, state) {
        if (typeof key !== "string")
            return null;
        const keys = key.split(".");
        const keysSize = keys.length;
        if (!keysSize)
            return;
        const firstKey = keys[0];
        let _result;
        if (keysSize === 1 && firstKey in state) {
            state[firstKey] = newValue;
            return;
        }
        for (let index = 0; index < keysSize - 1; index++) {
            const k = keys[index];
            _result = _result ? _result[k] : state[k];
        }
        if (_result) {
            const lastKey = keys[keysSize - 1];
            _result[lastKey] = newValue;
            return;
        }
        this._parseJsString(key, state, true, newValue);
    }
    /**
     * 解析一些奇怪的插值表达式
     * {{ el['age'] }}
     * :for="(i, el) in arr" (click)="foo( 'xxx-' + el.name  )"
     * @param key
     * @param state
     * @param setState
     */
    _parseJsString(key, state, setState = false, newValue = "") {
        try {
            return util_1.ourEval(`return ${key}`);
        }
        catch (er) {
            // 利用错误来抓取变量
            const msg = er.message;
            if (msg.includes("is not defined")) {
                const match = msg.match(/(.*) is not defined/);
                if (!match)
                    return util_1.emptyString;
                const varName = match[1];
                const context = this._getData(varName, state);
                if (setState) {
                    const funBody = key.replace(new RegExp(`\\b${varName}`, "g"), "this") +
                        `='${newValue}'`;
                    util_1.ourEval.call(context, `${funBody}`);
                }
                else {
                    const funBody = key.replace(new RegExp(`\\b${varName}`, "g"), "this");
                    let _result = util_1.ourEval.call(context, `return ${funBody}`);
                    if (_result === undefined)
                        _result = util_1.emptyString;
                    return _result;
                }
            }
            else {
                console.error(er);
                throw er;
            }
        }
    }
    /**
     * ['obj.age', 12, false, '"   "', alert('xxx')] -> [22, 12, false, "   ", eval(<other>)]
     * @param args
     * @param e
     * @param state
     * @param isModel 是否为展开的双向绑定事件  [(model)]="name" (modelChange)="nameChange($event)"
     */
    _parseArgsToArguments(args, e, state, isModel = false) {
        return args.map(arg => {
            if (!arg)
                return arg;
            let el = arg.trim();
            if (el === this._templateEvent) {
                let _result;
                if (isModel) {
                    if (e.target) {
                        _result = e.target.value;
                    }
                }
                else {
                    _result = e;
                }
                return _result;
            }
            return this._getData(el, state);
        });
    }
    /**
     * 解析一个节点上是否绑定了:if指令, 并更具指令的值来解析节点
     * @param node
     * @param attrs
     */
    _parseBindIf(node, state) {
        let show = true;
        const bifb = new binding_if_builder_1.BindingIfBuilder(node, this._ifInstruction);
        if (bifb.hasIfAttr) {
            const value = bifb.value;
            if (util_1.boolStringp(value)) {
                show = value === "true";
                bifb.checked(show);
            }
            else {
                store_1.reaction(() => [this._getData(value, state)], states => {
                    show = states[0];
                    bifb.checked(show);
                });
            }
        }
        return show;
    }
    /**
     * 解析节点上绑定的for指令
     * 如果节点绑定了for指令，这个节点将不会继续被解析
     * @param node
     * @param state
     */
    _parseBindFor(node, state) {
        const bforb = new binding_for_builder_1.BindingForBuilder(node, this._forInstruction);
        if (bforb.hasForAttr) {
            // 创建注释节点
            if (bforb.isNumberData) {
                const _data = +bforb.bindData;
                for (let v = 0; v < _data; v++) {
                    const forState = bforb.createForContextState(v);
                    const item = bforb.createItem();
                    this._define(item, forState);
                }
                bforb.draw(_data);
            }
            else {
                const _that = this;
                store_1.reaction(() => [this._getData(bforb.bindData, state)], states => {
                    const _data = states[0];
                    bforb.clear();
                    let keys;
                    if (util_1.arrayp(_data))
                        keys = Object.keys(_data);
                    else
                        keys = _data;
                    for (const k in keys) {
                        const forState = bforb.createForContextState(k, _data[k], false);
                        const item = bforb.createItem();
                        _that._define(item, forState);
                    }
                    bforb.draw(_data);
                });
            }
        }
        return !bforb.hasForAttr;
    }
    /**
     * 处理 [title]='xxx' 解析
     * @param htmlElement
     * @param param1
     */
    _attrBindHandle(htmlElement, { name, value }, state) {
        let [attrName, attrChild] = name
            .replace(exp_1.attrStartExp, util_1.emptyString)
            .replace(exp_1.attrEndExp, util_1.emptyString)
            .split(".");
        store_1.reaction(() => [this._getData(value, state)], states => {
            const data = states[0];
            if (attrName === "style") {
                if (attrChild && attrChild in htmlElement.style) {
                    htmlElement.style[attrChild] = data;
                }
                else {
                    const styles = data;
                    for (const key in styles) {
                        if (Object.getOwnPropertyDescriptor(htmlElement.style, key) &&
                            styles[key]) {
                            store_1.reaction(() => [styles[key]], states => {
                                htmlElement.style[key] = states[0];
                            });
                        }
                    }
                }
            }
            else if (attrName === "class") {
                let _value = data;
                if (_value === null)
                    _value = util_1.emptyString;
                if (!attrChild) {
                    if (util_1.objectp(_value)) {
                        for (const klass in _value) {
                            store_1.reaction(() => [_value[klass]], states => {
                                if (states[0]) {
                                    htmlElement.classList.add(klass);
                                }
                                else {
                                    htmlElement.classList.remove(klass);
                                }
                            });
                        }
                    }
                    else {
                        htmlElement.setAttribute(attrName, _value);
                    }
                }
                else {
                    if (_value) {
                        htmlElement.classList.add(attrChild);
                    }
                }
            }
            else if (attrName === "innerhtml") {
                htmlElement.innerHTML = data;
            }
            else {
                let _value = data;
                if (_value === null)
                    _value = util_1.emptyString;
                htmlElement.setAttribute(attrName, _value);
            }
        });
        htmlElement.removeAttribute(name);
    }
    /**
     * 处理 (click)="echo('hello',$event)" 解析
     * @param htmlElement
     * @param param1
     */
    _eventBindHandle(htmlElement, { name, value }, state) {
        let eventName = name
            .replace(exp_1.eventStartExp, util_1.emptyString)
            .replace(exp_1.eventEndExp, util_1.emptyString);
        // 函数名
        let funcName = value;
        // 函数参数
        let args = [];
        if (value.includes("(")) {
            // 带参数的函数
            const index = value.indexOf("(");
            funcName = value.substr(0, index);
            args = util_1.parseTemplateEventArgs(value);
        }
        const modelChangep = eventName === "modelchange";
        if (modelChangep)
            eventName = "input";
        htmlElement.addEventListener(eventName, e => {
            //? 每次点击都需解析参数?
            //! 如果只解析一次，那么模板变量需要提前声明, 并且模板变量不会更新!
            if (this.$actions && funcName in this.$actions) {
                this.$actions[funcName].apply(this.$store, this._parseArgsToArguments(args, e, state, modelChangep));
            }
        });
        htmlElement.removeAttribute(name);
    }
    /**
     * * 处理模板变量 #input 解析
     * @param htmlElement
     * @param param1
     */
    _tempvarBindHandle(htmlElement, { name }) {
        this._templateVariables[name.replace(exp_1.tempvarExp, util_1.emptyString)] = htmlElement;
        htmlElement.removeAttribute(name);
    }
    /**
     * * 克隆DOM节点，默认深度克隆，绑定模板事件
     * @param htmlElement
     * @param forState
     * @param deep
     */
    _cloneNode(htmlElement, forState, deep = true) {
        const item = htmlElement.cloneNode(deep);
        const forElementAttrs = Array.from(htmlElement.attributes);
        const eventAttrs = forElementAttrs.filter(e => util_1.eventp(e.name));
        if (eventAttrs.length) {
            for (const eventAttr of eventAttrs) {
                this._eventBindHandle(item, eventAttr, forState);
            }
        }
        return item;
    }
    /**
     * * 递归解析子节点
     * @param childNodes
     * @param state
     */
    _bindingChildrenAttrs(children, state) {
        if (!children.length)
            return;
        let node = children[0];
        if (util_1.elementNodep(node)) {
            this._define(node, state);
        }
        if (util_1.textNodep(node)) {
            this._setTextContent(node, state);
        }
        return this._bindingChildrenAttrs(children.slice(1), state);
    }
    /**
     * * 解析文本节点的插值表达式
     * @param childNode
     * @param state
     */
    _setTextContent(childNode, state) {
        const btextb = new binding_text_builder_1.BindingTextBuilder(childNode);
        if (!btextb.needParse)
            return;
        store_1.reaction(() => btextb.bindVariables.map(k => this._getData(k, state)), (states) => {
            btextb.draw(states);
        });
    }
}
exports.default = Aja;
//# sourceMappingURL=aja.js.map