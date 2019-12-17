"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("../utils/util");
const const_string_1 = require("../utils/const-string");
class BindingIfBuilder {
    constructor(node) {
        this.node = node;
        let ifAttr = util_1.findIfAttr(node, const_string_1.structureDirectives.if);
        if (!ifAttr)
            return;
        this.ifAttr = ifAttr;
        this.commentNode = document.createComment("");
        this.node.before(this.commentNode);
        this.node.removeAttribute(const_string_1.structureDirectives.if);
    }
    get value() {
        var _a;
        return ((_a = this.ifAttr) === null || _a === void 0 ? void 0 : _a.value.trim()) || "";
    }
    /**
     * * 这里使用了回调把template标签给渲染了
     * @param show
     */
    checked(show, cb) {
        if (!this.commentNode)
            return;
        if (show) {
            this.commentNode.after(this.node);
            cb();
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