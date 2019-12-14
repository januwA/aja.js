export declare class BindingTextBuilder {
    private childNode;
    text: string;
    /**
     * * 是否需要解析
     */
    get needParse(): boolean;
    /**
     * * "{{name}} {{ age }}" -> ["{{name}}", "{{ age }}"]
     */
    get matchs(): string[];
    /**
     * * ["{{name | uppercase }}", "{{ age }}"] -> [["name", "uppercase"], ["age"]]
     */
    get bindVariables(): string[][];
    constructor(childNode: ChildNode);
}
