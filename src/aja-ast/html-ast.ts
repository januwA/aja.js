import { AstRoot } from "./ast-root";
import { AstElement } from "./ast-element";
import { AstComment } from "./ast-comment";
import { stripScripts } from "../utils/util";
import { AstText } from "./ast-text";
import { childType } from "./child-type";
import { ParseSourceSpan } from "./ast-html-base";
import { rnExp } from "../utils/exp";

/**
 * 匹配html标签名
 *
 * app-home
 *
 * appHome
 */
export const ncname = "[a-zA-Z_][\\w\\-\\.]*";

// 打组
export const qnameCapture = `((?:${ncname}\\:)?${ncname})`;

/**
 * 匹配html tag的标签名
 *
 * <app-home
 */
export const startTagOpenExp = new RegExp(`^<${qnameCapture}`);

/**
 * 匹配tag: <([a-zA-Z_][\w\-\.]*)
 * 匹配任意个属性: (?<attributes>(?:\s*(?:[^\s"'<>\/=]+)\s*(?:=\s*(?:"(?:[^"]*)"+|'(?:[^']*)'+|(?:[^\s"'=<>`]+)))?)*)
 * 结尾: \s*(?<unary>\/?)>
 *
 * 匹配属性可能会存在单个的，比如 checked autoplay，这时默认的值是boolean类型的，并且为true
 * 除非手动填写 checked=false 这种
 *
 * 关于属性是boolean值
 * https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#boolean-attributes
 *
 */
export const startTagExp = /<(?<tagName>[a-zA-Z_][\w\-\.]*)(?<attributes>(?:\s*(?:[^\s"'<>\/=]+)\s*(?:=\s*(?:"(?:[^"]*)"+|'(?:[^']*)'+|(?:[^\s"'=<>`]+)))?)*)\s*(?<unary>\/?)>/;

/**
 * 匹配起始标签的属性
 * class="title"
 * class='title'
 * class=title
 * class=
 * #ref
 */
export const attributeExp = /\s*(?<name>[^\s"'<>\/=]+)\s*(?:=\s*(?:"(?<v1>[^"]*)"+|'(?<v2>[^']*)'+|(?<v3>[^\s"'=<>`]+)))?/;

// 匹配结束的tag
export const endTagExp = new RegExp(`^<\\/${qnameCapture}[^>]*>\\s*`);

// 匹配html注释
export const htmlCommentStartExp = /^\s*<!--/;
export const htmlCommentExp = /<!--([^]*?)-->/;

/**
 * 将html字符串转化为ast
 * https://astexplorer.net/
 *
 * ## Input
 * ```html
 * <body style="color: red;">
 *  hi
 *  <h1>My First Heading</h1>
 *  <p>My first paragraph.</p>
 * </body>
 *
 * <div>
 *   <p>hello</p>
 * </div>
 * ```
 *
 * ## Output
 * ```js
 * {
 *   nodes: [
 *      Element(body) => {
 *        name: "body",
 *        attrbutes: [
 *          {
 *            name: "style",
 *            value: "color: red;"
 *          }
 *        ],
 *        inputs: [],
 *        outputs: [],
 *        children: [
 *           {
 *            value: "hi"
 *          },
 *          {},
 *          {}
 *        ]
 *      },
 *      Element(div) => {
 *        ...
 *      }
 *   ]
 * }
 * ```
 */
