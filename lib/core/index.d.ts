import { ContextData } from "../classes/context-data";
/**
 * * 1. 优先寻找模板变量
 * * 2. 在传入的state中寻找
 * * 3. 在this.$store中找
 * * 'name' 'object.name'
 * @param key
 * @param contextData
 * @param isDeep  添加这个参数避免堆栈溢出
 */
export declare function getData(key: string, contextData: ContextData, isDeep?: boolean): any;
/**
 * 设置新数据，现在暂时在双向绑定的时候使用新数据, 数据来源于用户定义的 state
 * @param key
 * @param newValue
 * @param state
 */
export declare function setData(key: string, newValue: any, contextData: ContextData): null | undefined;
/**
 * 解析一些奇怪的插值表达式
 * {{ el['age'] }}
 * :for="(i, el) in arr" (click)="foo( 'xxx-' + el.name  )"
 * @param key
 * @param state
 * @param setState
 */
export declare function parseJsString(key: string, state: any, setState?: boolean, newValue?: any): any;
export declare function myEval(originString: string, context: any): any;
/**
 * * 避免使用全局的eval
 * @param this
 * @param bodyString
 */
export declare function ourEval(this: any, bodyString: string): any;
