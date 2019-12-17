import { interpolationExpressionExp, spaceExp } from "../utils/exp";
import { parsePipe } from "../utils/util";
import { usePipes } from "../pipes/pipes";
import { GetDataCallBack } from "../aja";

export class BindingTextBuilder {
  /**
   * * 保存插值表达式的模板，千万不要改变
   */
  public text: string;

  constructor(private node: ChildNode) {
    this.text = node.textContent || "";
  }

  setText(getData: GetDataCallBack) {
    const text = this.text.replace(interpolationExpressionExp, (match, g1) => {
      const [bindKey, pipeList] = parsePipe(g1);
      const data = getData(bindKey);
      const pipeData = usePipes(data, pipeList, arg => getData(arg));
      return pipeData;
    });
    this.node.textContent = text;
  }
}
