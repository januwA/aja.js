import { interpolationExpressionExp } from "../utils/exp";
import { escapeRegExp } from "../utils/util";

export class BindingTextBuilder {
  private _bindTextContent: string;

  /**
   * * 是否需要解析
   */
  get needParse(): boolean {
    return interpolationExpressionExp.test(this._bindTextContent);
  }

  /**
   * * "{{name}} {{ age }}" -> ["{{name}}", "{{ age }}"]
   */
  private get matchs(): string[] {
    let matchs = this._bindTextContent.match(interpolationExpressionExp) || [];
    return matchs;
  }

  /**
   * * ["{{name}}", "{{ age }}"] -> ["name", "age"]
   */
  get bindVariables() {
    return this.matchs.map(e => e.replace(/[{}\s]/g, ""));
  }

  constructor(private childNode: ChildNode) {
    this._bindTextContent = childNode.textContent || "";
  }

  draw(states: any[]) {
    this.childNode.textContent = this._parseBindingTextContent(
      this._bindTextContent,
      this.matchs,
      states
    );
  }

  /**
   * * 解析文本的表达式
   *
   * @param textContent  "{{ age }} - {{ a }} = {{ a }}""
   * @param matchs  ["{{ age }}", "{{ a }}", "{{ a }}"]
   * @param states [12, "x", "x"]
   * @returns "12 - x = x"
   */
  private _parseBindingTextContent(
    textContent: string,
    matchs: string[],
    states: any[]
  ): string {
    if (matchs.length !== states.length)
      return "[[aja.js: 框架意外的解析错误!!!]]";
    for (let index = 0; index < matchs.length; index++) {
      const m = matchs[index];
      let state = states[index];
      if (state === null) state = "";
      state =
        typeof state === "string" ? state : JSON.stringify(state, null, " ");
      textContent = textContent.replace(
        new RegExp(escapeRegExp(m), "g"),
        state
      );
    }
    return textContent;
  }
}
