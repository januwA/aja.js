import { interpolationExpressionExp, spaceExp } from "../utils/exp";
import { parsePipe } from "../utils/util";
import { usePipes } from "../pipes/pipes";
import { GetDataCallBack } from "../aja";

export class BindingTextBuilder {
  /**
   * * 保存插值表达式的模板，千万不要改变
   */
  public readonly text: string;

  /**
   * * 是否需要解析
   */
  get needParse(): boolean {
    return interpolationExpressionExp.test(this.text);
  }

  constructor(private node: ChildNode) {
    this.text = node.textContent || "";
  }

  setText(getData: GetDataCallBack) {
    const text = this.text.replace(interpolationExpressionExp, (match, g1) => {
      const key = g1.replace(spaceExp, "");
      const pipeList = parsePipe(key)[1];
      const data = getData(key);
      const pipeData = usePipes(data, pipeList, arg => getData(arg));
      return pipeData;
    });
    if (text !== this.node.textContent) {
      this.node.textContent = text;
    }
  }
}
