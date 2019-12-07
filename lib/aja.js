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
function ifp(key) {
    return key === exports.instructionPrefix + "if";
}
function forp(key) {
    return key === exports.instructionPrefix + "for";
}
// 扫描
function define(view, model) {
    const state = store_1.createState(model.state);
    const actions = store_1.createActions(model.actions);
    const computeds = store_1.createComputeds(model.computeds);
    const _result = store_1.createStore({
        state,
        actions,
        computeds
    });
    const root = util_1.createRoot(view);
    if (root === null)
        return null;
    const children = Array.from(root.childNodes);
    for (let index = 0; index < children.length; index++) {
        const childNode = children[index];
        // dom节点
        if (childNode.nodeType === Node.ELEMENT_NODE ||
            childNode.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
            const htmlElement = childNode;
            //* 遍历节点熟悉
            // :if权限最大
            const attrs = Array.from(childNode.attributes) || [];
            let depath = true;
            for (const { name, value } of attrs) {
                if (ifp(name)) {
                    store_1.autorun(() => {
                        if (!_result[value]) {
                            htmlElement.style.display = "none";
                            depath = false;
                        }
                        else {
                            htmlElement.style.display = "block";
                            depath = true;
                            if (depath && Array.from(childNode.childNodes).length) {
                                define(htmlElement, model);
                            }
                        }
                    });
                }
                if (util_1.attrp(name)) {
                    let attrName = name.replace(/^\[/, "").replace(/\]$/, "");
                    store_1.autorun(() => {
                        if (attrName === "style") {
                            const styles = _result[value];
                            for (const key in styles) {
                                if (Object.getOwnPropertyDescriptor(htmlElement.style, key)) {
                                    const _value = styles[key];
                                    if (_value) {
                                        htmlElement.style[key] = _value;
                                    }
                                }
                            }
                        }
                        else {
                            htmlElement.setAttribute(attrName, _result[value]); // 属性扫描绑定
                        }
                    });
                }
                if (util_1.eventp(name)) {
                    // 绑定的事件: (click)="echo('hello',$event)"
                    let len = name.length;
                    let eventName = name.substr(1, len - 2); // (click) -> click
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
                    childNode.addEventListener(eventName, function (e) {
                        args = args.map(el => (el === "$event" ? e : el));
                        if (funcName in _result) {
                            return _result[funcName](...args);
                        }
                    });
                }
                if (util_1.tempvarp(name)) {
                    // 模板变量 #input
                    templateVariables[name.replace(/^#/, "")] = childNode;
                }
                else {
                    // l("绑定的静态数据", attrName)
                }
                // TODO 处理for指令
                // ! 插值表达式被提前处理为 undefined
                const forInstruction = exports.instructionPrefix + "for";
                if (name === forInstruction) {
                    // 解析for指令的值
                    let [varb, d] = value.split("in").map(s => s.trim());
                    if (!varb)
                        return null;
                    if (!isNaN(+d)) {
                        const fragment = document.createDocumentFragment();
                        childNode.removeAttribute(forInstruction);
                        for (let index = 0; index < +d; index++) {
                            const item = childNode.cloneNode(true);
                            define(item, {
                                state: Object.assign(Object.assign({}, model.state), { [varb]: index }),
                                actions: model.actions,
                                computeds: model.computeds
                            });
                            fragment.append(item);
                        }
                        childNode.replaceWith(fragment);
                    }
                    else {
                    }
                }
            }
            // 递归遍历
            if (depath && Array.from(childNode.childNodes).length) {
                define(htmlElement, model);
            }
        }
        else if (childNode.nodeType === Node.TEXT_NODE) {
            // 插值表达式 {{ name }} {{ obj.age }}
            if (childNode.textContent) {
                const exp = /{{([\w\s\.][\s\w\.]+)}}/g;
                if (exp.test(childNode.textContent)) {
                    const _initTextContent = childNode.textContent;
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
                        childNode.textContent = text;
                    });
                }
            }
        }
    }
    return _result;
}
exports.define = define;
//# sourceMappingURL=aja.js.map