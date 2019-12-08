"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("./utils/util");
const store_1 = require("./store");
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
    _define(root, state) {
        const children = Array.from(root.childNodes);
        for (let index = 0; index < children.length; index++) {
            const childNode = children[index];
            // dom节点
            if (childNode.nodeType === Node.ELEMENT_NODE ||
                childNode.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
                const htmlElement = childNode;
                // 遍历节点属性
                // :if权限最大
                const attrs = Array.from(htmlElement.attributes);
                let depath = true;
                let ifAttr = attrs.find(({ name }) => name === this._ifInstruction);
                if (ifAttr) {
                    const commentElement = document.createComment("");
                    htmlElement.parentElement.insertBefore(commentElement, htmlElement);
                    store_1.autorun(() => {
                        const show = this._getData(ifAttr.value, state);
                        if (show) {
                            commentElement.after(htmlElement);
                            depath = true;
                            if (Array.from(childNode.childNodes).length) {
                                this._define(htmlElement, state);
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
                if (depath) {
                    for (const { name, value } of attrs) {
                        // [title]='xxx'
                        if (util_1.attrp(name)) {
                            let attrName = name
                                .replace(/^\[/, util_1.emptyString)
                                .replace(/\]$/, util_1.emptyString);
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
                        // (click)="echo('hello',$event)"
                        if (util_1.eventp(name)) {
                            const eventName = name
                                .replace(/^\(/, util_1.emptyString)
                                .replace(/\)$/, util_1.emptyString);
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
                            childNode.addEventListener(eventName, e => {
                                //? 每次点击都需解析参数?
                                //! 如果只解析一次，那么模板变量需要提前声明, 并且模板变量不会更新!
                                if (this.$store.$actions && funcName in this.$store.$actions) {
                                    this.$store.$actions[funcName].apply(this.$store, this._parseArgsToArguments(args, e, state));
                                }
                            });
                            htmlElement.removeAttribute(name);
                        }
                        if (util_1.tempvarp(name)) {
                            // 模板变量 #input
                            this._templateVariables[name.replace(/^#/, "")] = htmlElement;
                            htmlElement.removeAttribute(name);
                        }
                        // TODO 处理for指令
                        if (name === this._forInstruction) {
                            // 解析for指令的值
                            let [varb, d] = value.split("in").map(s => s.trim());
                            if (!varb)
                                return;
                            if (!isNaN(+d)) {
                                const fragment = document.createDocumentFragment();
                                htmlElement.removeAttribute(this._forInstruction);
                                for (let index = 0; index < +d; index++) {
                                    const item = childNode.cloneNode(true);
                                    this._define(item, Object.assign(Object.assign({}, state), { [varb]: index }));
                                    fragment.append(item);
                                }
                                childNode.replaceWith(fragment);
                            }
                            else {
                                // TODO: 循环Object or Array
                            }
                        }
                    }
                    // 递归遍历
                    if (Array.from(childNode.childNodes).length) {
                        this._define(htmlElement, state);
                    }
                }
            }
            else if (childNode.nodeType === Node.TEXT_NODE) {
                // 插值表达式 {{ name }} {{ obj.age }}
                if (childNode.textContent) {
                    const exp = /{{([\w\s\.][\s\w\.]+)}}/g;
                    if (exp.test(childNode.textContent)) {
                        const _initTextContent = childNode.textContent;
                        store_1.autorun(() => {
                            const text = _initTextContent.replace(exp, (...args) => {
                                var key = args[1].replace(/\s/g, "");
                                return this._getData(key, state);
                            });
                            childNode.textContent = text;
                        });
                    }
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
     * * 在state中寻找数据
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
                    .replace(/^./, util_1.emptyString)
                    .replace(/.$/, util_1.emptyString)
                    .toString();
            }
            const data = this._getData(el, state);
            return data ? data : eval(el);
        });
    }
}
exports.default = Aja;
//# sourceMappingURL=aja.js.map