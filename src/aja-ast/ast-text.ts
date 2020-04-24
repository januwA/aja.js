import { AstHtmlBase } from "./ast-html-base";
import { ContextData } from "../classes/context-data";
import { parsePipe } from "../utils/util";
import { getData } from "../core";
import { usePipes } from "../factory/pipe-factory";
import { autorun } from "../aja-mobx";

const interpolationExpressionExp = /{{\s*([^]+)\s*}}/g;

export class AstText extends AstHtmlBase<Text> {
  host!: Text;
  contextData!: ContextData;
  value: string;

  constructor(value: string) {
    super();
    this.value = this._replaceStartAndEndSpeace(value);
  }

  toString() {
    return `${this.value}`;
  }

  private _getPipeData(key: string) {
    const [bindKey, pipeList] = parsePipe(key);
    const data = getData(bindKey, this.contextData!);
    return usePipes(data, pipeList, this.contextData!);
  }

  /**
   * 解析文本的插值表达式
   */
  private _parseConputed() {
    if (this.isConputed) {
      autorun(() => {
        const textContent = this.value.replace(
          interpolationExpressionExp,
          (match, g1) => {
            const pipeData = this._getPipeData(g1);
            return pipeData;
          }
        );
        this.host.textContent = textContent;
      });
    }
  }

  /**
   *
   * 是否存在插值表达式
   * 'hello'        => fasle
   * '{{ hello }}'  => true
   */
  get isConputed() {
    return this.value.match(interpolationExpressionExp) !== null;
  }

  /**
   * 如果首尾空格的空格大于一个，那么全部替换为一个空格
   */
  private _replaceStartAndEndSpeace(v: string) {
    return v.replace(/^\s{2,}/, " ").replace(/\s{2,}$/, " ");
  }

  createHost<T>(contextData: ContextData): T {
    this.contextData = contextData;
    this.host = document.createTextNode(this.value);
    this._parseConputed();
    return this.host as any;
  }
}
