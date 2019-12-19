"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const exp_1 = require("./exp");
const const_string_1 = require("./const-string");
const core_1 = require("../core");
function createRoot(view) {
    return typeof view === "string"
        ? document.querySelector(view)
        : view;
}
exports.createRoot = createRoot;
function createObject(obj) {
    return obj ? obj : {};
}
exports.createObject = createObject;
function toArray(iterable) {
    if (!iterable)
        return [];
    if (Array.from) {
        return Array.from(iterable);
    }
    else {
        return Array.prototype.slice.call(iterable);
    }
}
exports.toArray = toArray;
exports.emptyString = "";
/**
 * setAge( obj.age   , '        ') -> ["obj.age   ", " '        '"]
 * @param str
 */
function parseTemplateEventArgs(str) {
    const index = str.indexOf("(");
    // 砍掉函数名
    // 去掉首尾圆括号
    // 用逗号分割参数
    return str
        .substr(index)
        .trim()
        .replace(/(^\(*)|(\)$)/g, exports.emptyString)
        .split(",");
}
exports.parseTemplateEventArgs = parseTemplateEventArgs;
/**
 * Object.prototype.toString.call({}) -> "[object Object]"
 * @param data
 */
function dataTag(data) {
    return Object.prototype.toString.call(data);
}
exports.dataTag = dataTag;
/**
 * 把字符串安全格式化 为正则表达式源码
 * {{ arr[0] }} -> \{\{ arr\[0\] \}\}
 * @param str
 */
function escapeRegExp(str) {
    return str.replace(/([-.*+?^${}()|[\]\/\\])/g, "\\$1");
}
exports.escapeRegExp = escapeRegExp;
function escapeHTML(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\s/g, "&nbsp;");
}
exports.escapeHTML = escapeHTML;
/**
 * * 将['on']转为[null]
 * @param inputNode
 */
function getCheckboxRadioValue(inputNode) {
    let value = inputNode.value;
    if (value === "on")
        value = null;
    return value;
}
exports.getCheckboxRadioValue = getCheckboxRadioValue;
/**
 * 查找一个节点是否包含:if指令
 * 并返回
 */
function findIfAttr(node, ifInstruction) {
    if (node.attributes && node.attributes.length) {
        const attrs = Array.from(node.attributes);
        return attrs.find(({ name }) => name === ifInstruction);
    }
}
exports.findIfAttr = findIfAttr;
/**
 * 查找一个节点是否包含:if指令
 * 并返回
 */
function findForAttr(node, forInstruction) {
    if (node.attributes && node.attributes.length) {
        const attrs = Array.from(node.attributes);
        return attrs.find(({ name }) => name === forInstruction);
    }
}
exports.findForAttr = findForAttr;
/**
 * 查找一个节点是否包含[(model)]指令
 * 并返回
 */
function findModelAttr(node, modelAttr) {
    if (node.attributes && node.attributes.length) {
        const attrs = toArray(node.attributes);
        return attrs.find(({ name }) => name === modelAttr);
    }
}
exports.findModelAttr = findModelAttr;
/**
 * * 检测节点上是否有绑定结构指令
 * @param node
 * @param modelAttr
 */
function hasStructureDirective(node) {
    if (node.attributes && node.attributes.length) {
        const attrs = toArray(node.attributes);
        return attrs.some(({ name }) => name.charAt(0) === const_string_1.structureDirectivePrefix);
    }
    return false;
}
exports.hasStructureDirective = hasStructureDirective;
/**
 * * 从表达式中获取管道
 * 抽空格，在分离 |
 * @returns [ bindKey, Pipes[] ]
 */
function parsePipe(key) {
    const [bindKey, ...pipes] = key
        .replace(exp_1.spaceExp, exports.emptyString)
        .split(exp_1.parsePipesExp);
    return [bindKey, pipes];
}
exports.parsePipe = parsePipe;
const emptyp = function (value) {
    return JSON.stringify(value).length === 2 ? true : false;
};
function _equal(obj, other, equalp = false) {
    function Equal(obj, other, equalp) {
        let objTag = dataTag(obj);
        let otherTag = dataTag(other);
        if (objTag !== const_string_1.objectTag &&
            objTag !== const_string_1.arrayTag &&
            otherTag !== const_string_1.objectTag &&
            otherTag !== const_string_1.arrayTag) {
            if (equalp && typeof obj === const_string_1.strString && typeof other === const_string_1.strString) {
                return obj.toLocaleUpperCase() === other.toLocaleUpperCase();
            }
            return obj === other;
        }
        if (objTag !== otherTag)
            return false; // 集合类型不一样
        // if (
        //   Object.getOwnPropertyNames(obj).length !==
        //   Object.getOwnPropertyNames(other).length
        // )
        if (Object.keys(obj).length !== Object.keys(other).length)
            return false; // 集合元素数量不一样
        if (emptyp(obj) && emptyp(other))
            return true; // 类型一样的空集合，永远相等。
        let data = (function () {
            let data = Object.getOwnPropertyNames(obj);
            if (objTag === const_string_1.arrayTag) {
                data.pop();
                return data;
            }
            else {
                return data;
            }
        })();
        for (const i in data) {
            const k = data[i];
            if (k in other) {
                // 元素是否相交
                let obj_value = obj[k];
                let other_value = other[k];
                let obj_item_tag = dataTag(obj_value);
                let other_item_tag = dataTag(other_value);
                if (obj_item_tag === other_item_tag) {
                    if (obj_item_tag === const_string_1.objectTag ||
                        obj_item_tag === const_string_1.arrayTag ||
                        other_item_tag === const_string_1.objectTag ||
                        other_item_tag === const_string_1.arrayTag) {
                        return Equal(obj_value, other_value, equalp);
                    }
                    else {
                        if (obj_value === other_value) {
                        }
                        else {
                            return false;
                        }
                    }
                }
                else {
                    return false;
                }
            }
            else {
                return false;
            }
        }
        return true;
    }
    return Equal(obj, other, equalp);
}
/**
 * * 不忽略大小写
 * @param obj
 * @param other
 */
function equal(obj, other) {
    return _equal(obj, other, false);
}
exports.equal = equal;
/**
 * * 忽略大小写
 * @param obj
 * @param other
 */
function equalp(obj, other) {
    return _equal(obj, other, true);
}
exports.equalp = equalp;
/**
 * ['obj.age', 12, false, '"   "', alert('xxx')] -> [22, 12, false, "   ", eval(<other>)]
 * @param args
 * @param contextData
 */
function parseArgsToArguments(args, contextData) {
    return args.map(arg => {
        if (!arg)
            return arg;
        let el = arg.trim();
        if (el === const_string_1.templateEvent)
            return el;
        return core_1.getData(el, contextData);
    });
}
exports.parseArgsToArguments = parseArgsToArguments;
function parseArgsEvent(args, e) {
    return args.map(arg => {
        if (arg === const_string_1.templateEvent)
            return e;
        return arg;
    });
}
exports.parseArgsEvent = parseArgsEvent;
//# sourceMappingURL=util.js.map