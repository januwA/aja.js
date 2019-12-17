"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("../utils/util");
const exp_1 = require("../utils/exp");
const p_1 = require("../utils/p");
class BindingForBuilder {
    constructor(node, forInstruction) {
        this.node = node;
        this.forInstruction = forInstruction;
        this.forBuffer = [];
        let forAttr = util_1.hasForAttr(node, forInstruction);
        // 没有for指令，就不构建下去了
        if (!forAttr)
            return;
        this.forAttr = forAttr;
        this.commentNode = document.createComment("");
        this.fragment = document.createDocumentFragment();
        node.replaceWith(this.commentNode);
        node.removeAttribute(forInstruction);
    }
    get hasForAttr() {
        return !!this.forAttr;
    }
    get forAttrValue() {
        if (!this.forAttr)
            return null;
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
        return this.forAttrValue.variable || BindingForBuilder.defaultKey;
    }
    get bindKey() {
        return this.forAttrValue.variables[0] || BindingForBuilder.defaultKey;
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
/**
 * :for="$_ of arr"
 * :for="of arr"
 */
BindingForBuilder.defaultKey = "$_";
//# sourceMappingURL=binding-for-builder.js.map