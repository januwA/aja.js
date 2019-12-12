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
/**
 * * 双向绑定
 * @param str
 */
export declare function modelp(str: string, _modeldirective?: string): boolean;
export declare function createRoot(view: string | HTMLElement): HTMLElement | null;
export declare function ifp(key: string, ifInstruction: string): boolean;
export declare function forp(key: string, forInstruction: string): boolean;
export declare function createObject<T>(obj?: T): T;
export declare const emptyString: string;
export declare function isNumber(str: string | number): boolean;
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
export declare function boolStringp(str: string): boolean;
/**
 * * 避免使用全局的eval
 * @param this
 * @param bodyString
 */
export declare function ourEval(this: any, bodyString: string): any;
/**
 * Object.prototype.toString.call({}) -> "[object Object]"
 * @param data
 */
export declare function dataTag(data: any): string;
export declare function objectp(data: any): boolean;
export declare function arrayp(data: any): boolean;
export declare function nullp(data: any): boolean;
/**
 * 把字符串安全格式化 为正则表达式源码
 * {{ arr[0] }} -> \{\{ arr\[0\] \}\}
 * @param str
 */
export declare function escapeRegExp(str: string): string;
export declare function escapeHTML(str: string): string;
export declare function elementNodep(node: ChildNode | HTMLElement): boolean;
export declare function textNodep(node: ChildNode | HTMLElement): boolean;
/**
 * * 将['on']转为[null]
 * @param checkbox
 */
export declare function getCheckBoxValue(checkbox: HTMLInputElement): string | null;
/**
 * * 解析文本的表达式
 *
 * @param textContent  "{{ age }} - {{ a }} = {{ a }}""
 * @param matchs  ["{{ age }}", "{{ a }}", "{{ a }}"]
 * @param states [12, "x", "x"]
 * @returns "12 - x = x"
 */
export declare function parseBindingTextContent(textContent: string, matchs: string[], states: any[]): string;
