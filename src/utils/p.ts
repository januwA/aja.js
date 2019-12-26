import { dataTag } from "./util";
import { stringTag, numberTag, objectTag, arrayTag, undefinedTag, nullTag } from "./const-string";

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

export function stringp(data: string) {
  return dataTag(data) === stringTag;
}

export function numberStringp(str: any): boolean {
  if (undefinedp(str)) return false;
  if (!str.trim()) return false;
  return !isNaN(+str);
}

export function numberp(data: any) {
  return typeof data === 'number' &&
    dataTag(data) === numberTag &&
    Number.isFinite(data) &&
    data < Number.MAX_VALUE &&
    data > Number.MIN_VALUE
}

/**
 * 'false' || 'true'
 * @param str
 */
export function boolStringp(str: string): boolean {
  return str === "true" || str === "false";
}

export function objectp(data: any): boolean {
  return dataTag(data) === objectTag;
}

export function arrayp(data: any): data is any[] {
  return Array.isArray ? Array.isArray(data) : dataTag(data) === arrayTag;
}

export function nullp(data: any): data is null {
  return dataTag(data) === nullTag;
}

export function undefinedp(data: any): data is undefined {
  return data === undefined || dataTag(data) === undefinedTag;
}

export function elementNodep(node: ChildNode | HTMLElement): node is HTMLElement {
  return node.nodeType === Node.ELEMENT_NODE;
}

// 模板节点 template
export function fragmentNodep(node: ChildNode | HTMLElement): node is HTMLFrameElement {
  return node.nodeType === Node.DOCUMENT_FRAGMENT_NODE;
}

export function textNodep(node: ChildNode | HTMLElement): boolean {
  return node.nodeType === Node.TEXT_NODE;
}
/**
 * * <template> 模板节点
 * @param node
 */
export function templatep(node: HTMLElement): node is HTMLTemplateElement {
  return node.nodeName === "TEMPLATE";
}

export function inputp(node: Node): node is HTMLInputElement {
  return node.nodeName === "INPUT";
}
export function textareap(node: Node): node is HTMLTextAreaElement {
  return node.nodeName === "TEXTAREA";
}

export function selectp(node: Node): node is HTMLSelectElement {
  return node.nodeName === "SELECT";
}

export function checkboxp(node: Node): node is HTMLInputElement {
  return inputp(node) && node.type === "checkbox";
}

export function radiop(node: Node): node is HTMLInputElement {
  return inputp(node) && node.type === "radio";
}

export function formp(node: Node): node is HTMLFormElement {
  return node.nodeName === "FORM";
}
