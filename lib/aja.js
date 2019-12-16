"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("./utils/util");
const store_1 = require("./store");
const exp_1 = require("./utils/exp");
const binding_if_builder_1 = require("./classes/binding-if-builder");
const binding_for_builder_1 = require("./classes/binding-for-builder");
const binding_text_builder_1 = require("./classes/binding-text-builder");
const aja_model_1 = require("./classes/aja-model");
const p_1 = require("./utils/p");
const binding_model_builder_1 = require("./classes/binding-model-builder");
const pipes_1 = require("./pipes/pipes");
const l = console.log;
class Aja {
    constructor(view, options) {
        /**
         * * 模板变量保存的DOM
         */
        this._templateVariables = {};
        /**
         * *  指令前缀
         * [:for] [:if]
         */
        this._instructionPrefix = ":";
        /**
         * <button (click)="setName($event)">click me</button>
         */
        this._templateEvent = "$event";
        /**
         * * 双向绑定指令
         */
        this._modeldirective = "[(model)]";
        const root = util_1.createRoot(view);
        if (root === null)
            return;
        if (options.instructionPrefix)
            this._instructionPrefix = options.instructionPrefix.toLowerCase();
        if (options.templateEvent)
            this._templateEvent = options.templateEvent;
        if (options.modeldirective)
            this._modeldirective = options.modeldirective.toLowerCase();
        if (options.pipes)
            Object.assign(pipes_1.pipes, options.pipes);
        this._proxyState(options);
        if (options.initState)
            options.initState.call(this.$store);
        this._define(root, this.$store);
    }
    /**
     * * :if
     */
    get _ifInstruction() {
        return this._instructionPrefix + "if";
    }
    /**
     * * :for
     */
    get _forInstruction() {
        return this._instructionPrefix + "for";
    }
    get $actions() {
        return this.$store.$actions;
    }
    /**
     * 扫描绑定
     * @param root
     */
    _define(root, state) {
        let depath = true;
        // 没有attrs就不解析了
        if (root.attributes && root.attributes.length) {
            // 优先解析if -> for -> 其它属性
            depath = this._parseBindIf(root, state);
            if (depath)
                depath = this._parseBindFor(root, state);
            if (depath) {
                const attrs = util_1.toArray(root.attributes);
                this._parseBindAttrs(root, attrs, state);
            }
        }
        const children = Array.from(root.childNodes);
        if (depath && children.length) {
            this._bindingChildrenAttrs(children, state);
        }
    }
    /**
     * * 解析指定HTMLElement的属性
     * @param node
     * @param state
     */
    _parseBindAttrs(node, attrs, state) {
        for (const attr of attrs) {
            const { name } = attr;
            // #input #username
            if (p_1.tempvarp(name)) {
                this._tempvarBindHandle(node, attr);
                continue;
            }
            // [title]='xxx'
            if (p_1.attrp(name)) {
                this._attrBindHandle(node, attr, state);
                continue;
            }
            // (click)="echo('hello',$event)"
            if (p_1.eventp(name)) {
                this._eventBindHandle(node, attr, state);
                continue;
            }
        }
        // 其它属性解析完，在解析双向绑定
        const modelAttr = util_1.hasModelAttr(node, this._modeldirective);
        if (modelAttr) {
            const model = new binding_model_builder_1.BindingModelBuilder(node, modelAttr);
            const { value } = modelAttr;
            if (p_1.inputp(node) || p_1.textareap(node)) {
                if (model.checkbox && p_1.checkboxp(model.checkbox)) {
                    const data = this._getData(value, state);
                    // 这个时候的data如果是array, 就对value进行处理
                    // 不然就当作bool值处理
                    const isArrayData = p_1.arrayp(data);
                    store_1.reaction(() => [this._getData(value, state)], states => {
                        model.checkboxSetup(states, isArrayData);
                    });
                    model.checkboxChangeListener(isArrayData, data, newValue => {
                        this._setDate(value, newValue, state);
                    });
                }
                else if (model.radio && p_1.radiop(model.radio)) {
                    // 单选按钮
                    store_1.reaction(() => [this._getData(value, state)], states => {
                        model.radioSetup(states);
                    });
                    model.radioChangeListener(newValue => {
                        this._setDate(value, newValue, state);
                    });
                }
                else {
                    // 其它
                    store_1.reaction(() => [this._getData(value, state)], states => {
                        model.inputSetup(states);
                    });
                    model.inputChangeListener(newValue => {
                        this._setDate(value, newValue, state);
                    });
                }
            }
            else if (p_1.selectp(node)) {
                setTimeout(() => {
                    store_1.reaction(() => [this._getData(value, state)], states => {
                        model.selectSetup(states);
                    });
                });
                model.selectChangeListener(newValue => {
                    this._setDate(value, newValue, state);
                });
            }
        }
    }
    _proxyState(options) {
        const state = util_1.createObject(options.state);
        const computeds = util_1.createObject(options.computeds);
        const actions = util_1.createObject(options.actions);
        this.$store = new store_1.Store({ state, computeds, actions });
    }
    /**
     * * 1. 优先寻找模板变量
     * * 2. 在传入的state中寻找
     * * 3. 在this.$store中找
     * * 'name' 'object.name'
     * ? 优先找模板变量的数据，再找state
     * ? 虽然返回的是any， 但是这个函数不会返回 undefined
     * @param key
     * @param state
     */
    _getData(key, state) {
        if (typeof key !== "string")
            return null;
        // 抽掉所有空格，再把管道排除
        const [bindKey, pipeList] = util_1.parsePipe(key);
        // 在解析绑定的变量
        const bindKeys = bindKey.split(".");
        let _result;
        const firstKey = bindKeys[0];
        // 模板变量
        if (firstKey.toLowerCase() in this._templateVariables) {
            // 绑定的模板变量，全是小写
            const lowerKeys = bindKeys.map(k => k.toLowerCase());
            for (const k of lowerKeys) {
                _result = _result ? _result[k] : this._templateVariables[k];
            }
        }
        // state
        if (_result === undefined) {
            if (firstKey in state) {
                for (const k of bindKeys) {
                    _result = _result ? _result[k] : state[k];
                }
            }
        }
        // this.$store
        if (_result === undefined && state !== this.$store) {
            if (firstKey in this.$store) {
                for (const k of bindKeys) {
                    _result = _result ? _result[k] : this.$store[k];
                }
            }
        }
        if (_result === undefined) {
            // 没救了， eval随便解析返回个值吧!
            _result = this._parseJsString(bindKey, state);
        }
        return _result;
    }
    /**
     * 设置新数据，现在暂时在双向绑定的时候使用新数据, 数据来源于state
     * @param key
     * @param newValue
     * @param state
     */
    _setDate(key, newValue, state) {
        if (typeof key !== "string")
            return null;
        const keys = key.split(".");
        const keysSize = keys.length;
        if (!keysSize)
            return;
        const firstKey = keys[0];
        let _result;
        if (keysSize === 1 && firstKey in state) {
            state[firstKey] = newValue;
            return;
        }
        for (let index = 0; index < keysSize - 1; index++) {
            const k = keys[index];
            _result = _result ? _result[k] : state[k];
        }
        if (_result) {
            const lastKey = keys[keysSize - 1];
            _result[lastKey] = newValue;
            return;
        }
        this._parseJsString(key, state, true, newValue);
    }
    /**
     * 解析一些奇怪的插值表达式
     * {{ el['age'] }}
     * :for="(i, el) in arr" (click)="foo( 'xxx-' + el.name  )"
     * @param key
     * @param state
     * @param setState
     */
    _parseJsString(key, state, setState = false, newValue = "") {
        try {
            return util_1.ourEval(`return ${key}`);
        }
        catch (er) {
            // 利用错误来抓取变量
            const msg = er.message;
            if (msg.includes("is not defined")) {
                const match = msg.match(/(.*) is not defined/);
                if (!match)
                    return util_1.emptyString;
                const varName = match[1];
                const context = this._getData(varName, state);
                if (setState) {
                    const funBody = key.replace(new RegExp(`\\b${varName}`, "g"), "this") +
                        `='${newValue}'`;
                    util_1.ourEval.call(context, `${funBody}`);
                }
                else {
                    const funBody = key.replace(new RegExp(`\\b${varName}`, "g"), "this");
                    let _result = util_1.ourEval.call(context, `return ${funBody}`);
                    if (_result === undefined)
                        _result = util_1.emptyString;
                    return _result;
                }
            }
            else {
                console.error(er);
                throw er;
            }
        }
    }
    /**
     * ['obj.age', 12, false, '"   "', alert('xxx')] -> [22, 12, false, "   ", eval(<other>)]
     * @param args
     * @param e
     * @param state
     * @param isModel 是否为展开的双向绑定事件  [(model)]="name" (modelChange)="nameChange($event)"
     */
    _parseArgsToArguments(args, e, state, isModel = false) {
        return args.map(arg => {
            if (!arg)
                return arg;
            let el = arg.trim();
            if (el === this._templateEvent) {
                let _result;
                if (isModel) {
                    if (e.target) {
                        _result = e.target.value;
                    }
                }
                else {
                    _result = e;
                }
                return _result;
            }
            return this._getData(el, state);
        });
    }
    /**
     * 解析一个节点上是否绑定了:if指令, 更具指令的值来解析节点
     * @param node
     * @param attrs
     */
    _parseBindIf(node, state) {
        let show = true;
        const ifBuilder = new binding_if_builder_1.BindingIfBuilder(node, this._ifInstruction);
        if (ifBuilder.hasIfAttr) {
            const value = ifBuilder.value;
            if (p_1.boolStringp(value)) {
                show = value === "true";
                ifBuilder.checked(show);
            }
            else {
                const [bindKey, pipeList] = util_1.parsePipe(value);
                store_1.reaction(() => [this._getData(bindKey, state)], states => {
                    show = states[0];
                    show = pipes_1.usePipes(show, pipeList, key => this._getData(key, state));
                    ifBuilder.checked(show, () => {
                        this._define(node, state);
                    });
                });
            }
        }
        return show;
    }
    /**
     * 解析节点上绑定的for指令
     * 如果节点绑定了for指令，这个节点将不会继续被解析
     * @param node
     * @param state
     */
    _parseBindFor(node, state) {
        const forBuilder = new binding_for_builder_1.BindingForBuilder(node, this._forInstruction);
        if (forBuilder.hasForAttr) {
            if (forBuilder.isNumberData) {
                let _data = +forBuilder.bindData;
                _data = pipes_1.usePipes(_data, forBuilder.pipes, key => this._getData(key, state));
                for (let v = 0; v < _data; v++) {
                    const forState = forBuilder.createForContextState(v);
                    const item = forBuilder.createItem();
                    this._define(item, forState);
                }
                forBuilder.draw(_data);
            }
            else {
                const _that = this;
                store_1.reaction(() => [this._getData(forBuilder.bindData, state)], states => {
                    let _data = states[0];
                    _data = pipes_1.usePipes(_data, forBuilder.pipes, key => this._getData(key, state));
                    forBuilder.clear();
                    let keys;
                    if (p_1.arrayp(_data))
                        keys = Object.keys(_data);
                    else
                        keys = _data;
                    for (const k in keys) {
                        const forState = forBuilder.createForContextState(k, _data[k], false);
                        const item = forBuilder.createItem();
                        _that._define(item, forState);
                    }
                    forBuilder.draw(_data);
                });
            }
        }
        return !forBuilder.hasForAttr;
    }
    /**
     * 处理 [title]='xxx' 解析
     * @param node
     * @param param1
     */
    _attrBindHandle(node, { name, value }, state) {
        // [style.coloe] => [style, coloe]
        let [attrName, attrChild] = name
            .replace(exp_1.attrStartExp, util_1.emptyString)
            .replace(exp_1.attrEndExp, util_1.emptyString)
            .split(".");
        const [bindKey, pipeList] = util_1.parsePipe(value);
        // reaction(
        //   () => [this._getData(bindKey, state)],
        //   states => {
        //     let data = states[0];
        //     data = usePipes(data, pipeList, arg => this._getData(arg, state));
        //     let _value = data;
        //     switch (attrName) {
        //       case "style":
        //         if (attrChild && attrChild in node.style) {
        //           (node.style as { [k: string]: any })[attrChild] = data;
        //         } else {
        //           const styles: CSSStyleDeclaration = data;
        //           for (const key in styles) {
        //             if (
        //               Object.getOwnPropertyDescriptor(node.style, key) &&
        //               styles[key]
        //             ) {
        //               reaction(
        //                 () => [styles[key]],
        //                 states => {
        //                   node.style[key] = states[0];
        //                 }
        //               );
        //             }
        //           }
        //         }
        //         break;
        //       case "class":
        //         if (_value === null) _value = emptyString;
        //         if (!attrChild) {
        //           if (objectp(_value)) {
        //             for (const klass in _value) {
        //               if (_value[klass]) node.classList.add(klass);
        //               else node.classList.remove(klass);
        //             }
        //           } else {
        //             node.setAttribute("class", _value);
        //           }
        //         } else {
        //           if (_value) node.classList.add(attrChild);
        //         }
        //         break;
        //       case "html":
        //         if (data !== node.innerHTML) node.innerHTML = data;
        //         break;
        //       default:
        //         if (_value === null) _value = emptyString;
        //         if (_value) {
        //           if (node.getAttribute(attrName) !== _value) {
        //             node.setAttribute(attrName, _value);
        //           }
        //         } else {
        //           if (node.hasAttribute(attrName)) node.removeAttribute(attrName);
        //         }
        //         break;
        //     }
        //   }
        // );
        store_1.autorun(() => {
            let data = this._getData(bindKey, state);
            data = pipes_1.usePipes(data, pipeList, arg => this._getData(arg, state));
            let _value = data;
            switch (attrName) {
                case "style":
                    l(data);
                    if (attrChild && attrChild in node.style) {
                        node.style[attrChild] = data;
                    }
                    else {
                        const styles = data;
                        for (const key in styles) {
                            if (Object.getOwnPropertyDescriptor(node.style, key) &&
                                styles[key]) {
                                if (styles[key] !== node.style[key])
                                    node.style[key] = styles[key];
                            }
                        }
                    }
                    break;
                case "class":
                    if (_value === null)
                        _value = util_1.emptyString;
                    if (!attrChild) {
                        if (p_1.objectp(_value)) {
                            for (const klass in _value) {
                                if (_value[klass])
                                    node.classList.add(klass);
                                else
                                    node.classList.remove(klass);
                            }
                        }
                        else {
                            node.setAttribute("class", _value);
                        }
                    }
                    else {
                        if (_value)
                            node.classList.add(attrChild);
                    }
                    break;
                case "html":
                    if (data !== node.innerHTML)
                        node.innerHTML = data;
                    break;
                default:
                    if (_value === null)
                        _value = util_1.emptyString;
                    if (_value) {
                        if (node.getAttribute(attrName) !== _value) {
                            node.setAttribute(attrName, _value);
                        }
                    }
                    else {
                        if (node.hasAttribute(attrName))
                            node.removeAttribute(attrName);
                    }
                    break;
            }
        });
        node.removeAttribute(name);
    }
    /**
     * 处理 (click)="echo('hello',$event)" 解析
     * @param htmlElement
     * @param param1
     */
    _eventBindHandle(htmlElement, { name, value }, state) {
        let eventName = name
            .replace(exp_1.eventStartExp, util_1.emptyString)
            .replace(exp_1.eventEndExp, util_1.emptyString);
        // 函数名
        let funcName = value;
        // 函数参数
        let args = [];
        if (value.includes("(")) {
            // 带参数的函数
            const index = value.indexOf("(");
            funcName = value.substr(0, index);
            args = util_1.parseTemplateEventArgs(value);
        }
        const modelChangep = eventName === "modelchange";
        if (modelChangep)
            eventName = "input";
        htmlElement.addEventListener(eventName, e => {
            //? 每次点击都需解析参数?
            //! 如果只解析一次，那么模板变量需要提前声明, 并且模板变量不会更新!
            if (this.$actions && funcName in this.$actions) {
                this.$actions[funcName].apply(this.$store, this._parseArgsToArguments(args, e, state, modelChangep));
            }
        });
        htmlElement.removeAttribute(name);
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
            this._templateVariables[_key] = new aja_model_1.AjaModel(node);
        }
        else {
            this._templateVariables[_key] = node;
        }
        node.removeAttribute(name);
    }
    /**
     * * 克隆DOM节点，默认深度克隆，绑定模板事件
     * @param htmlElement
     * @param forState
     * @param deep
     */
    _cloneNode(htmlElement, forState, deep = true) {
        const item = htmlElement.cloneNode(deep);
        const forElementAttrs = Array.from(htmlElement.attributes);
        const eventAttrs = forElementAttrs.filter(e => p_1.eventp(e.name));
        if (eventAttrs.length) {
            for (const eventAttr of eventAttrs) {
                this._eventBindHandle(item, eventAttr, forState);
            }
        }
        return item;
    }
    /**
     * * 递归解析子节点
     * @param childNodes
     * @param state
     */
    _bindingChildrenAttrs(children, state) {
        if (!children.length)
            return;
        let node = children[0];
        if (p_1.elementNodep(node)) {
            this._define(node, state);
        }
        if (p_1.textNodep(node)) {
            this._setTextContent(node, state);
        }
        return this._bindingChildrenAttrs(children.slice(1), state);
    }
    /**
     * * 解析文本节点的插值表达式
     * @param childNode
     * @param state
     */
    _setTextContent(childNode, state) {
        const textBuilder = new binding_text_builder_1.BindingTextBuilder(childNode);
        if (!textBuilder.needParse)
            return;
        store_1.autorun(() => {
            textBuilder.setText(key => this._getData(key, state));
        });
    }
}
exports.default = Aja;
//# sourceMappingURL=aja.js.map