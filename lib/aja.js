"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("./utils/util");
const mobx_1 = require("mobx");
const p_1 = require("./utils/p");
const pipes_1 = require("./pipes");
const context_data_1 = require("./classes/context-data");
const forms_1 = require("./classes/forms");
const core_1 = require("./core");
const binding_builder_1 = require("./classes/binding-builder");
const l = console.log;
class Aja {
    constructor(view, options) {
        if (!options || !view)
            return;
        const root = util_1.createRoot(view);
        if (root === null)
            return;
        if (options.pipes)
            Object.assign(pipes_1.ajaPipes, options.pipes);
        this._proxyState(options);
        if (options.initState)
            options.initState.call(this.$store);
        const contextData = new context_data_1.ContextData({
            store: this.$store,
            tData: new binding_builder_1.BindingTempvarBuilder(root)
        });
        this._scan(root, contextData);
    }
    /**
     * 扫描绑定
     * @param root
     */
    _scan(root, contextData) {
        let depath = true;
        // 没有attrs就不解析了
        if (root.attributes && root.attributes.length) {
            // 优先解析if -> for -> 其它属性
            depath = this._parseBindIf(root, contextData);
            if (depath)
                depath = this._parseBindFor(root, contextData);
            if (depath) {
                const attrs = util_1.toArray(root.attributes);
                this._parseBindAttrs(root, attrs, contextData);
            }
        }
        const childNodes = util_1.toArray(root.childNodes);
        if (depath && childNodes.length) {
            this._bindingChildNodesAttrs(childNodes, contextData);
        }
    }
    /**
     * * 解析指定HTMLElement的属性
     * @param node
     * @param contextData
     */
    _parseBindAttrs(node, attrs, contextData) {
        for (const attr of attrs) {
            const { name } = attr;
            // [title]='xxx'
            if (p_1.attrp(name)) {
                new binding_builder_1.BindingAttrBuilder(node, attr, contextData);
                continue;
            }
            // (click)="echo('hello',$event)"
            if (p_1.eventp(name)) {
                new binding_builder_1.BindingEventBuilder(node, attr, contextData, this.$actions);
                continue;
            }
        }
        new binding_builder_1.BindingModelBuilder(node, contextData);
    }
    _proxyState(options) {
        const state = util_1.createObject(options.state);
        this.$actions = util_1.createObject(options.actions);
        if (!this.$actions)
            return;
        const bounds = {};
        Object.keys(this.$actions).forEach(ac => (bounds[ac] = mobx_1.action.bound));
        this.$store = mobx_1.observable(Object.assign(state, this.$actions), bounds, {
            deep: true
        });
    }
    /**
     * 解析一个节点上是否绑定了:if指令, 更具指令的值来解析节点
     * @param node
     * @param attrs
     */
    _parseBindIf(node, contextData) {
        let show = true;
        const ifBuilder = new binding_builder_1.BindingIfBuilder(node);
        if (ifBuilder.attr) {
            if (p_1.boolStringp(ifBuilder.value)) {
                show = ifBuilder.value === "true";
                ifBuilder.checked(show);
            }
            else {
                const [bindKey, pipeList] = util_1.parsePipe(ifBuilder.value);
                mobx_1.autorun(() => {
                    show = core_1.getData(bindKey, contextData);
                    show = pipes_1.usePipes(show, pipeList, contextData);
                    if (show) {
                        this._scan(node, contextData.copyWith({
                            tvState: contextData.tData.copyWith(node)
                        }));
                    }
                    ifBuilder.checked(show);
                });
            }
        }
        return show;
    }
    /**
     * 解析节点上绑定的for指令
     * 如果节点绑定了for指令，这个节点将不会继续被解析
     * @param node
     * @param contextData
     */
    _parseBindFor(node, contextData) {
        const forBuilder = new binding_builder_1.BindingForBuilder(node, contextData);
        if (forBuilder.hasForAttr) {
            if (forBuilder.isNumberData) {
                let _data = +forBuilder.bindData;
                _data = pipes_1.usePipes(_data, forBuilder.pipes, contextData);
                for (let v = 0; v < _data; v++) {
                    const item = forBuilder.createItem();
                    const forLet = contextData.forLet + "_";
                    this._scan(item, contextData.copyWith({
                        contextState: forBuilder.createForContextState(v),
                        tvState: contextData.tData.copyWith(node),
                        forLet: forLet
                    }));
                }
                forBuilder.draw(_data);
            }
            else {
                const _that = this;
                mobx_1.autorun(() => {
                    let _data = core_1.getData(forBuilder.bindData, contextData);
                    _data = pipes_1.usePipes(_data, forBuilder.pipes, contextData);
                    forBuilder.clear();
                    for (const k in _data) {
                        const item = forBuilder.createItem();
                        _that._scan(item, contextData.copyWith({
                            contextState: forBuilder.createForContextState(k, _data[k], false),
                            tvState: contextData.tData.copyWith(node),
                            forLet: contextData.forLet + "_"
                        }));
                    }
                    forBuilder.draw(_data);
                });
            }
        }
        return !forBuilder.hasForAttr;
    }
    /**
     * * 递归解析子节点
     * @param childNodes
     * @param contextData
     */
    _bindingChildNodesAttrs(childNodes, contextData) {
        if (!childNodes.length)
            return;
        let node = childNodes[0];
        if (p_1.elementNodep(node)) {
            this._scan(node, contextData);
        }
        if (p_1.textNodep(node)) {
            new binding_builder_1.BindingTextBuilder(node, contextData);
        }
        return this._bindingChildNodesAttrs(childNodes.slice(1), contextData);
    }
}
Aja.FormControl = forms_1.FormControl;
exports.default = Aja;
//# sourceMappingURL=aja.js.map