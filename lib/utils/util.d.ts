import { ContextData } from "../classes/context-data";
export declare function createRoot(view: string | HTMLElement): HTMLElement | null;
export declare function createObject<T>(obj?: T): T;
export declare function toArray<T>(iterable: Iterable<T> | ArrayLike<T>): T[];
export declare const emptyString: string;
/**
 * setAge( obj.age   , '        ') -> ["obj.age   ", " '        '"]
 * @param str
 */
export declare function parseTemplateEventArgs(str: string): string[];
/**
 * Object.prototype.toString.call({}) -> "[object Object]"
 * @param data
 */
export declare function dataTag(data: any): string;
/**
 * 把字符串安全格式化 为正则表达式源码
 * {{ arr[0] }} -> \{\{ arr\[0\] \}\}
 * @param str
 */
export declare function escapeRegExp(str: string): string;
export declare function escapeHTML(str: string): string;
/**
 * * 将['on']转为[null]
 * @param inputNode
 */
export declare function getCheckboxRadioValue(inputNode: HTMLInputElement): string | null;
/**
 * 查找一个节点是否包含:if指令
 * 并返回
 */
export declare function findIfAttr(node: HTMLElement, ifInstruction: string): Attr | undefined;
/**
 * 查找一个节点是否包含:if指令
 * 并返回
 */
export declare function findForAttr(node: HTMLElement, forInstruction: string): Attr | undefined;
/**
 * 查找一个节点是否包含[(model)]指令
 * 并返回
 */
export declare function findModelAttr(node: HTMLElement, modelAttr: string): Attr | undefined;
/**
 * * 检测节点上是否有绑定结构指令
 * @param node
 * @param modelAttr
 */
export declare function hasStructureDirective(node: HTMLElement): boolean;
/**
 * * 从表达式中获取管道
 * 抽空格，在分离 |
 * @returns [ bindKey, Pipes[] ]
 */
export declare function parsePipe(key: string): [string, string[]];
/**
 * * 不忽略大小写
 * @param obj
 * @param other
 */
export declare function equal(obj: any, other: any): boolean;
/**
 * * 忽略大小写
 * @param obj
 * @param other
 */
export declare function equalp(obj: any, other: any): boolean;
/**
 * ['obj.age', 12, false, '"   "', alert('xxx')] -> [22, 12, false, "   ", eval(<other>)]
 * @param args
 * @param contextData
 */
export declare function parseArgsToArguments(args: string[], contextData: ContextData): any[];
export declare function parseArgsEvent(args: string[], e: any): any[];
