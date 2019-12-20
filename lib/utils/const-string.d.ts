export declare const objectTag = "[object Object]";
export declare const arrayTag = "[object Array]";
export declare const stringTag = "[object String]";
export declare const numberTag = "[object Number]";
export declare const undefinedTag = "[object Undefined]";
export declare const nullTag = "[object Null]";
export declare const stringString = "string";
export declare class EventType {
    static readonly input = "input";
    static readonly click = "click";
    static readonly change = "change";
    static readonly blur = "blur";
}
/**
 * * 传递事件$event变量
 * click($event)
 */
export declare const templateEvent: string;
/**
 * * 结构指令前缀
 * :if :for
 */
export declare let structureDirectivePrefix: string;
export declare const structureDirectives: {
    if: string;
    for: string;
};
/**
 * * 双向绑定指令
 */
export declare let modelDirective: string;
/**
 * * (modelChange)="f()"
 */
export declare const modelChangeEvent: string;
export declare const formControlAttrName: string;
export declare const ajaModelString = "ajaModel";
export declare const formGroupAttrName: string;
export declare const formControlNameAttrName: string;
