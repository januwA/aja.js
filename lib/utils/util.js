"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * [title]="title"
 * @param value
 */
function attrp(value) {
    return /^\[\w.+\]$/.test(value);
}
exports.attrp = attrp;
/**
 * (click)="hello('hello')"
 */
function eventp(value) {
    return /^\(\w.+\)$/.test(value);
}
exports.eventp = eventp;
/**
 * #input 模板变量
 * @param value
 */
function tempvarp(value) {
    return value.charAt(0) === "#";
}
exports.tempvarp = tempvarp;
/**
 * * 双向绑定
 * @param str
 */
function modelp(str) {
    return str === "[(model)]";
}
exports.modelp = modelp;
function createRoot(view) {
    return typeof view === "string"
        ? document.querySelector(view)
        : view;
}
exports.createRoot = createRoot;
function createIfCommentData(value) {
    return `{":if": "${!!value}"}`;
}
exports.createIfCommentData = createIfCommentData;
function createForCommentData(obj) {
    return `{":for": "${obj}"}`;
}
exports.createForCommentData = createForCommentData;
function ifp(key, ifInstruction) {
    return key === ifInstruction;
}
exports.ifp = ifp;
function forp(key, forInstruction) {
    return key === forInstruction;
}
exports.forp = forp;
function createObject(obj) {
    return obj ? obj : {};
}
exports.createObject = createObject;
exports.emptyString = "";
function isNumber(str) {
    if (typeof str === "number")
        return true;
    if (str && !str.trim())
        return false;
    return !isNaN(+str);
}
exports.isNumber = isNumber;
/**
 * 'name'  "name"
 *
 */
function isTemplateString(str) {
    return /^['"`]/.test(str.trim());
}
exports.isTemplateString = isTemplateString;
/**
 * '       '
 * @param str
 */
function isTemplateEmptyString(str) {
    return !str.trim();
}
exports.isTemplateEmptyString = isTemplateEmptyString;
/**
 * setAge( obj.age   , '        ') -> ["obj.age   ", " '        '"]
 * @param str
 */
function parseTemplateEventArgs(str) {
    let index = str.indexOf("(");
    return str
        .substr(index, str.length - 2)
        .replace(/(^\(*)|(\)$)/g, exports.emptyString)
        .trim()
        .split(",");
}
exports.parseTemplateEventArgs = parseTemplateEventArgs;
/**
 * 'false' || 'true'
 * @param str
 */
function isBoolString(str) {
    return str === "true" || str === "false";
}
exports.isBoolString = isBoolString;
/**
 * * 避免使用全局的eval
 * @param this
 * @param bodyString
 */
function ourEval(bodyString) {
    const f = new Function(bodyString);
    try {
        return f.apply(this, arguments);
    }
    catch (er) {
        throw er;
    }
}
exports.ourEval = ourEval;
/**
 * Object.prototype.toString.call({}) -> "[object Object]"
 * @param data
 */
function dataTag(data) {
    return Object.prototype.toString.call(data);
}
exports.dataTag = dataTag;
function objectp(data) {
    return Object.prototype.toString.call(data) === "[object Object]";
}
exports.objectp = objectp;
function arrayp(data) {
    return Object.prototype.toString.call(data) === "[object Array]";
}
exports.arrayp = arrayp;
function nullp(data) {
    return Object.prototype.toString.call(data) === "[object Null]";
}
exports.nullp = nullp;
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
function elementNodep(node) {
    return (node.nodeType === Node.ELEMENT_NODE ||
        node.nodeType === Node.DOCUMENT_FRAGMENT_NODE);
}
exports.elementNodep = elementNodep;
function textNodep(node) {
    return node.nodeType === Node.TEXT_NODE;
}
exports.textNodep = textNodep;
//# sourceMappingURL=util.js.map