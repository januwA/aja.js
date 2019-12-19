"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//* 匹配 {{ name }} {{ obj.age }}
// export const interpolationExpressionExp = /{{([\w\s\.][\s\w\.]+)}}/g;
exports.interpolationExpressionExp = /{{(.*?)}}/g;
//* 匹配空格
exports.spaceExp = /\s/g;
exports.attrStartExp = /^\[/;
exports.attrEndExp = /\]$/;
exports.eventStartExp = /^\(/;
exports.eventEndExp = /\)$/;
exports.tempvarExp = /^#/;
exports.parsePipesExp = /(?<![\|])\|(?![\|])/;
exports.evalExp = /[!\&\|\+\-\*\%=\/<\>\^\(\)\~\:\?\;]/g;
//# sourceMappingURL=exp.js.map