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
export declare function numberp(str: string | number): boolean;
/**
 * 'false' || 'true'
 * @param str
 */
export declare function boolStringp(str: string): boolean;
export declare function objectp(data: any): boolean;
export declare function arrayp(data: any): boolean;
export declare function nullp(data: any): boolean;
export declare function elementNodep(node: ChildNode | HTMLElement): boolean;
export declare function fragmentNodep(node: ChildNode | HTMLElement): boolean;
export declare function textNodep(node: ChildNode | HTMLElement): boolean;
/**
 * * <template> 模板节点
 * @param node
 */
export declare function templatep(node: HTMLElement): boolean;
export declare function inputp(node: Node): boolean;
export declare function textareap(node: Node): boolean;
export declare function selectp(node: Node): boolean;
export declare function checkboxp(node: HTMLInputElement): boolean;
export declare function radiop(node: HTMLInputElement): boolean;
