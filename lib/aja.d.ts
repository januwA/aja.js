import { Store } from "./store";
/**
 * state 对象
 */
export interface State {
    [key: string]: any;
}
/**
 * 事件函数对象
 */
export interface Actions {
    [key: string]: any;
}
/**
 * 计算函数
 */
export interface Computeds {
    [key: string]: Function;
}
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
    $store: Store;
    constructor(view: string | HTMLElement, options: Options);
    private _define;
    private _proxyState;
    /**
     * * 在state中寻找数据
     * * 'name' 'object.name'
     * ? 有限找模板变量的数据，再找state
     * @param key
     * @param state
     */
    private _getData;
    /**
     * ['obj.age', 12, false, '"   "', alert('xxx')] -> [22, 12, false, "   ", eval(<other>)]
     * @param args
     * @param e
     * @param state
     */
    private _parseArgsToArguments;
}
export default Aja;
