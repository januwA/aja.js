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

/**
 * * 双向绑定
 * @param str
 */
export function modelp(str: string) {
  return str === "[(model)]";
}

export function createRoot(view: string | HTMLElement): HTMLElement | null {
  return typeof view === "string"
    ? document.querySelector<HTMLElement>(view)
    : view;
}

export function createIfCommentData(value: any): string {
  return `{":if": "${!!value}"}`;
}

export function createForCommentData(obj: any): string {
  return `{":for": "${obj}"}`;
}

export function ifp(key: string, ifInstruction: string): boolean {
  return key === ifInstruction;
}

export function forp(key: string, forInstruction: string): boolean {
  return key === forInstruction;
}

export function createObject<T>(obj?: T): T {
  return obj ? obj : ({} as T);
}

export const emptyString: string = "";

export function isNumber(str: string): boolean {
  if (typeof str === "number") return true;
  if (str && !str.trim()) return false;
  return !isNaN(+str);
}

/**
 * 'name'  "name"
 *
 */
export function isTemplateString(str: string): boolean {
  return /^['"`]/.test(str.trim());
}

/**
 * '       '
 * @param str
 */
export function isTemplateEmptyString(str: string): boolean {
  return !str.trim();
}

/**
 * setAge( obj.age   , '        ') -> ["obj.age   ", " '        '"]
 * @param str
 */
export function parseTemplateEventArgs(str: string) {
  let index = str.indexOf("(");
  return str
    .substr(index, str.length - 2)
    .replace(/(^\(*)|(\)$)/g, emptyString)
    .trim()
    .split(",");
}

/**
 * 'false' || 'true'
 * @param str
 */
export function isBoolString(str: string): boolean {
  return str === "true" || str === "false";
}

/**
 * * 避免使用全局的eval
 * @param this
 * @param bodyString
 */
export function ourEval(this: any, bodyString: string): any {
  const f = new Function(bodyString);
  try {
    return f.apply(this, arguments);
  } catch (er) {
    throw er;
  }
}

/**
 * Object.prototype.toString.call({}) -> "[object Object]"
 * @param data
 */
export function dataTag(data: any): string {
  return Object.prototype.toString.call(data);
}

export function objectp(data: any) {
  return Object.prototype.toString.call(data) === "[object Object]";
}

export function arrayp(data: any) {
  return Object.prototype.toString.call(data) === "[object Array]";
}

export function nullp(data: any) {
  return Object.prototype.toString.call(data) === "[object Null]";
}

/**
 * 把字符串安全格式化 为正则表达式源码
 * {{ arr[0] }} -> \{\{ arr\[0\] \}\}
 * @param str
 */
export function escapeRegExp(str: string) {
  return str.replace(/([-.*+?^${}()|[\]\/\\])/g, "\\$1");
}

export function escapeHTML(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\s/g, "&nbsp;");
}

export function elementNodep(node: ChildNode | HTMLElement): boolean {
  return (
    node.nodeType === Node.ELEMENT_NODE ||
    node.nodeType === Node.DOCUMENT_FRAGMENT_NODE
  );
}

export function textNodep(node: ChildNode | HTMLElement): boolean {
  return node.nodeType === Node.TEXT_NODE;
}
