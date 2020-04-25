import { MethodCall } from "./ast-attrbute";
import { htmlAst } from "./html-ast";
import { AstElement } from "./ast-element";
import { AstText } from "./ast-text";
import { AstComment } from "./ast-comment";

// const a = /\s*(?<name>[^\s"'<>\/=]+)\s*(?:=\s*(?:"(?<v1>[^"]*)"+|'(?<v2>[^']*)'+|(?<v3>[^\s"'=<>`]+)))?/;
// let m2 = `#x class="asda"`.match(a);
// console.log(m2);

// m2 = `class="a"`.match(a);
// console.log(m2);

// m2 = `class='a'`.match(a);
// console.log(m2);

// m2 = `class=a`.match(a);
// console.log(m2);

// m2 = `class=`.match(a);
// console.log(m2);

// m2 = `class`.match(a);
// console.log(m2);

// const call = new MethodCall("data[hello](1, '2', \"3\", name, '1asd,23')");
// console.log(call);

let t = `<!-- 注释 --><div title='ajanuw'>hello</div>`;
let ast = htmlAst(t);
let c = ast.nodes[1] as AstElement;
let text = c.children[0];

// let div = ast.nodes[0] as AstElement;
// console.log(div);
// console.log(
//   `start tag: ${t.substr(div.startSourceSpan.start, div.startSourceSpan.end)}`
// );
// console.log(
//   `end tag: ${t.substr(div.endSourceSpan.start, div.endSourceSpan.end)}`
// );
// console.log(
//   `div tag: ${t.substr(div.startSourceSpan.start, div.endSourceSpan.end)}`
// );

// let text = div.children[0] as AstText;
// console.log(text);
