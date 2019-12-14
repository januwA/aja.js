import { interpolationExpressionExp } from "../utils/exp";
import { escapeRegExp } from "../utils/util";
import { Pipes } from "../aja";

export class BindingTextBuilder {
  public text: string;

  /**
   * * 是否需要解析
   */
  get needParse(): boolean {
    return interpolationExpressionExp.test(this.text);
  }

  /**
   * * "{{name}} {{ age }}" -> ["{{name}}", "{{ age }}"]
   */
  get matchs(): string[] {
    let matchs = this.text.match(interpolationExpressionExp) || [];
    return matchs;
  }

  /**
   * * ["{{name | uppercase }}", "{{ age }}"] -> ["name | uppercase", ["age"]]
   */
  get bindVariables() {
    let vs = this.matchs.map(e => e.replace(/[{}\s]/g, ""));
    return vs;
  }

  constructor(private childNode: ChildNode) {
    this.text = childNode.textContent || "";
  }

  draw(states: any[]) {
    this.childNode.textContent = this._parseBindingTextContent(states);
  }

  /**
   * * 解析文本的表达式
   *
   * @param textContent  "{{ age }} - {{ a }} = {{ a }}""
   * @param states [12, "x", "x"]
   * @returns "12 - x = x"
   */
  private _parseBindingTextContent(states: any[]): string {
    if (this.matchs.length !== states.length)
      return "[[aja.js: 框架意外的解析错误!!!]]";
    let result = this.text;
    for (let index = 0; index < this.matchs.length; index++) {
      const m = this.matchs[index];
      let state = states[index];
      if (state === null) state = "";
      state =
        typeof state === "string" ? state : JSON.stringify(state, null, " ");
      result = result.replace(new RegExp(escapeRegExp(m), "g"), state);
    }
    return result;
  }
}
