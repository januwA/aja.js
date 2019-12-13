import { templatep } from "../utils/util";
import { State } from "../../lib/store";

export class BindingIfBuilder {
  /**
   * * 一个注释节点
   */
  commentNode: Comment | undefined;

  ifAttr: Attr | undefined;

  constructor(public node: HTMLElement, ifInstruction: string) {
    const attrs = Array.from(node.attributes);
    let ifAttr = attrs.find(({ name }) => name === ifInstruction);
    if (!ifAttr) return;
    this.ifAttr = ifAttr;
    this.commentNode = document.createComment("");
    node.before(this.commentNode);
  }

  /**
   * * 只有存在if指令，其他的方法和属性才生效
   */
  get hasIfAttr() {
    return !!this.ifAttr;
  }

  get value(): string | undefined {
    if (this.hasIfAttr) {
      return this.ifAttr!.value.trim();
    }
  }

  cloneChildren: any[] = [];

  /**
   * * 这里使用了回调把template标签给渲染了
   * @param show
   * @param cb
   */
  checked(show: boolean, cb: { (clone: any): void }) {
    if (!this.commentNode) return;
    if (show) {
      if (templatep(this.node)) {
        let clone = document.importNode(
          (this.node as HTMLTemplateElement).content,
          true
        );
        this.cloneChildren.push(...Array.from(clone.children));
        cb(clone);

        // 先把template节点替换为注释节点
        this.node.replaceWith(this.commentNode);

        // 再把fgm节点注释节点下面插
        this.commentNode.after(clone);
      } else {
        this.commentNode.after(this.node);
      }
    } else {
      if (templatep(this.node)) {
        for (const item of this.cloneChildren) {
          item.remove();
        }
        this.cloneChildren = [];
      } else {
        this.node.replaceWith(this.commentNode);
      }
    }
    this.commentNode.data = this._createIfCommentData(show);
  }

  private _createIfCommentData(value: any): string {
    return `{":if": "${!!value}"}`;
  }
}
