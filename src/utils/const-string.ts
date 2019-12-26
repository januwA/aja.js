export const objectTag = "[object Object]";
export const arrayTag = "[object Array]";
export const stringTag = "[object String]";
export const numberTag = "[object Number]";
export const undefinedTag = "[object Undefined]";
export const nullTag = "[object Null]";

export const stringString = "string";

export class EventType {
  static readonly input = "input";
  static readonly click = "click";
  static readonly change = "change";
  static readonly blur = "blur";
}

/**
 * * 传递事件$event变量
 * click($event)
 */
export const templateEvent: string = "$event".toLowerCase();

/**
 * * 结构指令前缀
 * :if :for
 */
export let structureDirectivePrefix = ":";
export const structureDirectives = {
  if: structureDirectivePrefix + "if".toLowerCase(),
  for: structureDirectivePrefix + "for".toLowerCase(),
  else: structureDirectivePrefix + "else".toLowerCase()
};

/**
 * * 双向绑定指令
 */
export let modelDirective: string = "[(model)]".toLowerCase();

/**
 * * (modelChange)="f()"
 */
export const modelChangeEvent = "(modelChange)".toLowerCase();

export const formControlAttrName = "[formControl]".toLowerCase();

export const ajaModelString = 'ajaModel';
export const formGroupAttrName = '[formGroup]'.toLowerCase();
export const formControlNameAttrName = '[formControlName]'.toLowerCase();
export const formGroupNameAttrName = '[formGroupName]'.toLowerCase();
export const formArrayNameAttrName = '[formArrayName]'.toLowerCase();
