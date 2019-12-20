"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("../utils/util");
const p_1 = require("../utils/p");
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
function getData(key, contextData, isDeep = false) {
    if (!p_1.stringp(key))
        return null;
    // 抽掉所有空格，再把管道排除
    let [bindKey] = util_1.parsePipe(key);
    let _result;
    if (contextData.tData) {
        _result = evalFun(bindKey, contextData.tData);
    }
    if (p_1.undefinedp(_result) && contextData.contextState) {
        _result = evalFun(bindKey, contextData.contextState);
    }
    if (p_1.undefinedp(_result) && contextData.store) {
        _result = evalFun(bindKey, contextData.store);
    }
    if (p_1.undefinedp(_result))
        _result = util_1.emptyString;
    return _result;
}
exports.getData = getData;
/**
 * 设置新数据，现在暂时在双向绑定的时候使用新数据, 数据来源于用户定义的 state
 * @param key
 * @param newValue
 * @param state
 */
function setData(key, newValue, contextData) {
    if (!p_1.stringp(key))
        return null;
    return Function(`return function(d) {
        with(this){
          ${key} = d;
        }
      }`)().call(contextData.store, newValue);
}
exports.setData = setData;
function evalFun(bindKey, data) {
    if (p_1.undefinedp(data))
        return;
    try {
        const r = Function(`with(this){ return ${bindKey} }`).apply(data, arguments);
        return r === '' ? undefined : r;
    }
    catch (error) {
    }
}
exports.evalFun = evalFun;
//# sourceMappingURL=index.js.map