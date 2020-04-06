import { parsePipesExp } from "./exp";
import { structureDirectivePrefix } from "./const-string";

export function toArray<T>(iterable: Iterable<T> | ArrayLike<T>): T[] {
  if (!iterable) return [];
  if (Array.from) {
    return Array.from<T>(iterable);
  } else {
    return Array.prototype.slice.call(iterable) as T[];
  }
}

export const EMPTY_STRING: string = "";

/**
 * Object.prototype.toString.call({}) -> "[object Object]"
 * @param data
 */
export function dataTag(data: any): string {
  return Object.prototype.toString.call(data);
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

/**
 * * 将 'on' 转为 null
 * @param inputNode
 */
export function getCheckboxRadioValue(
  inputNode: HTMLInputElement
): string | null {
  const value = inputNode.value;
  return value === "on" ? null : value;
}

/**
 * * 检测节点上是否有绑定结构指令
 * @param node
 * @param modelAttr
 */
export function hasStructureDirective(node: HTMLElement): boolean {
  if (node.attributes && node.attributes.length) {
    return getAttrs(node).some(
      ({ name }) => name.charAt(0) === structureDirectivePrefix
    );
  }
  return false;
}

/**
 * * 从表达式中获取管道
 * 抽空格，在分离 |
 * @returns [ bindKey, Pipes[] ]
 */
export function parsePipe(key: string): [string, string[]] {
  const [bindKey, ...pipes] = key.split(parsePipesExp);
  return [bindKey.trim(), pipes.map((e) => e.trim())];
}

export function getAttrs(node: HTMLElement): Attr[] {
  return toArray(node.attributes || []);
}

export function eachChildNodes(
  node: HTMLElement,
  callbackfn: (value: ChildNode, index: number, array: ChildNode[]) => void
) {
  toArray(node.childNodes).forEach(callbackfn);
}

/**
 * 节点是否包含多个结构型指令
 */
export function hasMultipleStructuredInstructions(node: HTMLElement): boolean {
  return (
    getAttrs(node).reduce((acc, { name }) => {
      if (name.charAt(0) === structureDirectivePrefix) {
        acc.push(undefined);
      }
      return acc;
    }, [] as any[]).length > 1
  );
}

export function trim(value: string): string {
  return value.trim();
}

/**
 * 查找[key]的值，如果不存在，请添加一个新值
 *
 * 返回与[key]关联的值（如果有）。 否则，调用[ifAbsent]获取新值，将[key]关联到该值，然后返回新值。
 *
 * @param cache
 * @param key
 * @param ifAbsent
 */
export function putIfAbsent<K, V>(
  cache: Map<K, V>,
  key: K,
  ifAbsent?: () => V
) {
  if (cache.has(key)) return cache.get(key) as V;

  if (key && ifAbsent) {
    return cache.set(key, ifAbsent()).get(key) as V;
  }
  throw `not find [${key}]!`;
}

/**
 * 斩掉字符串中的script标签
 * 【司徒正美 js框架设计】
 * @param str 
 */
export function stripScripts(str: string) {
  return String(str || "").replace(/<script[^>]*>([\S\s]*?)<\/script>/gi, "");
}
