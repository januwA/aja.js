export declare const objectTag = "[object Object]";
export declare const arrayTag = "[object Array]";
export declare const strString = "string";
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
