import { spaceExp, parsePipesExp } from "./exp";
import {
  objectTag,
  arrayTag,
  strString,
  structureDirectivePrefix,
  templateEvent
} from "./const-string";
import { ContextData } from "../classes/context-data";

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
export function parseTemplateEventArgs(str: string): string[] {
  const index = str.indexOf("(");
  // 砍掉函数名
  // 去掉首尾圆括号
  // 用逗号分割参数
  return str
    .substr(index)
    .trim()
    .replace(/(^\(*)|(\)$)/g, emptyString)
    .split(",");
}

/**
 * * 避免使用全局的eval
 * @param this
 * @param bodyString
 */
export function ourEval(this: any, bodyString: string): any {
  const f = new Function(`
  delete name;
  ${bodyString}`);
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
 * @param inputNode
 */
export function getCheckboxRadioValue(
  inputNode: HTMLInputElement
): string | null {
  let value: string | null = inputNode.value;
  if (value === "on") value = null;
  return value;
}

/**
 * 查找一个节点是否包含:if指令
 * 并返回
 */
export function findIfAttr(
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
export function findForAttr(
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
export function findModelAttr(
  node: HTMLElement,
  modelAttr: string
): Attr | undefined {
  if (node.attributes && node.attributes.length) {
    const attrs = toArray(node.attributes);
    return attrs.find(({ name }) => name === modelAttr);
  }
}

/**
 * * 检测节点上是否有绑定结构指令
 * @param node
 * @param modelAttr
 */
export function hasStructureDirective(node: HTMLElement): boolean {
  if (node.attributes && node.attributes.length) {
    const attrs = toArray(node.attributes);
    return attrs.some(
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

/**
 * * 1. 优先寻找模板变量
 * * 2. 在传入的state中寻找
 * * 3. 在this.$store中找
 * * 'name' 'object.name'
 * @param key
 * @param contextData
 * @param isDeep  添加这个参数避免堆栈溢出
 */
export function getData(
  key: string,
  contextData: ContextData,
  isDeep = false
): any {
  if (typeof key !== strString) return null;
  // 抽掉所有空格，再把管道排除
  const [bindKey, pipeList] = parsePipe(key);
  // 在解析绑定的变量
  const bindKeys = bindKey.split(".");
  let _result: any;
  const firstKey = bindKeys[0];

  // 模板变量
  if (contextData.tvState && contextData.tvState.has(firstKey)) {
    // 绑定的模板变量，全是小写
    const lowerKeys = bindKeys.map(k => k.toLowerCase());
    for (const k of lowerKeys) {
      _result = _result ? _result[k] : contextData.tvState.get(k);
    }
  }

  // state
  if (_result === undefined) {
    if (contextData.contextState && firstKey in contextData.contextState) {
      for (const k of bindKeys) {
        _result = _result ? _result[k] : contextData.contextState[k];
      }
    }
  }

  // this.$store
  if (_result === undefined) {
    if (firstKey in contextData.globalState) {
      for (const k of bindKeys) {
        _result = _result ? _result[k] : contextData.globalState[k];
      }
    }
  }

  if (_result === undefined) {
    // eval解析
    if (isDeep) return undefined;
    _result = parseJsString(bindKey, contextData);
  }

  return _result;
}

/**
 * 设置新数据，现在暂时在双向绑定的时候使用新数据, 数据来源于用户定义的 state
 * @param key
 * @param newValue
 * @param state
 */
export function setData(key: string, newValue: any, contextData: ContextData) {
  if (typeof key !== strString) return null;
  const state = contextData.globalState;
  const keys = key.split(".");
  const keysSize = keys.length;
  if (!keysSize) return;
  const firstKey = keys[0];
  let _result: any;
  if (keysSize === 1 && firstKey in state) {
    state[firstKey] = newValue;
    return;
  }
  for (let index = 0; index < keysSize - 1; index++) {
    const k = keys[index];
    _result = _result ? _result[k] : state[k];
  }

  if (_result) {
    const lastKey = keys[keysSize - 1];
    _result[lastKey] = newValue;
    return;
  }
  parseJsString(key, state, true, newValue);
}

/**
 * 解析一些奇怪的插值表达式
 * {{ el['age'] }}
 * :for="(i, el) in arr" (click)="foo( 'xxx-' + el.name  )"
 * @param key
 * @param state
 * @param setState
 */
export function parseJsString(
  key: string,
  state: any,
  setState: boolean = false,
  newValue: any = ""
) {
  try {
    return ourEval(`return ${key}`);
  } catch (er) {
    // 利用错误来抓取变量
    const msg: string = er.message;
    if (msg.includes("is not defined")) {
      const match = msg.match(/(.*) is not defined/);
      if (!match) return emptyString;
      const varName = match[1];
      const context = getData(varName, state, true);
      if (setState) {
        const funBody =
          key.replace(new RegExp(`\\b${varName}`, "g"), "this") +
          `='${newValue}'`;
        ourEval.call(context, `${funBody}`);
      } else {
        if (context === undefined) return context;
        let replaceValue = "this";
        if (typeof context === "boolean" || context == 0) {
          replaceValue = context.toString();
        }
        const funBody = key.replace(
          new RegExp(`\\b${varName}`, "g"),
          replaceValue
        );
        let _result = ourEval.call(context, `return ${funBody}`);
        if (_result === undefined) _result = emptyString;
        return _result;
      }
    } else {
      console.error(er);
      throw er;
    }
  }
}

/**
 * ['obj.age', 12, false, '"   "', alert('xxx')] -> [22, 12, false, "   ", eval(<other>)]
 * @param args
 * @param contextData
 */
export function parseArgsToArguments(args: string[], contextData: ContextData) {
  return args.map(arg => {
    if (!arg) return arg;
    let el = arg.trim();
    if (el === templateEvent) return el;
    return getData(el, contextData);
  });
}

export function parseArgsEvent(args: string[], e: any) {
  return args.map(arg => {
    if (arg === templateEvent) return e;
    return arg;
  });
}
