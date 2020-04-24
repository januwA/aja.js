import { AstText } from "./ast-text";
import { AstElement } from "./ast-element";
import { AstComment } from "./ast-comment";

// children可能包含的类型
export type childType = AstText | AstElement | AstComment;
