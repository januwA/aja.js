"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("../utils/util");
const exp_1 = require("../utils/exp");
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
        let [variable, bindData] = this.forAttr.value
            .split(/\bin\b/)
            .map(s => s.trim());
        const variables = variable
            .trim()
            .replace(exp_1.eventStartExp, util_1.emptyString)
            .replace(exp_1.eventEndExp, util_1.emptyString)
            .split(",")
            .map(v => v.trim());
        return {
            variable,
            variables,
            bindData
        };
    }
    get bindVar() {
        if (this.hasForAttr) {
            return this.forAttrValue.variable;
        }
    }
    get bindKey() {
        if (this.hasForAttr) {
            return this.forAttrValue.variables[0];
        }
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
            return util_1.isNumber(this.bindData);
        }
    }
    /**
     * * 添加一个节点
     * @param item
     */
    add(item) {
        if (this.fragment) {
            this.fragment.append(item);
            this.forBuffer.push(item);
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
        if (isNumber && this.bindVar) {
            Object.defineProperty(forState, this.bindVar, {
                get() {
                    return k;
                }
            });
        }
        else {
            if (this.bindKey && this.bindValue) {
                Object.defineProperties(forState, {
                    [this.bindKey]: {
                        get() {
                            return k;
                        }
                    },
                    [this.bindValue]: {
                        get() {
                            return v;
                        }
                    }
                });
            }
            else if (this.bindKey) {
                Object.defineProperties(forState, {
                    [this.bindKey]: {
                        get() {
                            return v;
                        }
                    }
                });
            }
        }
        return forState;
    }
    createForCommentData(obj) {
        let data = obj;
        if (util_1.arrayp(data)) {
            data = obj.slice(0, 6);
        }
        return `{":for": "${data}"}`;
    }
    createItem() {
        const item = this.node.cloneNode(true);
        this.add(item);
        return item;
    }
}
exports.BindingForBuilder = BindingForBuilder;
//# sourceMappingURL=binding-for-builder.js.map