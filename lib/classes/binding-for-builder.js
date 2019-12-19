"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("../utils/util");
const exp_1 = require("../utils/exp");
const p_1 = require("../utils/p");
const const_string_1 = require("../utils/const-string");
class BindingForBuilder {
    constructor(node, contextData) {
        this.node = node;
        this.contextData = contextData;
        this.forBuffer = [];
        let forAttr = util_1.findForAttr(node, const_string_1.structureDirectives.for);
        // 没有for指令，就不构建下去了
        if (!forAttr)
            return;
        this.forAttr = forAttr;
        this.commentNode = document.createComment("");
        this.fragment = document.createDocumentFragment();
        node.replaceWith(this.commentNode);
        node.removeAttribute(const_string_1.structureDirectives.for);
    }
    get hasForAttr() {
        return !!this.forAttr;
    }
    get forAttrValue() {
        if (!this.forAttr)
            return;
        let [variable, bindKey] = this.forAttr.value
            .split(/\bin|of\b/)
            .map(s => s.trim());
        let variables = [];
        if (variable) {
            variables = variable
                .trim()
                .replace(exp_1.eventStartExp, util_1.emptyString)
                .replace(exp_1.eventEndExp, util_1.emptyString)
                .split(",")
                .map(v => v.trim());
        }
        const p = util_1.parsePipe(bindKey);
        return {
            variable,
            variables,
            bindData: p[0],
            pipes: p[1]
        };
    }
    get bindVar() {
        return this.forAttrValue.variable || this.contextData.forLet;
    }
    get bindKey() {
        return this.forAttrValue.variables[0] || this.contextData.forLet;
    }
    get bindValue() {
        if (this.hasForAttr) {
            return this.forAttrValue.variables[1];
        }
    }
    get bindData() {
        if (this.hasForAttr) {
            return this.forAttrValue.bindData;
        }
    }
    get isNumberData() {
        if (this.hasForAttr) {
            return p_1.numberp(this.bindData);
        }
    }
    get pipes() {
        var _a;
        if (this.hasForAttr) {
            return ((_a = this.forAttrValue) === null || _a === void 0 ? void 0 : _a.pipes) || [];
        }
        else {
            return [];
        }
    }
    /**
     * * 将所有节点插入DOM
     * @param data
     */
    draw(data) {
        if (this.commentNode && this.fragment) {
            this.commentNode.after(this.fragment);
            this.commentNode.data = this.createForCommentData(data);
        }
    }
    /**
     * * 清除所有节点
     */
    clear() {
        for (const forItem of this.forBuffer) {
            forItem.remove();
        }
        this.forBuffer = [];
    }
    createForContextState(k, v = null, isNumber = true) {
        const forState = {};
        if (isNumber) {
            forState[this.bindVar] = k;
        }
        else {
            if (this.bindKey && this.bindValue) {
                forState[this.bindKey] = k;
                forState[this.bindValue] = v;
            }
            else if (this.bindKey) {
                forState[this.bindKey] = v;
            }
        }
        return forState;
    }
    createForCommentData(obj) {
        let data = obj;
        if (p_1.arrayp(data)) {
            data = obj.slice(0, 6);
        }
        return `{":for": "${data}"}`;
    }
    createItem() {
        const item = this.node.cloneNode(true);
        if (this.fragment) {
            this.forBuffer.push(item);
            this.fragment.append(item);
        }
        return item;
    }
}
exports.BindingForBuilder = BindingForBuilder;
//# sourceMappingURL=binding-for-builder.js.map