import { interpolationExpressionExp } from "../utils/exp";
import { parsePipe, getData } from "../utils/util";
import { usePipes } from "../pipes/pipes";
import { ContextData } from "./context-data";

export class BindingTextBuilder {
  /**
   * * 保存插值表达式的模板，千万不要改变
   */
  public text: string;

  constructor(private node: ChildNode) {
    this.text = node.textContent || "";
  }

  setText(contextData: ContextData) {
    const text = this.text.replace(interpolationExpressionExp, (match, g1) => {
      const [bindKey, pipeList] = parsePipe(g1);
      const data = getData(bindKey, contextData);
      const pipeData = usePipes(data, pipeList, contextData);
      return pipeData;
    });
    this.node.textContent = text;
  }
}
