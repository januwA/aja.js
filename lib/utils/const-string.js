"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.objectTag = "[object Object]";
exports.arrayTag = "[object Array]";
exports.strString = "string";
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
//# sourceMappingURL=const-string.js.map