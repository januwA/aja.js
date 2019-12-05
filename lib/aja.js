"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("./utils/util");
const store_1 = require("./store");
const l = console.log;
const templateVariables = {};
class Aja {
    // 扫描
    static define(view, model) {
        const _result = store_1.createStore({
            state: model.data ? model.data() : {},
            actions: model.methods ? model.methods : {},
            computeds: model.computeds ? model.computeds : {}
        });
        const root = typeof view === "string"
            ? document.querySelector(view)
            : view;
        if (root === null)
            return;
        Array.from(root.children).forEach(el => {
            // 递归遍历
            if (Array.from(el.children).length) {
                return Aja.define(el, model);
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
                        // l(args)
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
                if (key === "*for") {
                    // 循环遍历
                    //   l(key, value);
                    let [varb, d] = value.split("in").map(s => s.trim());
                    if (typeof +d === "number") {
                        const fragment = document.createDocumentFragment();
                        const parent = el.parentNode;
                        for (let index = 0; index < +d; index++) {
                            if (parent)
                                parent.appendChild(el.cloneNode(true));
                        }
                    }
                    else {
                    }
                }
                // TODO 处理if指令
                if (key === "*if") {
                }
            }
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
        });
        return _result;
    }
}
exports.Aja = Aja;
//# sourceMappingURL=aja.js.map