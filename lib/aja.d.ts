import { FormControl } from "./classes/forms";
import { Pipes } from "./pipes/interfaces/interfaces";
export interface AjaConfigOpts {
    state?: any;
    actions?: {
        [name: string]: Function;
    };
    initState?: Function;
    pipes?: Pipes;
}
declare class Aja {
    static FormControl: typeof FormControl;
    $store?: any;
    $actions?: {
        [name: string]: Function;
    };
    constructor(view?: string | HTMLElement, options?: AjaConfigOpts);
    /**
     * 扫描绑定
     * @param root
     */
    private _scan;
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
     * * 递归解析子节点
     * @param childNodes
     * @param contextData
     */
    private _bindingChildNodesAttrs;
}
export default Aja;
