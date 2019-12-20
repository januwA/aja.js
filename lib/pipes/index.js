"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const p_1 = require("../utils/p");
const core_1 = require("../core");
exports.ajaPipes = {
    /**
     * * 全部大写
     * @param value
     */
    uppercase(value) {
        return value.toUpperCase();
    },
    /**
     * * 全部小写
     * @param value
     */
    lowercase(value) {
        return value.toLowerCase();
    },
    /**
     * * 首字母小写
     * @param str
     */
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.substring(1);
    },
    json(data) {
        return JSON.stringify(data, null, " ");
    },
    slice(str, start, end) {
        return str.slice(start, end);
    }
};
// 开始管道加工
function usePipes(target, pipeList, contextData) {
    let _result = target;
    if (pipeList.length) {
        pipeList.forEach(pipe => {
            const [p, ...pipeArgs] = pipe.split(":");
            if (p in exports.ajaPipes) {
                const parsePipeArgs = pipeArgs.map(arg => p_1.numberStringp(arg) ? arg : core_1.getData(arg, contextData));
                _result = exports.ajaPipes[p](_result, ...parsePipeArgs);
            }
        });
    }
    return _result;
}
exports.usePipes = usePipes;
//# sourceMappingURL=index.js.map