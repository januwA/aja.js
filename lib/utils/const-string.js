"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.objectTag = "[object Object]";
exports.arrayTag = "[object Array]";
exports.stringTag = "[object String]";
exports.numberTag = "[object Number]";
exports.undefinedTag = "[object Undefined]";
exports.nullTag = "[object Null]";
exports.stringString = "string";
class EventType {
}
exports.EventType = EventType;
EventType.input = "input";
EventType.click = "click";
EventType.change = "change";
EventType.blur = "blur";
/**
 * * 传递事件$event变量
 * click($event)
 */
exports.templateEvent = "$event".toLowerCase();
/**
 * * 结构指令前缀
 * :if :for
 */
exports.structureDirectivePrefix = ":";
exports.structureDirectives = {
    if: exports.structureDirectivePrefix + "if".toLowerCase(),
    for: exports.structureDirectivePrefix + "for".toLowerCase()
};
/**
 * * 双向绑定指令
 */
exports.modelDirective = "[(model)]".toLowerCase();
/**
 * * (modelChange)="f()"
 */
exports.modelChangeEvent = "(modelChange)".toLowerCase();
exports.formControlAttrName = "[formControl]".toLowerCase();
exports.ajaModelString = 'ajaModel';
exports.formGroupAttrName = '[formGroup]'.toLowerCase();
exports.formControlNameAttrName = '[formControlName]'.toLowerCase();
//# sourceMappingURL=const-string.js.map