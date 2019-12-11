"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("./utils/util");
const store_1 = require("./store");
const exp_1 = require("./utils/exp");
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
        const root = util_1.createRoot(view);
        if (root === null)
            return;
        if (options.instructionPrefix)
            this._instructionPrefix = options.instructionPrefix;
        if (options.templateEvent)
            this._templateEvent = options.templateEvent;
        this._proxyState(options);
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
        const depath = this._bindingAttrs(root, state);
        if (depath)
            this._bindingChildrenAttrs(Array.from(root.childNodes), state);
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
        const keys = key.split(".");
        let _result;
        const firstKey = keys[0];
        // 模板变量
        //? 如果连第一个key都不存在，那么就别找了，找下去也会找错值
        if (firstKey in this._templateVariables) {
            for (const k of keys) {
                _result = _result ? _result[k] : this._templateVariables[k];
            }
        }
        // state
        if (_result === undefined) {
            if (firstKey in state) {
                for (const k of keys) {
                    _result = _result ? _result[k] : state[k];
                }
            }
        }
        // this.$store
        if (_result === undefined && state !== this.$store) {
            if (firstKey in this.$store) {
                for (const k of keys) {
                    _result = _result ? _result[k] : this.$store[k];
                }
            }
        }
        if (_result === undefined) {
            // 没救了， eval随便解析返回个值吧!
            _result = this._parseJsString(key, state);
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
     */
    _parseArgsToArguments(args, e, state) {
        return args.map(arg => {
            if (!arg)
                return arg;
            let el = arg.trim();
            if (el === this._templateEvent)
                return e;
            return this._getData(el, state);
        });
    }
    /**
     * 处理 :if 解析
     * @param htmlElement
     * @param attrs
     */
    _ifBindHandle(htmlElement, attrs, state) {
        let depath = true;
        // 是否有 :if 指令
        let ifAttr = attrs.find(({ name }) => util_1.ifp(name, this._ifInstruction));
        if (ifAttr) {
            // 创建注释节点做标记
            const commentElement = document.createComment("");
            // 将注释节点插入到节点上面
            htmlElement.before(commentElement);
            store_1.autorun(() => {
                let value = ifAttr.value.trim();
                let show = true;
                if (util_1.isBoolString(value)) {
                    show = value === "true";
                }
                else {
                    show = this._getData(value, state);
                }
                if (show) {
                    commentElement.after(htmlElement);
                    depath = true;
                }
                else {
                    htmlElement.replaceWith(commentElement);
                    depath = false;
                }
                commentElement.data = util_1.createIfCommentData(show);
            });
            htmlElement.removeAttribute(this._ifInstruction);
        }
        return depath;
    }
    _forBindHandle(htmlElement, attrs, state) {
        let depath = true;
        // 是否有 :for 指令
        let forAttr = attrs.find(({ name }) => util_1.ifp(name, this._forInstruction));
        if (forAttr) {
            depath = false;
            const { name, value } = forAttr;
            // 解析for指令的值
            let [varb, data] = value.split(/\bin\b/).map(s => s.trim());
            if (!varb)
                return depath;
            // 创建注释节点
            const commentElement = document.createComment("");
            htmlElement.replaceWith(commentElement);
            htmlElement.removeAttribute(this._forInstruction);
            const fragment = document.createDocumentFragment();
            if (util_1.isNumber(data)) {
                const _data = +data;
                for (let _v = 0; _v < _data; _v++) {
                    const forState = {};
                    Object.defineProperty(forState, varb, {
                        get() {
                            return _v;
                        }
                    });
                    const item = htmlElement.cloneNode(true);
                    fragment.append(item);
                    this._define(item, forState);
                }
                // 创建完添加到节点
                commentElement.after(fragment);
            }
            else {
                const _varb = varb
                    .trim()
                    .replace(exp_1.eventStartExp, util_1.emptyString)
                    .replace(exp_1.eventEndExp, util_1.emptyString)
                    .split(",")
                    .map(v => v.trim());
                const _data = this._getData(data, state);
                const _that = this;
                // 记录for生成的items，下次更新将全部删除
                const forBuffer = [];
                // 不要直接 in _data, 原型函数能被枚举
                store_1.autorun(() => {
                    for (const forItem of forBuffer) {
                        forItem.remove();
                    }
                    const _keys = Object.keys(_data);
                    for (const _k in _keys) {
                        const forState = {};
                        Object.defineProperties(forState, {
                            [_varb[0]]: {
                                get() {
                                    return _k;
                                }
                            },
                            [_varb[1]]: {
                                get() {
                                    return _that._getData(data, state)[_k];
                                }
                            }
                        });
                        const item = this._cloneNode(htmlElement, forState);
                        fragment.append(item);
                        forBuffer.push(item);
                        this._define(item, forState);
                    }
                    commentElement.after(fragment);
                });
            }
            commentElement.data = util_1.createForCommentData(data);
        }
        return depath;
    }
    /**
     * 处理 [title]='xxx' 解析
     * @param htmlElement
     * @param param1
     */
    _attrBindHandle(htmlElement, { name, value }, state) {
        let attrName = name
            .replace(exp_1.attrStartExp, util_1.emptyString)
            .replace(exp_1.attrEndExp, util_1.emptyString);
        store_1.autorun(() => {
            if (attrName === "style") {
                const styles = this._getData(value, state);
                for (const key in styles) {
                    // 过滤掉无效的style, 和空值
                    if (Object.getOwnPropertyDescriptor(htmlElement.style, key) &&
                        styles[key]) {
                        htmlElement.style[key] = styles[key];
                    }
                }
            }
            else if (attrName === "innerhtml") {
                htmlElement.innerHTML = this._getData(value, state);
            }
            else {
                let _value = this._getData(value, state);
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
        const eventName = name
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
        htmlElement.addEventListener(eventName, e => {
            //? 每次点击都需解析参数?
            //! 如果只解析一次，那么模板变量需要提前声明, 并且模板变量不会更新!
            if (this.$actions && funcName in this.$actions) {
                this.$actions[funcName].apply(this.$store, this._parseArgsToArguments(args, e, state));
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
     * * 解析指定HTMLElement的属性
     * @param htmlElement
     * @param state
     */
    _bindingAttrs(htmlElement, state) {
        let depath = true;
        const attrs = Array.from(htmlElement.attributes);
        if (!attrs.length)
            return depath;
        // :if
        depath = this._ifBindHandle(htmlElement, attrs, state);
        // :for
        depath = this._forBindHandle(htmlElement, attrs, state);
        if (!depath)
            return depath;
        // 遍历节点属性
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
            if (util_1.modelp(name)) {
                const nodeName = htmlElement.nodeName;
                if (nodeName === "INPUT" || nodeName === "TEXTAREA") {
                    const inputElement = htmlElement;
                    store_1.autorun(() => {
                        inputElement.value = `${this._getData(value, state)}`;
                    });
                    inputElement.addEventListener("input", () => {
                        this._setDate(value, inputElement.value, state);
                    });
                }
                else if (nodeName === "SELECT") {
                    // 对比value
                    const selectElement = htmlElement;
                    store_1.autorun(() => {
                        const data = this._getData(value, state);
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
                            for (let index = 0; index < selectOptions.length; index++) {
                                const v = selectOptions[index].value;
                                if (v == data) {
                                    selectElement.selectedIndex = index;
                                    notFind = false;
                                    continue;
                                }
                            }
                        }
                        if (notFind)
                            selectElement.selectedIndex = -1;
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
        return depath;
    }
    /**
     * * 循环解析子节点
     * @param childNodes
     * @param state
     */
    _bindingChildrenAttrs(children, state) {
        if (!children.length)
            return null;
        const childNode = children[0];
        // dom节点
        if (util_1.elementNodep(childNode)) {
            this._define(childNode, state);
        }
        if (util_1.textNodep(childNode)) {
            this._setTextContent(childNode, state);
        }
        return this._bindingChildrenAttrs(children.slice(1), state);
    }
    /**
     * * 解析文本节点的插值表达式
     * @param childNode
     * @param state
     */
    _setTextContent(childNode, state) {
        // 创建一个变量保存源文本
        let _initTextContent = childNode.textContent || util_1.emptyString;
        // 文本不包含插值表达式的，那么就跳过
        if (!exp_1.interpolationExpressionExp.test(_initTextContent))
            return;
        store_1.autorun(() => {
            childNode.textContent = _initTextContent.replace(exp_1.interpolationExpressionExp, (match, g1) => {
                // 获取插值表达式里面的文本 {{name}} -> name
                const key = g1.replace(exp_1.spaceExp, util_1.emptyString);
                let _data = this._getData(key, state);
                // 如果返回null字符，不好看
                // hello null :(
                // hello      :)
                if (_data === null)
                    return util_1.emptyString;
                return _data;
            });
        });
    }
}
exports.default = Aja;
//# sourceMappingURL=aja.js.map