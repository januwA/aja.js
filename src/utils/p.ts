import { dataTag } from "./util";

/**
 * * 谓词
 */

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
  return value.charAt(0) === "#";
}

export function numberp(str: string | number): boolean {
  if (typeof str === "number") return true;
  if (str && !str.trim()) return false;
  return !isNaN(+str);
}

/**
 * 'false' || 'true'
 * @param str
 */
export function boolStringp(str: string): boolean {
  return str === "true" || str === "false";
}

export function objectp(data: any) {
  return dataTag(data) === "[object Object]";
}

export function arrayp(data: any) {
  return dataTag(data) === "[object Array]";
}

export function nullp(data: any) {
  return dataTag(data) === "[object Null]";
}

export function elementNodep(node: ChildNode | HTMLElement): boolean {
  return node.nodeType === Node.ELEMENT_NODE;
}

// 模板节点 template
export function fragmentNodep(node: ChildNode | HTMLElement): boolean {
  return node.nodeType === Node.DOCUMENT_FRAGMENT_NODE;
}

export function textNodep(node: ChildNode | HTMLElement): boolean {
  return node.nodeType === Node.TEXT_NODE;
}
/**
 * * <template> 模板节点
 * @param node
 */
export function templatep(node: HTMLElement): boolean {
  return node.nodeName === "TEMPLATE";
}

export function inputp(node: Node) {
  return node.nodeName === "INPUT";
}
export function textareap(node: Node) {
  return node.nodeName === "TEXTAREA";
}

export function selectp(node: Node) {
  return node.nodeName === "SELECT";
}

export function checkboxp(node: HTMLInputElement) {
  return node.type === "checkbox";
}

export function radiop(node: HTMLInputElement) {
  return node.type === "radio";
}
