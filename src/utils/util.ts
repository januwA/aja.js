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
