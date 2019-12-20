import { ContextData } from "./context-data";
import { AjaModel } from "./aja-model";
export declare abstract class BindingBuilder {
    readonly attr: Attr;
    readonly contextData: ContextData;
    get name(): string;
    get value(): string;
    constructor(attr: Attr, contextData: ContextData);
    private get _parsePipe();
    get bindKey(): string;
    get pipeList(): string[];
    /**
     * 自动将数据使用管道过滤后返回
     */
    getPipeData<T extends any>(): T;
}
export declare class BindingAttrBuilder extends BindingBuilder {
    readonly node: HTMLElement;
    readonly attr: Attr;
    readonly contextData: ContextData;
    private get _parseAttr();
    get attrName(): string;
    get attrChild(): string | undefined;
    constructor(node: HTMLElement, attr: Attr, contextData: ContextData);
    private _formControlSetup;
    private _styleSetup;
    private _classSetup;
    private _innerHTMLSetup;
    private _otherAttrSetup;
}
export declare class BindingTextBuilder {
    readonly node: ChildNode;
    readonly contextData: ContextData;
    /**
     * * 保存插值表达式的模板，千万不要改变
     */
    text: string;
    constructor(node: ChildNode, contextData: ContextData);
    _setup(): void;
    private getPipeData;
}
export declare class BindingModelBuilder {
    readonly node: HTMLElement;
    readonly contextData: ContextData;
    input?: HTMLInputElement;
    checkbox?: HTMLInputElement;
    radio?: HTMLInputElement;
    select?: HTMLSelectElement;
    get options(): HTMLOptionElement[];
    get selectValues(): string[];
    attr?: Attr;
    constructor(node: HTMLElement, contextData: ContextData);
    setup(): void;
    private _checkboxSetup;
    private _checkboxChangeListener;
    private _radioSetup;
    private _radioChangeListener;
    private _inputSetup;
    private _inputChangeListener;
    private _selectSetup;
    private _selectChangeListener;
}
export declare class BindingIfBuilder {
    node: HTMLElement;
    /**
     * * 一个注释节点
     */
    commentNode?: Comment;
    attr?: Attr;
    constructor(node: HTMLElement);
    get value(): string;
    /**
     * * 这里使用了回调把template标签给渲染了
     * @param show
     */
    checked(show: any): void;
    private _createIfCommentData;
}
export declare class BindingEventBuilder {
    readonly node: HTMLElement;
    readonly attr: Attr;
    readonly contextData: ContextData;
    readonly actions?: {
        [name: string]: Function;
    } | undefined;
    type: string;
    funcName: string;
    constructor(node: HTMLElement, attr: Attr, contextData: ContextData, actions?: {
        [name: string]: Function;
    } | undefined);
    /**
     * 砍掉函数名
     * 去掉首尾圆括号
     * 用逗号分割参数
     * @param str
     */
    private _parseTemplateEventArgs;
    private _parseArgsToArguments;
    private _parseArgsEvent;
}
export declare class BindingForBuilder {
    node: HTMLElement;
    contextData: ContextData;
    /**
     * * 一个注释节点
     */
    private commentNode?;
    private fragment?;
    private forBuffer;
    forAttr?: Attr;
    constructor(node: HTMLElement, contextData: ContextData);
    get hasForAttr(): boolean;
    private get forAttrValue();
    get bindVar(): string;
    get bindKey(): string;
    get bindValue(): string | undefined;
    get bindData(): string | undefined;
    get isNumberData(): boolean | undefined;
    get pipes(): string[];
    /**
     * * 将所有节点插入DOM
     * @param data
     */
    draw(data: any): void;
    /**
     * * 清除所有节点
     */
    clear(): void;
    createForContextState(k: any, v?: any, isNumber?: boolean): {};
    private createForCommentData;
    createItem(): Node;
}
export declare type TemplateVariable = {
    [key: string]: ChildNode | Element | HTMLElement | AjaModel;
};
export declare class BindingTempvarBuilder {
    /**
     * * 模板变量保存的DOM
     */
    templateVariables: TemplateVariable;
    constructor(node: HTMLElement, templateVariables?: TemplateVariable);
    has(key: string): boolean;
    get(key: string): HTMLElement | Element | ChildNode | AjaModel;
    set(key: string, value: any): void;
    copyWith(node: HTMLElement): BindingTempvarBuilder;
    /**
     * * 解析模板引用变量
     * @param root
     */
    private deepParse;
    /**
     * * 处理模板变量 #input 解析
     * @param node
     * @param param1
     */
    private _tempvarBindHandle;
}
