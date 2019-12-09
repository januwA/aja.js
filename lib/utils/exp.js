"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//* 匹配 {{ name }} {{ obj.age }}
// export const interpolationExpressionExp = /{{([\w\s\.][\s\w\.]+)}}/g;
exports.interpolationExpressionExp = /{{(.*?)}}/g;
//* 匹配空格
exports.spaceExp = /\s/g;
//* !!hide
exports.firstWithExclamationMarkExp = /^!*/;
exports.attrStartExp = /^\[/;
exports.attrEndExp = /\]$/;
exports.eventStartExp = /^\(/;
exports.eventEndExp = /\)$/;
exports.tempvarExp = /^#/;
exports.firstAllValue = /^./;
exports.endAllValue = /.$/;
//# sourceMappingURL=exp.js.map