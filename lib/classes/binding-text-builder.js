"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const exp_1 = require("../utils/exp");
const util_1 = require("../utils/util");
class BindingTextBuilder {
    constructor(childNode) {
        this.childNode = childNode;
        this._bindTextContent = childNode.textContent || "";
    }
    /**
     * * 是否需要解析
     */
    get needParse() {
        return exp_1.interpolationExpressionExp.test(this._bindTextContent);
    }
    /**
     * * "{{name}} {{ age }}" -> ["{{name}}", "{{ age }}"]
     */
    get matchs() {
        let matchs = this._bindTextContent.match(exp_1.interpolationExpressionExp) || [];
        return matchs;
    }
    /**
     * * ["{{name}}", "{{ age }}"] -> ["name", "age"]
     */
    get bindVariables() {
        return this.matchs.map(e => e.replace(/[{}\s]/g, ""));
    }
    draw(states) {
        this.childNode.textContent = this._parseBindingTextContent(this._bindTextContent, this.matchs, states);
    }
    /**
     * * 解析文本的表达式
     *
     * @param textContent  "{{ age }} - {{ a }} = {{ a }}""
     * @param matchs  ["{{ age }}", "{{ a }}", "{{ a }}"]
     * @param states [12, "x", "x"]
     * @returns "12 - x = x"
     */
    _parseBindingTextContent(textContent, matchs, states) {
        if (matchs.length !== states.length)
            return "[[aja.js: 框架意外的解析错误!!!]]";
        for (let index = 0; index < matchs.length; index++) {
            const m = matchs[index];
            let state = states[index];
            if (state === null)
                state = "";
            state =
                typeof state === "string" ? state : JSON.stringify(state, null, " ");
            textContent = textContent.replace(new RegExp(util_1.escapeRegExp(m), "g"), state);
        }
        return textContent;
    }
}
exports.BindingTextBuilder = BindingTextBuilder;
//# sourceMappingURL=binding-text-builder.js.map