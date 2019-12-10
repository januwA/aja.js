import { State, Actions, Computeds } from "./store";
export interface Options {
    state?: State;
    actions?: Actions;
    computeds?: Computeds;
    instructionPrefix?: string;
    templateEvent?: string;
}
declare class Aja {
    /**
     * * 模板变量保存的DOM
     */
    private _templateVariables;
    /**
     * *  指令前缀
     * [:for] [:if]
     */
    private _instructionPrefix;
    /**
     * <button (click)="setName($event)">click me</button>
     */
    private _templateEvent;
    /**
     * * :if
     */
    private get _ifInstruction();
    /**
     * * :for
     */
    private get _forInstruction();
    $store: State;
    get $actions(): any;
    constructor(view: string | HTMLElement, options: Options);
    /**
     * 扫描绑定
     * @param root
     * @param contextState
     */
    private _define;
    private _proxyState;
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
    private _getData;
    /**
     * 解析一些奇怪的插值表达式
     * {{ el['age'] }}
     * :for="(i, el) in arr" (click)="foo( 'xxx-' + el.name  )"
     * @param key
     * @param state
     */
    private _parseJsString;
    /**
     * ['obj.age', 12, false, '"   "', alert('xxx')] -> [22, 12, false, "   ", eval(<other>)]
     * @param args
     * @param e
     * @param state
     */
    private _parseArgsToArguments;
    /**
     * 处理 :if 解析
     * @param htmlElement
     * @param attrs
     */
    private _ifBindHandle;
    /**
     * 处理 [title]='xxx' 解析
     * @param htmlElement
     * @param param1
     */
    private _attrBindHandle;
    /**
     * 处理 (click)="echo('hello',$event)" 解析
     * @param htmlElement
     * @param param1
     */
    private _eventBindHandle;
    /**
     * * 处理模板变量 #input 解析
     * @param htmlElement
     * @param param1
     */
    private _tempvarBindHandle;
    /**
     * * 克隆DOM节点，默认深度克隆，绑定模板事件
     * @param htmlElement
     * @param forState
     * @param deep
     */
    private _cloneNode;
    private _bindingAttrs;
    /**
     * * 解析文本节点的插值表达式
     * @param childNode
     * @param state
     */
    private _setTextContent;
}
export default Aja;
