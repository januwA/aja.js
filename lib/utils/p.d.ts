/**
 * * 谓词
 */
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
export declare function stringp(data: string): boolean;
export declare function numberStringp(str: any): boolean;
export declare function numberp(data: any): boolean;
/**
 * 'false' || 'true'
 * @param str
 */
export declare function boolStringp(str: string): boolean;
export declare function objectp(data: any): boolean;
export declare function arrayp(data: any): data is any[];
export declare function nullp(data: any): data is null;
export declare function undefinedp(data: any): data is undefined;
export declare function elementNodep(node: ChildNode | HTMLElement): boolean;
export declare function fragmentNodep(node: ChildNode | HTMLElement): boolean;
export declare function textNodep(node: ChildNode | HTMLElement): boolean;
/**
 * * <template> 模板节点
 * @param node
 */
export declare function templatep(node: HTMLElement): node is HTMLTemplateElement;
export declare function inputp(node: Node): node is HTMLInputElement;
export declare function textareap(node: Node): node is HTMLTextAreaElement;
export declare function selectp(node: Node): node is HTMLSelectElement;
export declare function checkboxp(node: Node): node is HTMLInputElement;
export declare function radiop(node: Node): node is HTMLInputElement;
export declare function formp(node: Node): node is HTMLFormElement;
