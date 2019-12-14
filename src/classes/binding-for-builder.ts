import { arrayp, emptyString, isNumber, hasForAttr } from "../utils/util";
import { eventStartExp, eventEndExp } from "../utils/exp";

export class BindingForBuilder {
  /**
   * * 一个注释节点
   */
  private commentNode: Comment | undefined;

  private fragment: DocumentFragment | undefined;
  private forBuffer: Node[] = [];

  private forAttr: Attr | undefined;

  constructor(public node: HTMLElement, public forInstruction: string) {
    let forAttr = hasForAttr(node, forInstruction);
    // 没有for指令，就不构建下去了
    if (!forAttr) return;
    this.forAttr = forAttr;
    this.commentNode = document.createComment("");
    this.fragment = document.createDocumentFragment();
    node.replaceWith(this.commentNode);
    node.removeAttribute(forInstruction);
  }

  get hasForAttr() {
    return !!this.forAttr;
  }

  private get forAttrValue(): {
    variable: string;
    variables: string[];
    bindData: string;
  } | null {
    if (!this.forAttr) return null;
    let [variable, bindData] = this.forAttr.value
      .split(/\bin\b/)
      .map(s => s.trim());
    const variables: string[] = variable
      .trim()
      .replace(eventStartExp, emptyString)
      .replace(eventEndExp, emptyString)
      .split(",")
      .map(v => v.trim());
    return {
      variable,
      variables,
      bindData
    };
  }

  get bindVar(): string | undefined {
    if (this.hasForAttr) {
      return this.forAttrValue!.variable;
    }
  }
  get bindKey(): string | undefined {
    if (this.hasForAttr) {
      return this.forAttrValue!.variables[0];
    }
  }
  get bindValue(): string | undefined {
    if (this.hasForAttr) {
      return this.forAttrValue!.variables[1];
    }
  }
  get bindData(): string | undefined {
    if (this.hasForAttr) {
      return this.forAttrValue!.bindData;
    }
  }
  get isNumberData(): boolean | undefined {
    if (this.hasForAttr) {
      return isNumber(this.bindData as string);
    }
  }

  /**
   * * 添加一个节点
   * @param item
   */
  add(item: Node) {
    if (this.fragment) {
      this.fragment.append(item);
      this.forBuffer.push(item);
    }
  }

  /**
   * * 将所有节点插入DOM
   * @param data
   */
  draw(data: any) {
    if (this.commentNode && this.fragment) {
      this.commentNode.after(this.fragment);
      this.commentNode.data = this.createForCommentData(data);
    }
  }

  /**
   * * 清除所有节点
   */
  clear() {
    for (const forItem of this.forBuffer) {
      (forItem as HTMLElement).remove();
    }
    this.forBuffer = [];
  }

  createForContextState(k: any, v: any = null, isNumber: boolean = true): {} {
    const forState = {};
    if (isNumber && this.bindVar) {
      Object.defineProperty(forState, this.bindVar, {
        get() {
          return k;
        }
      });
    } else {
      if (this.bindKey && this.bindValue) {
        Object.defineProperties(forState, {
          [this.bindKey]: {
            get() {
              return k;
            }
          },
          [this.bindValue]: {
            get() {
              return v;
            }
          }
        });
      } else if (this.bindKey) {
        Object.defineProperties(forState, {
          [this.bindKey]: {
            get() {
              return v;
            }
          }
        });
      }
    }
    return forState;
  }

  private createForCommentData(obj: any): string {
    let data = obj;
    if (arrayp(data)) {
      data = obj.slice(0, 6);
    }
    return `{":for": "${data}"}`;
  }

  createItem() {
    const item = this.node.cloneNode(true);
    this.add(item);
    return item;
  }
}
