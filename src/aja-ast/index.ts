import { PerlRegExp } from "perl-regexp";

// 标签起始匹配
import {
  AstText,
  AstElement,
  AstAttrbute,
  AstComment,
  childType
} from "./element-ast";

// ?: 忽略捕获，只需要分组
export const ncname = "[a-zA-Z_][\\w\\-\\.]*";
export const qnameCapture = `((?:${ncname}\\:)?${ncname})`;
// 匹配tag的标签名
export const startTagOpen = new RegExp(`^<${qnameCapture}`);

/**
 * 匹配tag: <([a-zA-Z_][\w\-\.]*)
 * 匹配任意个属性: ((?:\s*([^\s"'<>\/=]+)\s*=\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))*)
 * 结尾: \s*(\/?)>
 */
export const startTag = /\s*<([a-zA-Z_][\w\-\.]*)((?:\s*([^\s"'<>\/=]+)\s*=\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))*)\s*(\/?)>/;

/**
 * 匹配起始标签的属性
 * class="title"
 * class='title'
 * class=title
 */
export const attributeExp = /^\s*([^\s"'<>\/=]+)\s*=\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+))?/;

export const startTagClose = /^\s*(\/?)>/;
// 匹配结束的tag
export const endTag = new PerlRegExp(` ^<\\/${qnameCapture}[^>]*> \\s* `, "x");

// 匹配html注释
export const htmlCommentStart = /^\s*<!--/;
export const htmlComment = /\s*<!--([^]*?)-->\s*/;

export interface IAstRoot {
  nodes: childType[];
  toString(): string;
}

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
 *
 *      }
 *   ]
 * }
 * ```
 */
export function htmlAst(html: string): IAstRoot {
  const _root: IAstRoot = {
    nodes: [],
    toString() {
      return this.nodes.reduce((acc, el) => (acc += el.toString()), "");
    }
  };

  /**
   * 存储未匹配完成的起始标签
   * 如：<div><span></span></div>
   * 那么: div,span会被添加到[bufArray]
   * 当开始标签匹配完后，就开始匹配结束标签[parseEndTag]: </span></div>
   */
  const startTagBuffer: AstElement[] = [];
  let isChars: boolean; // 是不是文本内容
  let match;
  let last;

  while (html && last != html) {
    last = html;
    isChars = true;

    match = html.match(htmlComment);
    if (html.match(htmlCommentStart) && match) {
      isChars = false;
      html = html.substring(match[0].length);
      pushChild(new AstComment(match[1]));
    }

    if (html.startsWith("</")) {
      // 结束标签
      match = html.match(endTag); // 匹配结束tag
      if (match) {
        isChars = false;

        // 斩掉匹配到字符串的长度
        html = html.substring(match[0].length);

        // 获取第一个打组
        parseEndTag(match[1]);
      }
    } else if (/^\s*</.test(html)) {
      // 起始标签
      // <body style="color: red;">
      // <img style="color: red;" >
      // <img style="color: red;" />
      match = html.match(startTag);
      if (match) {
        isChars = false;
        html = html.substring(match[0].length);
        parseStartTag({
          tagName: match[1].toLowerCase(),
          attrs: match[2],
          unary: !!match[7]
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

      pushChild(new AstText(text));
    }
  }

  function pushChild(child: childType) {
    // 如果为0， 则一个根元素被解析完毕
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
    unary
  }: {
    tagName: string;
    attrs: string;

    /**
     * 是否为自闭和标签,最后那个匹配(\/?)的分组
     */
    unary: boolean;
  }) {
    const astElement: AstElement = new AstElement({
      name: tagName
    });

    // 解析所有的attributes
    while (attrs.trim()) {
      const attrMatch = attrs.match(attributeExp);
      if (attrMatch) {
        const name = attrMatch[1];
        const value = attrMatch[2];
        astElement.setAttr(new AstAttrbute(name, value));
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

  function parseEndTag(tagName: string) {
    let pos = 0;
    // 从其实标签的尾部开始匹配对应的结束标签
    for (pos = startTagBuffer.length - 1; pos >= 0; pos--) {
      // 如果标签名相同，则匹配
      if (startTagBuffer[pos].name === tagName) {
        break;
      }
    }
    if (pos >= 0) {
      const astElement = startTagBuffer.pop(); // 斩掉最后一个元素
      if (astElement) pushChild(astElement);
    }
  }

  return _root;
}
