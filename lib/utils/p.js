"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("./util");
const const_string_1 = require("./const-string");
/**
 * * 谓词
 */
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
function stringp(data) {
    return util_1.dataTag(data) === const_string_1.stringTag;
}
exports.stringp = stringp;
function numberStringp(str) {
    if (undefinedp(str))
        return false;
    if (!str.trim())
        return false;
    return !isNaN(+str);
}
exports.numberStringp = numberStringp;
function numberp(data) {
    return typeof data === 'number' &&
        util_1.dataTag(data) === const_string_1.numberTag &&
        Number.isFinite(data) &&
        data < Number.MAX_VALUE &&
        data > Number.MIN_VALUE;
}
exports.numberp = numberp;
/**
 * 'false' || 'true'
 * @param str
 */
function boolStringp(str) {
    return str === "true" || str === "false";
}
exports.boolStringp = boolStringp;
function objectp(data) {
    return util_1.dataTag(data) === const_string_1.objectTag;
}
exports.objectp = objectp;
function arrayp(data) {
    return Array.isArray ? Array.isArray(data) : util_1.dataTag(data) === const_string_1.arrayTag;
}
exports.arrayp = arrayp;
function nullp(data) {
    return util_1.dataTag(data) === const_string_1.nullTag;
}
exports.nullp = nullp;
function undefinedp(data) {
    return data === undefined || util_1.dataTag(data) === const_string_1.undefinedTag;
}
exports.undefinedp = undefinedp;
function elementNodep(node) {
    return node.nodeType === Node.ELEMENT_NODE;
}
exports.elementNodep = elementNodep;
// 模板节点 template
function fragmentNodep(node) {
    return node.nodeType === Node.DOCUMENT_FRAGMENT_NODE;
}
exports.fragmentNodep = fragmentNodep;
function textNodep(node) {
    return node.nodeType === Node.TEXT_NODE;
}
exports.textNodep = textNodep;
/**
 * * <template> 模板节点
 * @param node
 */
function templatep(node) {
    return node.nodeName === "TEMPLATE";
}
exports.templatep = templatep;
function inputp(node) {
    return node.nodeName === "INPUT";
}
exports.inputp = inputp;
function textareap(node) {
    return node.nodeName === "TEXTAREA";
}
exports.textareap = textareap;
function selectp(node) {
    return node.nodeName === "SELECT";
}
exports.selectp = selectp;
function checkboxp(node) {
    return inputp(node) && node.type === "checkbox";
}
exports.checkboxp = checkboxp;
function radiop(node) {
    return inputp(node) && node.type === "radio";
}
exports.radiop = radiop;
//# sourceMappingURL=p.js.map