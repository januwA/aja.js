import { OptionsInterface } from "./interfaces/interfaces";
declare class Aja {
    $store?: any;
    $actions?: {
        [name: string]: Function;
    };
    constructor(view?: string | HTMLElement, options?: OptionsInterface);
    /**
     * 扫描绑定
     * @param root
     */
    private _define;
    /**
     * * 解析指定HTMLElement的属性
     * @param node
     * @param contextData
     */
    private _parseBindAttrs;
    private _proxyState;
    /**
     * 解析一个节点上是否绑定了:if指令, 更具指令的值来解析节点
     * @param node
     * @param attrs
     */
    private _parseBindIf;
    /**
     * 解析节点上绑定的for指令
     * 如果节点绑定了for指令，这个节点将不会继续被解析
     * @param node
     * @param contextData
     */
    private _parseBindFor;
    /**
     * 处理 [title]='xxx' 解析
     * @param node
     * @param param1
     */
    private _attrBindHandle;
    /**
     * 处理 (click)="echo('hello',$event)" 解析
     * @param node
     * @param param1
     */
    private _eventBindHandle;
    /**
     * * 递归解析子节点
     * @param childNodes
     * @param contextData
     */
    private _bindingChildNodesAttrs;
    /**
     * * 解析文本节点的插值表达式
     * @param textNode
     * @param contextData
     */
    private _setTextContent;
}
export default Aja;
