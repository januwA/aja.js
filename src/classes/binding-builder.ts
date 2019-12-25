import { ContextData } from "./context-data";
import { getData, setData } from "../core";
import { usePipes } from "../pipes";

import { FormControl, FormGroup } from "./forms";
import { FormControlSerivce } from "../service/form-control.service";
import { attrStartExp, attrEndExp, interpolationExpressionExp, eventStartExp, eventEndExp, tempvarExp } from "../utils/exp";
import { emptyString, findIfAttr, findForAttr, hasStructureDirective } from "../utils/util";
import { autorun } from "mobx";
import { AjaModel } from "./aja-model";
import {
    toArray,
    getCheckboxRadioValue,
    findModelAttr,
    parsePipe
} from "../utils/util";
import {
    radiop,
    selectp,
    textareap,
    inputp,
    checkboxp,
    arrayp, objectp, numberStringp, elementNodep, tempvarp, formp
} from "../utils/p";
import { EventType, modelDirective, formControlAttrName, structureDirectives, templateEvent, modelChangeEvent, ajaModelString, formGroupAttrName, formControlNameAttrName, formGroupNameAttrName, formArrayNameAttrName } from "../utils/const-string";

const l = console.log;

export abstract class BindingBuilder {
    get name(): string {
        return this.attr.name;
    }
    get value() {
        return this.attr.value;
    }
    constructor(
        public readonly attr: Attr,
        public readonly contextData: ContextData,
    ) {

    }

    private get _parsePipe() {
        return parsePipe(this.attr.value);
    }

    get bindKey(): string {
        return this._parsePipe[0];
    }

    get pipeList(): string[] {
        return this._parsePipe[1];
    }

    /**
     * 自动将数据使用管道过滤后返回
     */
    getPipeData<T extends any>(): T {
        return usePipes(getData(this.bindKey, this.contextData), this.pipeList, this.contextData);
    }
}


export class BindingAttrBuilder extends BindingBuilder {
    // [style.coloe] => [style, coloe]
    private get _parseAttr() {
        return this.name
            .replace(attrStartExp, emptyString)
            .replace(attrEndExp, emptyString)
            .split(".");
    }

    get attrName(): string {
        return this._parseAttr[0];
    }

    get attrChild(): string | undefined {
        return this._parseAttr[1];
    }


    constructor(
        public readonly node: HTMLElement,
        public readonly attr: Attr,
        public readonly contextData: ContextData,
    ) {
        super(attr, contextData);
        if (this.name === formControlAttrName) {
            // [formControl]
            this._formControlSetup();
        } else if (this.name === formGroupAttrName && formp(this.node)) {
            // [formGroup]
            const formGroup = getData(this.value, this.contextData)
            new FormControlSerivce(this.node, formGroup);
            contextData.formGroup = formGroup;
        } else if (this.name === formControlNameAttrName) {
            // [formControlName]
            if (contextData.formGroup && this.value in contextData.formGroup.controls) {
                const formControl = contextData.formGroup.controls[this.value];
                new FormControlSerivce(this.node, formControl);
            }
        } else if (this.name === formGroupNameAttrName) {
            // [formGroupName]
            if (contextData.formGroup && this.value in contextData.formGroup.controls) {
                const formGroup = contextData.formGroup.controls[this.value];
                new FormControlSerivce(this.node, formGroup);
                contextData.formGroup = formGroup as FormGroup;
            }
        } else if (this.name === formArrayNameAttrName) {
            // [formArrayName]
            if (contextData.formGroup && this.value in contextData.formGroup.controls) {
                const formArray = contextData.formGroup.controls[this.value];
                new FormControlSerivce(this.node, formArray);
            }
        } else {
            switch (this.attrName) {
                case "style":
                    this._styleSetup();
                    break;
                case "class":
                    this._classSetup();
                    break;
                case "html":
                    this._innerHTMLSetup();
                    break;
                default:
                    this._otherAttrSetup();
                    break;
            }
        }
        node.removeAttribute(this.name);
    }

    private _formControlSetup() {
        const formControl: FormControl = getData(this.value, this.contextData);
        new FormControlSerivce(this.node, formControl);
    }

    private _styleSetup() {
        autorun(() => {
            let data = this.getPipeData();
            if (this.attrChild && this.attrChild in this.node.style) {
                (this.node.style as { [k: string]: any })[this.attrChild] = data;
            } else {
                const styles: CSSStyleDeclaration = data;
                for (const key in styles) {
                    if (Object.getOwnPropertyDescriptor(this.node.style, key)) {
                        this.node.style[key] = styles[key];
                    }
                }
            }
        });
    }

