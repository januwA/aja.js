"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("../utils/util");
class BindingIfBuilder {
    constructor(node, ifInstruction) {
        this.node = node;
        let ifAttr = util_1.hasIfAttr(node, ifInstruction);
        if (!ifAttr)
            return;
        this.ifAttr = ifAttr;
        this.commentNode = document.createComment("");
        this.node.before(this.commentNode);
        this.node.removeAttribute(ifInstruction);
    }
    /**
     * * 只有存在if指令，其他的方法和属性才生效
     */
    get hasIfAttr() {
        return !!this.ifAttr;
    }
    get value() {
        if (this.hasIfAttr) {
            return this.ifAttr.value.trim();
        }
    }
    /**
     * * 这里使用了回调把template标签给渲染了
     * @param show
     * @param cb
     */
    checked(show) {
        if (!this.commentNode)
            return;
        if (show) {
            this.commentNode.after(this.node);
        }
        else {
            this.node.replaceWith(this.commentNode);
        }
        this.commentNode.data = this._createIfCommentData(show);
    }
    _createIfCommentData(value) {
        return `{":if": "${!!value}"}`;
    }
}
exports.BindingIfBuilder = BindingIfBuilder;
//# sourceMappingURL=binding-if-builder.js.map