"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const aja_model_1 = require("./aja-model");
const util_1 = require("../utils/util");
const p_1 = require("../utils/p");
const exp_1 = require("../utils/exp");
class BindingTempvarBuilder {
    constructor(node, templateVariables = {}) {
        /**
         * * 模板变量保存的DOM
         */
        this.templateVariables = {};
        // 浅克隆
        Object.assign(this.templateVariables, templateVariables);
        this.deepParse(node);
    }
    has(key) {
        return key.toLowerCase() in this.templateVariables;
    }
    get(key) {
        return this.templateVariables[key];
    }
    set(key, value) {
        this.templateVariables[key] = value;
    }
    copyWith(node) {
        return new BindingTempvarBuilder(node, this.templateVariables);
    }
    /**
     * * 解析模板引用变量
     * @param root
     */
    deepParse(root) {
        // 如果有结构指令，则跳过
        if (!util_1.hasStructureDirective(root)) {
            util_1.toArray(root.attributes)
                .filter(({ name }) => p_1.tempvarp(name))
                .forEach(attr => {
                this._tempvarBindHandle(root, attr);
            });
            util_1.toArray(root.childNodes).forEach(itemNode => {
                if (p_1.elementNodep(itemNode))
                    this.deepParse(itemNode);
            });
        }
    }
    /**
     * * 处理模板变量 #input 解析
     * @param node
     * @param param1
     */
    _tempvarBindHandle(node, { name, value }) {
        const _key = name.replace(exp_1.tempvarExp, util_1.emptyString);
        if (value === "ajaModel") {
            // 表单元素才绑定 ajaModel
            this.set(_key, new aja_model_1.AjaModel(node));
        }
        else {
            this.set(_key, node);
        }
        node.removeAttribute(name);
    }
}
exports.BindingTempvarBuilder = BindingTempvarBuilder;
//# sourceMappingURL=binding-tempvar-builder.js.map