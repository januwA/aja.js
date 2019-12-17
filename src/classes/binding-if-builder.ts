import { findIfAttr } from "../utils/util";
import { structureDirectives } from "../utils/const-string";

export class BindingIfBuilder {
  /**
   * * 一个注释节点
   */
  commentNode?: Comment;

  ifAttr?: Attr;

  constructor(public node: HTMLElement) {
    let ifAttr = findIfAttr(node, structureDirectives.if);
    if (!ifAttr) return;
    this.ifAttr = ifAttr;
    this.commentNode = document.createComment("");
    this.node.before(this.commentNode);
    this.node.removeAttribute(structureDirectives.if);
  }

  get value(): string {
    return this.ifAttr?.value.trim() || "";
  }

  /**
   * * 这里使用了回调把template标签给渲染了
   * @param show
   */
  checked(show: boolean, cb: () => void) {
    if (!this.commentNode) return;
    if (show) {
      this.commentNode.after(this.node);
      cb();
    } else {
      this.node.replaceWith(this.commentNode);
    }
    this.commentNode.data = this._createIfCommentData(show);
  }

  private _createIfCommentData(value: any): string {
    return `{":if": "${!!value}"}`;
  }
}
