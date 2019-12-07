"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 获取DOM元素
 * @param s
 */
function qs(s) {
    return document.querySelector(s);
}
exports.qs = qs;
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
function createCommentData(value) {
    return `{":if": "${!!value}"}`;
}
exports.createCommentData = createCommentData;
//# sourceMappingURL=util.js.map