"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const exp_1 = require("../utils/exp");
const util_1 = require("../utils/util");
const pipes_1 = require("../pipes/pipes");
class BindingTextBuilder {
    constructor(node) {
        this.node = node;
        this.text = node.textContent || "";
    }
    /**
     * * 是否需要解析
     */
    get needParse() {
        return exp_1.interpolationExpressionExp.test(this.text);
    }
    setText(getData) {
        const text = this.text.replace(exp_1.interpolationExpressionExp, (match, g1) => {
            const key = g1.replace(exp_1.spaceExp, "");
            const pipeList = util_1.parsePipe(key)[1];
            const data = getData(key);
            const pipeData = pipes_1.usePipes(data, pipeList, arg => getData(arg));
            return pipeData;
        });
        if (text !== this.node.textContent) {
            this.node.textContent = text;
        }
    }
}
exports.BindingTextBuilder = BindingTextBuilder;
//# sourceMappingURL=binding-text-builder.js.map