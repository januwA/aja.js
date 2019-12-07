"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("./utils/util");
const store_1 = require("./store");
const l = console.log;
const templateVariables = {};
/**
 * *  指令前缀
 * [:for] [:if]
 */
exports.instructionPrefix = ":";
// 扫描
function define(view, model) {
    const state = model.data ? model.data : {};
    const actions = model.methods ? model.methods : {};
    const computeds = model.computeds ? model.computeds : {};
    const _result = store_1.createStore({
        state,
        actions,
        computeds
    });
    const root = typeof view === "string" ? document.querySelector(view) : view;
    if (root === null)
        return null;
    const children = Array.from(root.childNodes);
    for (let index = 0; index < children.length; index++) {
        const el = children[index];
        // dom节点
        if (el.nodeType === Node.ELEMENT_NODE ||
            el.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
            // 递归遍历
            if (Array.from(el.childNodes).length) {
                define(el, model);
            }
            const attrs = Array.from(el.attributes) || [];
            for (let attr of attrs) {
                let key = attr.name;
                let value = attr.value;
                if (util_1.attrp(key)) {
                    // [title]="title"
                    let len = key.length;
                    let name = key.substr(1, len - 2); // [title] -> title
                    store_1.autorun(() => {
                        if (name === "style") {
                            const styles = _result[value];
                            for (const key in styles) {
                                const _isNaN = isNaN(parseInt(key));
                                if (_isNaN &&
                                    Object.getOwnPropertyDescriptor(el.style, key)) {
                                    const _value = styles[key];
                                    if (_value) {
                                        el.style[key] = _value;
                                    }
                                }
                            }
                        }
                        else {
                            el.setAttribute(name, _result[value]); // 属性扫描绑定
                        }
                    });
                }
                if (util_1.eventp(key)) {
                    // 绑定的事件: (click)="echo('hello',$event)"
                    let len = key.length;
                    let name = key.substr(1, len - 2); // (click) -> click
                    // 函数名
                    let funcName;
                    // 函数参数
                    let args;
                    if (value.includes("(")) {
                        // 带参数的函数
                        let index = value.indexOf("(");
                        funcName = value.substr(0, index);
                        args = value
                            .substr(index, value.length - 2)
                            .replace(/(^\(*)|(\))/g, "")
                            .split(",")
                            .map(a => a.trim());
                    }
                    else {
                        funcName = value;
                    }
                    el.addEventListener(name, function (e) {
                        args = args.map(el => (el === "$event" ? e : el));
                        if (funcName in _result) {
                            return _result[funcName](...args);
                        }
                    });
                }
                if (util_1.tempvarp(key)) {
                    // 模板变量 #input
                    templateVariables[key.replace(/^#/, "")] = el;
                }
                else {
                    // l("绑定的静态数据", attrName)
                }
                // TODO 处理for指令
                // ! 插值表达式被提前处理为 undefined
                const forInstruction = exports.instructionPrefix + "for";
                if (key === forInstruction) {
                    // 解析for指令的值
                    let [varb, d] = value.split("in").map(s => s.trim());
                    if (!varb)
                        return null;
                    if (!isNaN(+d)) {
                        const fragment = document.createDocumentFragment();
                        el.removeAttribute(forInstruction);
                        for (let index = 0; index < +d; index++) {
                            const item = el.cloneNode(true);
                            define(item, {
                                data: Object.assign(Object.assign({}, model.data), { [varb]: index }),
                                methods: model.methods,
                                computeds: model.computeds
                            });
                            fragment.append(item);
                        }
                        el.replaceWith(fragment);
                    }
                    else {
                    }
                }
                // TODO 处理if指令
                if (key === ":if") {
                }
            }
        }
        else if (el.nodeType === Node.TEXT_NODE) {
            // 插值表达式 {{ name }} {{ obj.age }}
            if (el.textContent) {
                const exp = /{{([\w\s\.][\s\w\.]+)}}/g;
                if (exp.test(el.textContent)) {
                    const _initTextContent = el.textContent;
                    store_1.autorun(() => {
                        const text = _initTextContent.replace(exp, function (match) {
                            var key = Array.prototype.slice
                                .call(arguments, 1)[0]
                                .replace(/\s/g, "");
                            let keys = key.split(".");
                            let data;
                            // 在data中找数据
                            for (const el of keys) {
                                data = data ? data[el] : _result[el];
                            }
                            // 没有在data中找到数据, 寻找模板变量里面
                            if (data === undefined) {
                                // TODO 模板变量双向绑定
                                const isTemplateVariables = keys[0] in templateVariables;
                                if (isTemplateVariables) {
                                    for (const el of keys) {
                                        data = data ? data[el] : templateVariables[el];
                                    }
                                }
                            }
                            return data;
                        });
                        el.textContent = text;
                    });
                }
            }
        }
    }
    return _result;
}
exports.define = define;
//# sourceMappingURL=aja.js.map