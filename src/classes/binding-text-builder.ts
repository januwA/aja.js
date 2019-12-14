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
   * * ["{{name | uppercase }}", "{{ age }}"] -> [["name", "uppercase"], ["age"]]
   */
  get bindVariables() {
    let vs = this.matchs
      .map(e => e.replace(/[{}\s]/g, ""))
      .map(e => e.split("|"));
    return vs;
  }

  constructor(private childNode: ChildNode) {
    this.text = childNode.textContent || "";
  }
}
