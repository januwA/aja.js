import { GetDataCallBack } from "../aja";
export declare class BindingTextBuilder {
    private node;
    /**
     * * 保存插值表达式的模板，千万不要改变
     */
    readonly text: string;
    /**
     * * 是否需要解析
     */
    get needParse(): boolean;
    constructor(node: ChildNode);
    setText(getData: GetDataCallBack): void;
}
