
/**
 * 获取DOM元素
 * @param s 
 */
export function qs(s: string): Element | null {
  return document.querySelector(s);
}

/**
 * [title]="title"
 * @param value 
 */
export function attrp(value: string) {
  return /^\[\w.+\]$/.test(value);
}

/**
 * (click)="hello('hello')"
 */
export function eventp(value: string) {
  return /^\(\w.+\)$/.test(value);
}

/**
 * #input 模板变量
 * @param value 
 */
export function tempvarp(value: string) {
  return value[0] === "#";
}