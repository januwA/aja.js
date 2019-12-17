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
    setText(contextData) {
        const text = this.text.replace(exp_1.interpolationExpressionExp, (match, g1) => {
            const [bindKey, pipeList] = util_1.parsePipe(g1);
            const data = util_1.getData(bindKey, contextData);
            const pipeData = pipes_1.usePipes(data, pipeList, contextData);
            return pipeData;
        });
        this.node.textContent = text;
    }
}
exports.BindingTextBuilder = BindingTextBuilder;
//# sourceMappingURL=binding-text-builder.js.map