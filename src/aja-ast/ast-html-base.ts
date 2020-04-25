import { ContextData } from "../classes/context-data";

export class ParseSourceSpan {
  start: number;
  end: number;

  /**
   * 这里只考虑了开始时的行数
   * 
   * 对于这种情况并没有考虑，如：
   * ```
   * <img 
   *  title=a />
   * ```
   *上面的标签在开始<，与结束>并没有在同一行，这里只考虑标签开始的行
   */
  line: number;

  constructor() {
    this.start = 0;
    this.end = 0;
    this.line = 0;
  }
}

export abstract class AstHtmlBase<T> {
  abstract host: T;
  abstract contextData: ContextData;

  /**
   * 拼接为html字符串
   */
  abstract toString(): string;

  /**
   * 创建dom实例，对应的实现函数
   * @param contextData
   */
  abstract createHost<T extends {}>(contextData: ContextData): T;

  /**
   * 对于标签是标签的起始位置，如：`<p>a</p>`那么只计算`<p>`
   */
  abstract sourceSpan: ParseSourceSpan;
}
