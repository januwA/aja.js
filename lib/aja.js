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
        this._define(root);
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
     * @param contextState
     */
    _define(root, contextState = null) {
        const state = contextState ? contextState : this.$store;
        const children = Array.from(root.childNodes);
        for (let index = 0; index < children.length; index++) {
            const childNode = children[index];
            // dom节点
            if (childNode.nodeType === Node.ELEMENT_NODE ||
                childNode.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
                const htmlElement = childNode;
                // :if权限最大
                const attrs = Array.from(htmlElement.attributes);
                let depath = this._ifBindHandle(htmlElement, attrs, state);
                if (!depath)
                    continue;
                // 遍历节点属性
                for (const attr of attrs) {
                    const { name, value } = attr;
                    // [title]='xxx'
                    if (util_1.attrp(name)) {
                        this._attrBindHandle(htmlElement, attr, state);
                        continue;
                    }
                    // #input #username
                    if (util_1.tempvarp(name)) {
                        this._tempvarBindHandle(htmlElement, attr);
                        continue;
                    }
                    // for
                    if (util_1.forp(name, this._forInstruction)) {
                        // 解析for指令的值
                        let [varb, data] = value.split(/\bin\b/).map(s => s.trim());
                        if (!varb)
                            return;
                        // 创建注释节点
                        const commentElement = document.createComment("");
                        htmlElement.replaceWith(commentElement);
                        htmlElement.removeAttribute(this._forInstruction);
                        const fragment = document.createDocumentFragment();
                        let _data;
                        if (util_1.isNumber(data)) {
                            _data = +data;
                            for (let _v = 0; _v < _data; _v++) {
                                const state2 = {};
                                const item = htmlElement.cloneNode(true);
                                fragment.append(item);
                                Object.defineProperty(state2, varb, {
                                    get() {
                                        return _v;
                                    }
                                });
                                this._define(item, state2);
                            }
                        }
                        else {
                            const _varb = varb
                                .trim()
                                .replace(exp_1.eventStartExp, util_1.emptyString)
                                .replace(exp_1.eventEndExp, util_1.emptyString)
                                .split(",")
                                .map(v => v.trim());
                            _data = this._getData(data, state);
                            const _that = this;
                            for (const _k in _data) {
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
                                this._define(item, forState);
                            }
                        }
                        commentElement.after(fragment);
                        commentElement.data = util_1.createForCommentData(_data);
                        continue;
                    }
                    // (click)="echo('hello',$event)"
                    if (util_1.eventp(name)) {
                        this._eventBindHandle(htmlElement, attr, state);
                        continue;
                    }
                }
                // 递归遍历
                // if (Array.from(childNode.childNodes).length) {
                this._define(htmlElement);
                // }
            }
            else if (childNode.nodeType === Node.TEXT_NODE) {
                // 插值表达式 {{ name }} {{ obj.age }}
                if (childNode.textContent) {
                    // 文本保函插值表达式的
                    if (!exp_1.interpolationExpressionExp.test(childNode.textContent))
                        continue;
                    const _initTextContent = childNode.textContent;
                    store_1.autorun(() => {
                        const text = _initTextContent.replace(exp_1.interpolationExpressionExp, (...args) => {
                            var key = args[1].replace(exp_1.spaceExp, util_1.emptyString);
                            return this._getData(key, state);
                        });
                        childNode.textContent = text;
                    });
                }
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
     * ? 有限找模板变量的数据，再找state
     * @param key
     * @param state
     */
    _getData(key, state) {
        if (typeof key !== "string")
            return null;
        const keys = key.split(".");
        let _result;
        // 模板变量
        if (keys[0] in this._templateVariables) {
            for (const k of keys) {
                _result = _result ? _result[k] : this._templateVariables[k];
            }
        }
        // state
        if (_result === undefined) {
            for (const k of keys) {
                _result = _result ? _result[k] : state[k];
            }
        }
        // this.$store
        if (_result === undefined && state !== this.$store) {
            for (const k of keys) {
                _result = _result ? _result[k] : this.$store[k];
            }
        }
        // 避免返回 undefined 的字符串
        if (_result === undefined)
            _result = util_1.emptyString;
        return _result;
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
            if (util_1.isNumber(el))
                return +arg;
            if (util_1.isTemplateEmptyString(el))
                return arg;
            if (util_1.isTemplateString(el)) {
                return el
                    .replace(exp_1.firstAllValue, util_1.emptyString)
                    .replace(exp_1.endAllValue, util_1.emptyString)
                    .toString();
            }
            const data = this._getData(el, state);
            return data ? data : eval(el);
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
                const match = value.match(exp_1.firstWithExclamationMarkExp)[0]; // :if="!show"
                if (match) {
                    // 砍掉! !true -> true
                    value = value.replace(exp_1.firstWithExclamationMarkExp, util_1.emptyString);
                }
                let show = true;
                if (util_1.isBoolString(value)) {
                    show = value === "true";
                }
                else {
                    show = this._getData(value, state);
                }
                if (match) {
                    show = eval(`${match}${show}`);
                }
                if (show) {
                    commentElement.after(htmlElement);
                    depath = true;
                    if (Array.from(htmlElement.childNodes).length) {
                        this._define(htmlElement);
                    }
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
                    // 过滤掉无效的style
                    if (Object.getOwnPropertyDescriptor(htmlElement.style, key) &&
                        styles[key]) {
                        htmlElement.style[key] = styles[key];
                    }
                }
            }
            else {
                htmlElement.setAttribute(attrName, this._getData(value, state)); // 属性扫描绑定
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
}
exports.default = Aja;
//# sourceMappingURL=aja.js.map