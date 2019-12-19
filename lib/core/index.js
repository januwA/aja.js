"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const const_string_1 = require("../utils/const-string");
const util_1 = require("../utils/util");
const exp_1 = require("../utils/exp");
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
    if (typeof key !== const_string_1.strString)
        return null;
    // 抽掉所有空格，再把管道排除
    let [bindKey, pipeList] = util_1.parsePipe(key);
    // 在解析绑定的变量
    const bindKeys = bindKey.split(".");
    let _result;
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
        _result = myEval(bindKey, contextData.tvState);
    }
    if (_result === undefined) {
        _result = myEval(bindKey, contextData.contextState);
    }
    if (_result === undefined) {
        _result = myEval(bindKey, contextData.globalState);
    }
    if (_result === undefined) {
        // eval解析
        if (isDeep)
            return undefined;
        _result = parseJsString(bindKey, contextData);
    }
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
    if (typeof key !== const_string_1.strString)
        return null;
    const state = contextData.globalState;
    const keys = key.split(".");
    const keysSize = keys.length;
    if (!keysSize)
        return;
    const firstKey = keys[0];
    let _result;
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
exports.setData = setData;
/**
 * 解析一些奇怪的插值表达式
 * {{ el['age'] }}
 * :for="(i, el) in arr" (click)="foo( 'xxx-' + el.name  )"
 * @param key
 * @param state
 * @param setState
 */
function parseJsString(key, state, setState = false, newValue = "") {
    try {
        // 在这里被指向了window
        return ourEval(`return ${key}`);
    }
    catch (er) {
        // 利用错误来抓取变量
        const msg = er.message;
        if (msg.includes("is not defined")) {
            const match = msg.match(/(.*) is not defined/);
            if (!match)
                return util_1.emptyString;
            const varName = match[1];
            const context = getData(varName, state, true);
            if (setState) {
                const funBody = key.replace(new RegExp(`\\b${varName}`, "g"), "this") +
                    `='${newValue}'`;
                ourEval.call(context, `${funBody}`);
            }
            else {
                if (context === undefined)
                    return context;
                let replaceValue = "this";
                if (typeof context === "boolean" || context == 0) {
                    replaceValue = context.toString();
                }
                const funBody = key.replace(new RegExp(`\\b${varName}`, "g"), replaceValue);
                let _result = ourEval.call(context, `return ${funBody}`);
                if (_result === undefined)
                    _result = util_1.emptyString;
                return _result;
            }
        }
        else {
            console.error(er);
            throw er;
        }
    }
}
exports.parseJsString = parseJsString;
function myEval(originString, context) {
    if (!context)
        return;
    let bindKey = originString;
    bindKey = bindKey.replace(/\s/g, "").replace(exp_1.evalExp, " ");
    let bindKeys = bindKey
        .split(" ")
        .map(s => s.trim())
        .filter(e => !!e)
        .filter(e => {
        if (/^['"`]/.test(e)) {
            return false;
        }
        // 过滤布尔值
        if (e === "true" || e === "false") {
            return false;
        }
        // 过滤number
        if (!isNaN(+e)) {
            return false;
        }
        return true;
    });
    let args = bindKeys.map(s => {
        if (/\./.test(s) && /\[|\]/g.test(s)) {
            let aindex = s.indexOf(".");
            let bindex = s.indexOf("[");
            let index = Math.min(aindex, bindex);
            let obj = s.substr(0, index);
            return obj;
        }
        else if (/\./.test(s)) {
            let aindex = s.indexOf(".");
            let obj = s.substr(0, aindex);
            return obj;
        }
        else if (/\[|\]/g.test(s)) {
            let bindex = s.indexOf("[");
            let obj = s.substr(0, bindex);
            return obj;
        }
        return s;
    });
    let datas = args.map(k => {
        if (k in context) {
            return context[k];
        }
    }).filter(e => !!e);
    if (!datas.length)
        return;
    let funbody = `return function(${args.toString()}) {
      return ${originString};}`;
    return Function(funbody)()(...datas);
}
exports.myEval = myEval;
/**
 * * 避免使用全局的eval
 * @param this
 * @param bodyString
 */
function ourEval(bodyString) {
    try {
        return Function(`${bodyString}`).apply(this, arguments);
    }
    catch (er) {
        throw er;
    }
}
exports.ourEval = ourEval;
//# sourceMappingURL=index.js.map