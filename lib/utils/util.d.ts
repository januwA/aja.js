/**
 * 获取DOM元素
 * @param s
 */
export declare function qs(s: string): Element | null;
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
export declare function createCommentData(value: any): string;
