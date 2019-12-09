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
    return value[0] === "#";
}
exports.tempvarp = tempvarp;
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
//# sourceMappingURL=util.js.map