import { childType } from "./child-type";
import { ContextData } from "../classes/context-data";

export class AstRoot {
  host!: HTMLElement;
  contextData!: ContextData;

  constructor(public readonly nodes: childType[]) {}

  /**
   * !对于ast root需要手动设置下host
   *
   * 如：
   * ```
   * const ast = htmlAst(template);
   * ast.host = this.host; // 手动设置
   * ast.createHost(contextData);
   * ```
   * @param contextData
   */
  createHost<T>(contextData: ContextData): T {
    this.nodes.forEach((it) => this.host.append(it.createHost(contextData)));
    return this.host as any;
  }

  toString() {
    return this.nodes.reduce((acc, el) => (acc += el.toString()), "");
  }
}
