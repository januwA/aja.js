import { spaceExp, parsePipesExp } from "./exp";
import { objectTag, arrayTag, strString } from "./const-string";

export function createRoot(view: string | HTMLElement): HTMLElement | null {
  return typeof view === "string"
    ? document.querySelector<HTMLElement>(view)
    : view;
}

export function createObject<T>(obj?: T): T {
  return obj ? obj : ({} as T);
}

export function toArray<T>(iterable: Iterable<T> | ArrayLike<T>): T[] {
  if (!iterable) return [];
  if (Array.from) {
    return Array.from<T>(iterable);
  } else {
    return Array.prototype.slice.call(iterable) as T[];
  }
}

export const emptyString: string = "";

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
 * * 将['on']转为[null]
 * @param checkbox
 */
export function getCheckboxRadioValue(
  checkbox: HTMLInputElement
): string | null {
  let value: string | null = checkbox.value;
  if (value === "on") value = null;
  return value;
}

/**
 * 查找一个节点是否包含:if指令
 * 并返回
 */
export function hasIfAttr(
  node: HTMLElement,
  ifInstruction: string
): Attr | undefined {
  if (node.attributes && node.attributes.length) {
    const attrs = Array.from(node.attributes);
    return attrs.find(({ name }) => name === ifInstruction);
  }
}

/**
 * 查找一个节点是否包含:if指令
 * 并返回
 */
export function hasForAttr(
  node: HTMLElement,
  forInstruction: string
): Attr | undefined {
  if (node.attributes && node.attributes.length) {
    const attrs = Array.from(node.attributes);
    return attrs.find(({ name }) => name === forInstruction);
  }
}

/**
 * 查找一个节点是否包含[(model)]指令
 * 并返回
 */
export function hasModelAttr(
  node: HTMLElement,
  modelAttr: string
): Attr | undefined {
  if (node.attributes && node.attributes.length) {
    const attrs = toArray(node.attributes);
    return attrs.find(({ name }) => name === modelAttr);
  }
}

/**
 * * 从表达式中获取管道
 * 抽空格，在分离 |
 * @returns [ bindKey, Pipes[] ]
 */
export function parsePipe(key: string): [string, string[]] {
  const [bindKey, ...pipes] = key
    .replace(spaceExp, emptyString)
    .split(parsePipesExp);
  return [bindKey, pipes];
}
const emptyp = function(value: any) {
  return JSON.stringify(value).length === 2 ? true : false;
};

function _equal(obj: any, other: any, equalp: boolean = false): boolean {
  function Equal(obj: any, other: any, equalp: boolean): boolean {
    let objTag = dataTag(obj);
    let otherTag = dataTag(other);

    if (
      objTag !== objectTag &&
      objTag !== arrayTag &&
      otherTag !== objectTag &&
      otherTag !== arrayTag
    ) {
      if (equalp && typeof obj === strString && typeof other === strString) {
        return obj.toLocaleUpperCase() === other.toLocaleUpperCase();
      }
      return obj === other;
    }
    if (objTag !== otherTag) return false; // 集合类型不一样
    // if (
    //   Object.getOwnPropertyNames(obj).length !==
    //   Object.getOwnPropertyNames(other).length
    // )
    if (Object.keys(obj).length !== Object.keys(other).length) return false; // 集合元素数量不一样
    if (emptyp(obj) && emptyp(other)) return true; // 类型一样的空集合，永远相等。

    let data: any[] = (function() {
      let data = Object.getOwnPropertyNames(obj);
      if (objTag === arrayTag) {
        data.pop();
        return data;
      } else {
        return data;
      }
    })();

    for (const i in data) {
      const k = data[i];
      if (k in other) {
        // 元素是否相交
        let obj_value = obj[k];
        let other_value = other[k];
        let obj_item_tag = dataTag(obj_value);
        let other_item_tag = dataTag(other_value);

        if (obj_item_tag === other_item_tag) {
          if (
            obj_item_tag === objectTag ||
            obj_item_tag === arrayTag ||
            other_item_tag === objectTag ||
            other_item_tag === arrayTag
          ) {
            return Equal(obj_value, other_value, equalp);
          } else {
            if (obj_value === other_value) {
            } else {
              return false;
            }
          }
        } else {
          return false;
        }
      } else {
        return false;
      }
    }

    return true;
  }

  return Equal(obj, other, equalp);
}

/**
 * * 不忽略大小写
 * @param obj
 * @param other
 */
export function equal(obj: any, other: any) {
  return _equal(obj, other, false);
}

/**
 * * 忽略大小写
 * @param obj
 * @param other
 */
export function equalp(obj: any, other: any) {
  return _equal(obj, other, true);
}
