"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const p_1 = require("../utils/p");
exports.pipes = {
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
    json(str) {
        return JSON.stringify(str, null, " ");
    },
    slice(str, start, end) {
        return str.slice(start, end);
    }
};
// 开始管道加工
function usePipes(data, pipeList, getData) {
    let _result = data;
    if (pipeList.length) {
        pipeList.forEach(pipe => {
            const [p, ...pipeArgs] = pipe.split(":");
            if (p in exports.pipes) {
                let parsePipeArgs;
                if (getData) {
                    parsePipeArgs = pipeArgs.map(arg => {
                        if (p_1.numberp(arg))
                            return arg;
                        return getData(arg);
                    });
                }
                else {
                    parsePipeArgs = pipeArgs;
                }
                _result = exports.pipes[p](_result, ...parsePipeArgs);
            }
        });
    }
    return _result;
}
exports.usePipes = usePipes;
//# sourceMappingURL=pipes.js.map