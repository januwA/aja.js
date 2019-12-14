"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const exp_1 = require("../utils/exp");
const util_1 = require("../utils/util");
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
     * * ["{{name | uppercase }}", "{{ age }}"] -> ["name | uppercase", ["age"]]
     */
    get bindVariables() {
        let vs = this.matchs.map(e => e.replace(/[{}\s]/g, ""));
        return vs;
    }
    draw(states) {
        this.childNode.textContent = this._parseBindingTextContent(states);
    }
    /**
     * * 解析文本的表达式
     *
     * @param textContent  "{{ age }} - {{ a }} = {{ a }}""
     * @param states [12, "x", "x"]
     * @returns "12 - x = x"
     */
    _parseBindingTextContent(states) {
        if (this.matchs.length !== states.length)
            return "[[aja.js: 框架意外的解析错误!!!]]";
        let result = this.text;
        for (let index = 0; index < this.matchs.length; index++) {
            const m = this.matchs[index];
            let state = states[index];
            if (state === null)
                state = "";
            state =
                typeof state === "string" ? state : JSON.stringify(state, null, " ");
            result = result.replace(new RegExp(util_1.escapeRegExp(m), "g"), state);
        }
        return result;
    }
}
exports.BindingTextBuilder = BindingTextBuilder;
//# sourceMappingURL=binding-text-builder.js.map