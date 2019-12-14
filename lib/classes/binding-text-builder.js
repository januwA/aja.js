"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const exp_1 = require("../utils/exp");
class BindingTextBuilder {
    constructor(childNode) {
        this.childNode = childNode;
        this.text = childNode.textContent || "";
    }
    /**
     * * 是否需要解析
     */
    get needParse() {
        return exp_1.interpolationExpressionExp.test(this.text);
    }
    /**
     * * "{{name}} {{ age }}" -> ["{{name}}", "{{ age }}"]
     */
    get matchs() {
        let matchs = this.text.match(exp_1.interpolationExpressionExp) || [];
        return matchs;
    }
    /**
     * * ["{{name | uppercase }}", "{{ age }}"] -> [["name", "uppercase"], ["age"]]
     */
    get bindVariables() {
        let vs = this.matchs
            .map(e => e.replace(/[{}\s]/g, ""))
            .map(e => e.split("|"));
        return vs;
    }
}
exports.BindingTextBuilder = BindingTextBuilder;
//# sourceMappingURL=binding-text-builder.js.map