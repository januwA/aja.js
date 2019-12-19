"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("./util");
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
function numberp(str) {
    if (typeof str === "number")
        return true;
    if (str && !str.trim())
        return false;
    return !isNaN(+str);
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
    return util_1.dataTag(data) === "[object Object]";
}
exports.objectp = objectp;
function arrayp(data) {
    return util_1.dataTag(data) === "[object Array]";
}
exports.arrayp = arrayp;
function nullp(data) {
    return util_1.dataTag(data) === "[object Null]";
}
exports.nullp = nullp;
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
    return node.type === "checkbox";
}
exports.checkboxp = checkboxp;
function radiop(node) {
    return node.type === "radio";
}
exports.radiop = radiop;
//# sourceMappingURL=p.js.map