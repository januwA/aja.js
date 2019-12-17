import { emptyString, findForAttr, parsePipe } from "../utils/util";
import { eventStartExp, eventEndExp } from "../utils/exp";
import { numberp, arrayp } from "../utils/p";
import { structureDirectives } from "../utils/const-string";

export class BindingForBuilder {
  /**
   * :for="$_ of arr"
   * :for="of arr"
   */
  static defaultKey = "$_";

  /**
   * * 一个注释节点
   */
  private commentNode?: Comment;

  private fragment?: DocumentFragment;
  private forBuffer: Node[] = [];

  forAttr?: Attr;

  constructor(public node: HTMLElement) {
    let forAttr = findForAttr(node, structureDirectives.for);
    // 没有for指令，就不构建下去了
    if (!forAttr) return;
    this.forAttr = forAttr;
    this.commentNode = document.createComment("");
    this.fragment = document.createDocumentFragment();
    node.replaceWith(this.commentNode);
    node.removeAttribute(structureDirectives.for);
  }

  get hasForAttr() {
    return !!this.forAttr;
  }

  private get forAttrValue():
    | {
        variable: string;
        variables: string[];
        bindData: string;
        pipes: string[];
      }
    | undefined {
    if (!this.forAttr) return;
    let [variable, bindKey] = this.forAttr.value
      .split(/\bin|of\b/)
      .map(s => s.trim());

    let variables: string[] = [];
    if (variable) {
      variables = variable
        .trim()
        .replace(eventStartExp, emptyString)
        .replace(eventEndExp, emptyString)
        .split(",")
        .map(v => v.trim());
    }
    const p = parsePipe(bindKey);
    return {
      variable,
      variables,
      bindData: p[0],
      pipes: p[1]
    };
  }

  get bindVar(): string {
    return this.forAttrValue!.variable || BindingForBuilder.defaultKey;
  }
  get bindKey(): string {
    return this.forAttrValue!.variables[0] || BindingForBuilder.defaultKey;
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
      return numberp(this.bindData as string);
    }
  }
  get pipes(): string[] {
    if (this.hasForAttr) {
      return this.forAttrValue?.pipes || [];
    } else {
      return [];
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
    const forState: { [k: string]: any } = {};
    if (isNumber) {
      forState[this.bindVar] = k;
    } else {
      if (this.bindKey && this.bindValue) {
        forState[this.bindKey] = k;
        forState[this.bindValue] = v;
      } else if (this.bindKey) {
        forState[this.bindKey] = v;
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
    if (this.fragment) {
      this.forBuffer.push(item);
      this.fragment.append(item);
    }
    return item;
  }
}
