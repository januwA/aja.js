import { ContextData } from "../classes/context-data";

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
}
