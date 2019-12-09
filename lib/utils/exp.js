"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//* 匹配 {{ name }} {{ obj.age }}
exports.interpolationExpressionExp = /{{([\w\s\.][\s\w\.]+)}}/g;
//* 匹配空格
exports.spaceExp = /\s/g;
//* !!hide
exports.firstWithExclamationMarkExp = /^!*/;
exports.attrStartExp = /^\[/;
exports.attrEndExp = /^\[/;
exports.eventStartExp = /^\(/;
exports.eventEndExp = /\)$/;
exports.tempvarExp = /^#/;
exports.firstAllValue = /^./;
exports.endAllValue = /.$/;
//# sourceMappingURL=exp.js.map