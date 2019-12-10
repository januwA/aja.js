/**
 * [title]="title"
 * @param value
 */
export declare function attrp(value: string): boolean;
/**
 * (click)="hello('hello')"
 */
export declare function eventp(value: string): boolean;
/**
 * #input 模板变量
 * @param value
 */
export declare function tempvarp(value: string): boolean;
export declare function createRoot(view: string | HTMLElement): HTMLElement | null;
export declare function createIfCommentData(value: any): string;
export declare function createForCommentData(obj: any): string;
export declare function ifp(key: string, ifInstruction: string): boolean;
export declare function forp(key: string, forInstruction: string): boolean;
export declare function createObject<T>(obj?: T): T;
export declare const emptyString: string;
export declare function isNumber(str: string): boolean;
/**
 * 'name'  "name"
 *
 */
export declare function isTemplateString(str: string): boolean;
/**
 * '       '
 * @param str
 */
export declare function isTemplateEmptyString(str: string): boolean;
/**
 * setAge( obj.age   , '        ') -> ["obj.age   ", " '        '"]
 * @param str
 */
export declare function parseTemplateEventArgs(str: string): string[];
/**
 * 'false' || 'true'
 * @param str
 */
export declare function isBoolString(str: string): boolean;
/**
 * * 避免使用全局的eval
 * @param this
 * @param bodyString
 */
export declare function ourEval(this: any, bodyString: string): any;