    private _classSetup() {
        autorun(() => {
            let data = this.getPipeData();
            if (data === null) data = emptyString;
            if (!this.attrChild) {
                if (objectp(data)) {
                    for (const klass in data) {
                        if (data[klass]) this.node.classList.add(klass);
                        else this.node.classList.remove(klass);
                    }
                } else {
                    this.node.setAttribute(this.attrName, data);
                }
            } else {
                if (data) this.node.classList.add(this.attrChild);
            }
        });
    }

    private _innerHTMLSetup() {
        autorun(() => {
            this.node.innerHTML = this.getPipeData();
        });
    }

    private _otherAttrSetup() {
        autorun(() => {
            let data = this.getPipeData();
            if (data === null) data = emptyString;
            if (data) {
                this.node.setAttribute(this.attrName, data);
            } else {
                this.node.removeAttribute(this.attrName);
            }
        });
    }
}


export class BindingTextBuilder {
    /**
     * * 保存插值表达式的模板，千万不要改变
     */
    public text: string;

    constructor(
        public readonly node: ChildNode,
        public readonly contextData: ContextData,
    ) {

        this.text = node.textContent || "";
        this._setup();
    }

    _setup() {
        if (!interpolationExpressionExp.test(this.text)) return;
        autorun(() => {
            const text = this.text.replace(interpolationExpressionExp, (match, g1) => {
                const pipeData = this.getPipeData(g1);
                return pipeData;
            });
            this.node.textContent = text;
        });
    }

    private getPipeData(key: string) {
        const [bindKey, pipeList] = parsePipe(key);
        return usePipes(getData(bindKey, this.contextData), pipeList, this.contextData)
    }
}


export class BindingModelBuilder {
    // input / textarea
    input?: HTMLInputElement;
    checkbox?: HTMLInputElement;
    radio?: HTMLInputElement;
    select?: HTMLSelectElement;

    get options(): HTMLOptionElement[] {
        if (!this.select) return [];
        return toArray(this.select.options);
    }

    get selectValues(): string[] {
        return this.options.filter(op => op.selected).map(op => op.value);
    }

    attr?: Attr;

    constructor(
        public readonly node: HTMLElement,
        public readonly contextData: ContextData,
    ) {
        this.attr = findModelAttr(node, modelDirective);
        if (!this.attr) return;

        this.node.removeAttribute(this.attr!.name);
        this.setup();
    }

    setup() {
        if (!this.attr || !this.attr.value) return;
        if (inputp(this.node) || textareap(this.node)) {
            if (checkboxp(this.node)) {
                this.checkbox = this.node as HTMLInputElement;
                const data = getData(this.attr.value, this.contextData);
                autorun(() => {
                    this._checkboxSetup(data);
                });
                this._checkboxChangeListener(data, this.contextData);
            } else if (radiop(this.node)) {
                this.radio = this.node;
                autorun(() => {
                    this._radioSetup(getData(this.attr!.value, this.contextData));
                });

                this._radioChangeListener(this.contextData);
            } else {
                // this.input = this.node;
                autorun(() => {
                    this._inputSetup(getData(this.attr!.value, this.contextData));
                });
                this._inputChangeListener(this.contextData);
            }
        } else if (selectp(this.node)) {
            this.select = this.node as HTMLSelectElement;
            setTimeout(() => {
                autorun(() => {
                    this._selectSetup(getData(this.attr!.value, this.contextData));
                });
            });

            this._selectChangeListener(this.contextData);
        }

        AjaModel.classListSetup(this.node);

        // 控件被访问了
        // 所有绑定的model的元素，都会添加这个服务
        this.node.addEventListener(EventType.blur, () =>
            AjaModel.touched(this.node)
        );
    }

    private _checkboxSetup(data: any) {
        if (this.checkbox) {
            // array 处理数组，否则处理boolean值
            if (arrayp(data)) {
                let ivalue = getCheckboxRadioValue(this.checkbox);
                const checkde = data.some((d: any) => d === ivalue);
                this.checkbox.checked = checkde;
            } else {
                this.checkbox.checked = !!data;
            }
        }
    }

    private _checkboxChangeListener(data: any, contextData: ContextData) {
        if (this.checkbox) {
            this.checkbox.addEventListener(EventType.change, () => {
                if (!this.checkbox) return;
                if (arrayp(data)) {
                    let ivalue = getCheckboxRadioValue(this.checkbox);
                    if (this.checkbox.checked) data.push(ivalue);
                    else (data as {
                        [remove: string]: any
                    }).remove(ivalue);
                } else {
                    if (this.attr)
                        setData(this.attr.value, this.checkbox.checked, contextData);
                }
                AjaModel.valueChange(this.checkbox);
            });
        }
    }

    private _radioSetup(states: any[]) {
        if (this.radio) {
            this.radio.checked = states[0] === this.radio.value;
        }
    }

