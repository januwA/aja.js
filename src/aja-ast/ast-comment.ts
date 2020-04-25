import { AstHtmlBase, ParseSourceSpan } from "./ast-html-base";
import { ContextData } from "../classes/context-data";

export class AstComment extends AstHtmlBase<Comment> {
  sourceSpan: ParseSourceSpan = new ParseSourceSpan();
  contextData!: ContextData;
  host!: Comment;
  constructor(public readonly data: string) {
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
