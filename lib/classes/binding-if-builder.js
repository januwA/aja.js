"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class BindingIfBuilder {
    constructor(elem, ifInstruction) {
        this.elem = elem;
        const attrs = Array.from(elem.attributes);
        let ifAttr = attrs.find(({ name }) => name === ifInstruction);
        if (!ifAttr)
            return;
        this.ifAttr = ifAttr;
        this.cm = document.createComment("");
        elem.before(this.cm);
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
    checked(show) {
        if (!this.cm)
            return;
        if (show) {
            this.cm.after(this.elem);
        }
        else {
            this.elem.replaceWith(this.cm);
        }
        this.cm.data = this._createIfCommentData(show);
    }
    _createIfCommentData(value) {
        return `{":if": "${!!value}"}`;
    }
}
exports.BindingIfBuilder = BindingIfBuilder;
//# sourceMappingURL=binding-if-builder.js.map