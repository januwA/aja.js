import { ContextData } from "../classes/context-data";
import { parsePipe, emptyString } from "../utils/util";
import { undefinedp, stringp } from "../utils/p";

const l = console.log;

/**
 * * 1. 优先寻找模板变量
 * * 2. 在传入的state中寻找
 * * 3. 在this.$store中找
 * * 'name' 'object.name'
 * @param key
 * @param contextData
 * @param isDeep  添加这个参数避免堆栈溢出
 */
export function getData(key: string, contextData: ContextData): any {
  if (!stringp(key)) return null;
  // 抽掉所有空格，再把管道排除
  let [bindKey] = parsePipe(key);
  let _result: any;

  _result = evalFun(bindKey, {
    ...contextData.store,
    ...contextData.forState,
    ...contextData.tData.templateVariables
  });
  if (undefinedp(_result)) _result = emptyString;
  return _result;
}

/**
 * 设置新数据，现在暂时在双向绑定的时候使用新数据, 数据来源于用户定义的 state
 * @param key
 * @param newValue
 * @param state
 */
export function setData(key: string, newValue: any, contextData: ContextData) {
  if (!stringp(key)) return null;
  return Function(`return function(d) {
        with(this){
          ${key} = d;
        }
      }`)().call(contextData.store, newValue);
}

export function evalFun(bindKey: string, data: any) {
  if (undefinedp(data)) return;
  try {
    const r = Function(`with(this){ return ${bindKey} }`).apply(
      data,
      arguments
    );
    return r === "" ? undefined : r;
  } catch (error) {}
}
