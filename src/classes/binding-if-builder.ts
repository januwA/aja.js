export class BindingIfBuilder {
  /**
   * * 一个注释节点
   */
  cm: Comment | undefined;

  ifAttr: Attr | undefined;

  constructor(public elem: HTMLElement, ifInstruction: string) {
    const attrs = Array.from(elem.attributes);
    let ifAttr = attrs.find(({ name }) => name === ifInstruction);
    if (!ifAttr) return;
    this.ifAttr = ifAttr;
    this.cm = document.createComment("");
    elem.before(this.cm);
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

  checked(show: boolean) {
    if (!this.cm) return;
    if (show) {
      this.cm.after(this.elem);
    } else {
      this.elem.replaceWith(this.cm);
    }
    this.cm.data = this._createIfCommentData(show);
  }

  private _createIfCommentData(value: any): string {
    return `{":if": "${!!value}"}`;
  }
}