    private _radioChangeListener(contextData: ContextData) {
        if (this.radio) {
            this.radio.addEventListener(EventType.change, () => {
                if (!this.radio) return;
                let newData = getCheckboxRadioValue(this.radio);
                this.radio.checked = true;
                AjaModel.valueChange(this.radio);
                if (this.attr) setData(this.attr.value, newData, contextData);
            });
        }
    }

    private _inputSetup(value: any) {
        if (this.input) {
            this.input.value = value;
        }
    }

    private _inputChangeListener(contextData: ContextData) {
        if (this.input) {
            // 值发生变化了
            this.input.addEventListener(EventType.input, () => {
                if (this.input && this.attr) {
                    AjaModel.valueChange(this.input);
                    AjaModel.checkValidity(this.input);
                    setData(this.attr.value, this.input.value, contextData);
                }
            });
        }
    }

    private _selectSetup(states: any[]) {
        if (this.select) {
            const data = states[0];
            const selectOptions = toArray(this.select.options);
            // 多选参数必须为 array
            if (this.select.multiple && arrayp(data)) {
                let notFind = true;
                this.select.selectedIndex = -1;
                this.options.forEach(option => {
                    if (data.some((d: any) => d === option.value)) {
                        notFind = false;
                        option.selected = true;
                    }
                });
                if (notFind) this.select.selectedIndex = -1;
            } else {
                // 没找到默认-1
                const index = selectOptions.findIndex(op => op.value === data);
                this.select.selectedIndex = index;
            }
        }
    }

    private _selectChangeListener(contextData: ContextData) {
        if (this.select) {
            this.select.addEventListener(EventType.change, () => {
                if (this.select && this.attr) {
                    const bindKey = this.attr.value;
                    if (this.select.multiple) {
                        setData(bindKey, this.selectValues, contextData);
                    } else {
                        setData(bindKey, this.select.value, contextData);
                    }
                    AjaModel.valueChange(this.select);
                }
            });
        }
    }
}


export class BindingIfBuilder {
    /**
     * * 一个注释节点
     */
    commentNode?: Comment;

    attr?: Attr;

    constructor(public node: HTMLElement) {
        let ifAttr = findIfAttr(node, structureDirectives.if);
        if (!ifAttr) return;
        this.attr = ifAttr;
        this.commentNode = document.createComment("");
        this.node.before(this.commentNode);
        this.node.removeAttribute(structureDirectives.if);
    }

    get value(): string {
        return this.attr?.value.trim() || "";
    }

    /**
     * * 这里使用了回调把template标签给渲染了
     * @param show
     */
    checked(show: any) {
        if (!this.commentNode) return;
        if (show) {
            this.commentNode.after(this.node);
        } else {
            this.node.replaceWith(this.commentNode);
        }
        this.commentNode.data = this._createIfCommentData(show);
    }

    private _createIfCommentData(value: any): string {
        return `{":if": "${!!value}"}`;
    }
}


export class BindingEventBuilder {
    public type: string;
    public funcName: string;

    constructor(
        public readonly node: HTMLElement,
        public readonly attr: Attr,
        public readonly contextData: ContextData,
        public readonly actions?: {
            [name: string]: Function;
        }) {
        this.type = attr.name.replace(eventStartExp, emptyString)
            .replace(eventEndExp, emptyString);

        this.funcName = attr.value;

        let args: string[] = [];
        if (this.attr.value.includes("(")) {
            // 带参数的函数
            const index = this.attr.value.indexOf("(");
            // 砍出函数名
            this.funcName = this.attr.value.substr(0, index);
            args = this._parseTemplateEventArgs(this.attr.value);
        }

        const modelChangep: boolean = name === modelChangeEvent;
        if (modelChangep) this.type = EventType.input;

        if (this.actions && this.funcName in this.actions) {
            // 每次只需把新的event传入就行了
            node.addEventListener(this.type, e => {
                if (!this.actions) return;

                //? 每次事件响应都解析，确保变量更改能够得到新数据
                //? 如果放在外面，则不会响应新数据
                const transitionArgs = this._parseArgsToArguments(args);
                this.actions[this.funcName].apply(
                    this.contextData.store,
                    this._parseArgsEvent(
                        transitionArgs,
                        modelChangep ? (e.target as HTMLInputElement).value : e
                    )
                );
            });
        }

        node.removeAttribute(name);
    }


    /**
     * 砍掉函数名
     * 去掉首尾圆括号
     * 用逗号分割参数
     * @param str
     */
    private _parseTemplateEventArgs(str: string): string[] {
        const index = str.indexOf("(");
        return str
            .substr(index)
            .trim()
            .replace(/(^\(*)|(\)$)/g, emptyString)
            .split(",");
    }

    private _parseArgsToArguments(args: string[]) {
        return args.map(arg => {
            if (!arg) return arg;
            let el = arg.trim().toLowerCase();
            if (el === templateEvent) return el;
            return getData(el, this.contextData);
        });
    }