export function htmlAst(html: string): AstRoot {
  html = stripScripts(html);
  const _html = html;

  const _root: AstRoot = new AstRoot([]);
  
  /**
   * 存储未匹配完成的起始标签
   * 如：<div><span></span></div>
   * 那么: div,span会被添加到[bufArray]
   * 当开始标签匹配完后，就开始匹配结束标签[parseEndTag]: </span></div>
   */
  const startTagBuffer: AstElement[] = [];
  let isChars: boolean; // 是不是文本内容
  let match: RegExpMatchArray | null;
  let last;
  let startIndex = 0;

  while (html && last != html) {
    last = html;
    isChars = true;

    match = html.match(htmlCommentExp);
    if (html.match(htmlCommentStartExp) && match) {
      isChars = false;
      let sourceSpan = stepStartIndex(match.index!, match[0].length);
      stepHtml();
      const astComment = new AstComment(match[1]);
      astComment.sourceSpan = sourceSpan;
      pushChild(astComment);
    }

    if (html.startsWith("</")) {
      // 结束标签
      match = html.match(endTagExp); // 匹配结束tag
      if (match) {
        isChars = false;
        let endSourceSpan = stepStartIndex(match.index!, match[0].length);
        stepHtml();
        parseEndTag(match[1], endSourceSpan);
      }
    } else if (/^\s*</.test(html)) {
      // 起始标签
      match = html.match(startTagExp);
      if (match) {
        isChars = false;
        let sourceSpan = stepStartIndex(match.index!, match[0].length);
        stepHtml();
        parseStartTag({
          tagName: match.groups!.tagName.toLowerCase(),
          attrs: match.groups!.attributes || "",
          unary: !!match.groups!.unary,
          sourceSpan,
        });
      }
    }

    if (isChars) {
      // 直到下一个标签或注释，都当作文本处理
      let index = html.indexOf("<");
      let text;
      if (index < 0) {
        // 就是纯文本
        text = html;
        html = "";
      } else {
        text = html.substring(0, index);
        html = html.substring(index);
      }
      let sourceSpan = stepStartIndex(0, text.length);
      const astText = new AstText(text);
      astText.sourceSpan = sourceSpan;
      pushChild(astText);
    }
  }

  function stepStartIndex(startOffset: number, endOffset: number) {
    let sourceSpan = new ParseSourceSpan();
    sourceSpan.start = startIndex + startOffset; // 标签起始位置
    sourceSpan.end = startIndex + endOffset; // 标签结束位置
    startIndex = sourceSpan.end;
    sourceSpan.line =
      _html.substr(0, sourceSpan.start).match(rnExp)?.length ?? 0;
    return sourceSpan;
  }

  function stepHtml() {
    if (!match) return;
    // 斩掉匹配到字符串的长度
    html = html.substring(match[0].length + match.index! || 0);
  }

  function pushChild(child: childType) {
    // 如果为0， 则一个根元素被解析完毕
    //TODO: 可能出现意外情况 <p><div>hello</div>
    //TODO: 标签不匹配导致最后nodes没元素
    //TODO: 所以还的判断在往parent添加child的时候判断接下来的html不为空，并且下一次的endTagName必须和parent.name相等
    if (startTagBuffer.length === 0) {
      _root.nodes.push(child);
    } else {
      const parent: AstElement = startTagBuffer[startTagBuffer.length - 1];
      parent.children.push(child);
    }
  }

  function parseStartTag({
    tagName,
    attrs,
    unary,

    sourceSpan,
  }: {
    tagName: string;
    attrs: string;

    /**
     * 是否为自闭和标签,最后那个匹配(\/?)的分组
     */
    unary: boolean;
    sourceSpan: ParseSourceSpan;
  }) {
    const astElement: AstElement = new AstElement({
      name: tagName,
      sourceSpan: sourceSpan,
      startSourceSpan: sourceSpan,
    });

    // 解析所有的attributes
    while (attrs.trim()) {
      const attrMatch = attrs.match(attributeExp);
      if (attrMatch) {
        const name = attrMatch.groups!.name;
        const value =
          attrMatch.groups!.v1 ??
          attrMatch.groups!.v2 ??
          attrMatch.groups!.v3 ??
          "";
        astElement.setAttr(name, value);
        attrs = attrs.substring(attrMatch[0].length);
      }
    }

    if (unary || astElement.isSelfClosing) {
      pushChild(astElement);
    } else {
      // 非自关闭标签，将被缓存到[startTagBuffer]
      startTagBuffer.push(astElement);
    }
  }

  function parseEndTag(endtagName: string, endSourceSpan: ParseSourceSpan) {
    const last: undefined | AstElement = startTagBuffer.pop(); // 获取最后一个
    if (!last) {
      throw new Error(`parseEndTag error: endtagName: ${endtagName}`);
    }

    if (last.name.toLowerCase() !== endtagName.toLowerCase()) {
      throw new Error(`parseEndTag error: 开始标签与闭合标签不匹配`);
    }

    last.endSourceSpan = endSourceSpan;
    pushChild(last);
  }

  return _root;
}
