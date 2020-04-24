import { AstHtmlBase } from "./ast-html-base";
import { ContextData } from "../classes/context-data";

export class AstComment extends AstHtmlBase<Comment> {
  contextData!: ContextData;
  host!: Comment;
  constructor(readonly data: string) {
    super();
  }
  toString(): string {
    return `<!--${this.data}-->`;
  }

  createHost<T>(contextData: ContextData): T {
    this.contextData = contextData;
    this.host = document.createComment(this.data);
    return this.host as any;
  }
}
