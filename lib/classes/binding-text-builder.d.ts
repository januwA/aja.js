export declare class BindingTextBuilder {
    private childNode;
    private _bindTextContent;
    /**
     * * 是否需要解析
     */
    get needParse(): boolean;
    /**
     * * "{{name}} {{ age }}" -> ["{{name}}", "{{ age }}"]
     */
    private get matchs();
    /**
     * * ["{{name}}", "{{ age }}"] -> ["name", "age"]
     */
    get bindVariables(): string[];
    constructor(childNode: ChildNode);
    draw(states: any[]): void;
    /**
     * * 解析文本的表达式
     *
     * @param textContent  "{{ age }} - {{ a }} = {{ a }}""
     * @param matchs  ["{{ age }}", "{{ a }}", "{{ a }}"]
     * @param states [12, "x", "x"]
     * @returns "12 - x = x"
     */
    private _parseBindingTextContent;
}