    private _parseArgsEvent(args: string[], e: any) {
        return args.map(arg => (arg === templateEvent) ? e : arg);
    }
}


export class BindingForBuilder {
    /**
     * * 一个注释节点
     */
    private commentNode?: Comment;

    private fragment?: DocumentFragment;
    private forBuffer: Node[] = [];

    forAttr?: Attr;

    constructor(public node: HTMLElement, public contextData: ContextData) {
        let forAttr = findForAttr(node, structureDirectives.for);
        // 没有for指令，就不构建下去了
        if (!forAttr) return;
        this.forAttr = forAttr;
        this.commentNode = document.createComment("");
        this.fragment = document.createDocumentFragment();
        node.replaceWith(this.commentNode);
        node.removeAttribute(structureDirectives.for);
    }

    get hasForAttr() {
        return !!this.forAttr;
    }

    private get forAttrValue():
        | {
            variable: string;
            variables: string[];
            bindData: string;
            pipes: string[];
        }
        | undefined {
        if (!this.forAttr) return;
        let [variable, bindKey] = this.forAttr.value
            .split(/\bin|of\b/)
            .map(s => s.trim());

        let variables: string[] = [];
        if (variable) {
            variables = variable
                .trim()
                .replace(eventStartExp, emptyString)
                .replace(eventEndExp, emptyString)
                .split(",")
                .map(v => v.trim());
        }
        const p = parsePipe(bindKey);
        return {
            variable,
            variables,
            bindData: p[0],
            pipes: p[1]
        };
    }

    get bindVar(): string {
        return this.forAttrValue!.variable || this.contextData.forLet;
    }
    get bindKey(): string {
        return this.forAttrValue!.variables[0] || this.contextData.forLet;
    }
    get bindValue(): string | undefined {
        if (this.hasForAttr) {
            return this.forAttrValue!.variables[1];
        }
    }
    get bindData(): string | undefined {
        if (this.hasForAttr) {
            return this.forAttrValue!.bindData;
        }
    }
    get isNumberData(): boolean | undefined {
        if (this.hasForAttr) {
            return numberStringp(this.bindData as string);
        }
    }
    get pipes(): string[] {
        if (this.hasForAttr) {
            return this.forAttrValue?.pipes || [];
        } else {
            return [];
        }
    }

    /**
     * * 将所有节点插入DOM
     * @param data
     */
    draw(data: any) {
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
            (forItem as HTMLElement).remove();
        }
        this.forBuffer = [];
    }

    createForContextState(k: any, v: any = null, isNumber: boolean = true): {} {
        const forState: { [k: string]: any } = {};
        if (isNumber) {
            forState[this.bindVar] = k;
        } else {
            if (this.bindKey && this.bindValue) {
                forState[this.bindKey] = k;
                forState[this.bindValue] = v;
            } else if (this.bindKey) {
                forState[this.bindKey] = v;
            }
        }
        return forState;
    }

    private createForCommentData(obj: any): string {
        let data = obj;
        if (arrayp(data)) {
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


export type TemplateVariable = {
    [key: string]: ChildNode | Element | HTMLElement | AjaModel;
}

export class BindingTempvarBuilder {
    /**
     * * 模板变量保存的DOM
     */
    templateVariables: TemplateVariable = {};

    constructor(
        node: HTMLElement,
        templateVariables: TemplateVariable = {}
    ) {
        // 浅克隆
        Object.assign(this.templateVariables, templateVariables);
        this.deepParse(node);
    }

    has(key: string): boolean {
        return key.toLowerCase() in this.templateVariables;
    }

    get(key: string) {
        return this.templateVariables[key];
    }

    set(key: string, value: any) {
        this.templateVariables[key] = value;
    }

    copyWith(node: HTMLElement): BindingTempvarBuilder {
        return new BindingTempvarBuilder(node, this.templateVariables);
    }

    /**
     * * 解析模板引用变量
     * @param root
     */
    private deepParse(root: HTMLElement) {
        // 如果有结构指令，则跳过
        if (!hasStructureDirective(root)) {
            toArray(root.attributes)
                .filter(({ name }) => tempvarp(name))
                .forEach(attr => {
                    this._tempvarBindHandle(root, attr);
                });

            toArray(root.childNodes).forEach(itemNode => {
                if (elementNodep(itemNode)) this.deepParse(itemNode as HTMLElement);
            });
        }
    }

    /**
     * * 处理模板变量 #input 解析
     * @param node
     * @param param1
     */
    private _tempvarBindHandle(node: HTMLElement, { name, value }: Attr): void {
        const _key = name.replace(tempvarExp, emptyString);
        if (value === ajaModelString) {
            // 表单元素才绑定 ajaModel
            this.set(_key, new AjaModel(node as HTMLInputElement));
        } else {
            this.set(_key, node);
        }
        node.removeAttribute(name);
    }
}
