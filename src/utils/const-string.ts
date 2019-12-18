export const objectTag = "[object Object]";
export const arrayTag = "[object Array]";

export const strString = "string";

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
  for: structureDirectivePrefix + "for".toLowerCase()
};

/**
 * * 双向绑定指令
 */
export let modelDirective: string = "[(model)]".toLowerCase();

/**
 * * (modelChange)="f()"
 */
export const modelChangeEvent = "(modelChange)".toLowerCase();

export const formControlName = "[formControl]".toLowerCase();
