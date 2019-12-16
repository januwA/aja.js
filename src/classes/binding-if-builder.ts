import { hasIfAttr } from "../utils/util";

export class BindingIfBuilder {
  /**
   * * 一个注释节点
   */
  commentNode: Comment | undefined;

  ifAttr: Attr | undefined;

  constructor(public node: HTMLElement, ifInstruction: string) {
    let ifAttr = hasIfAttr(node, ifInstruction);
    if (!ifAttr) return;
    this.ifAttr = ifAttr;
    this.commentNode = document.createComment("");
    this.node.before(this.commentNode);
    this.node.removeAttribute(ifInstruction);
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

  /**
   * * 这里使用了回调把template标签给渲染了
   * @param show
   */
  checked(show: boolean, cb?: () => void) {
    if (!this.commentNode) return;
    if (show) {
      this.commentNode.after(this.node);
      if (cb) cb();
    } else {
      this.node.replaceWith(this.commentNode);
    }
    this.commentNode.data = this._createIfCommentData(show);
  }

  private _createIfCommentData(value: any): string {
    return `{":if": "${!!value}"}`;
  }
}
