import { AstRoot } from "./ast-root";
import { AstElement } from "./ast-element";
import { AstComment } from "./ast-comment";
import { stripScripts } from "../utils/util";
import { AstText } from "./ast-text";
import { childType } from "./child-type";

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
export const startTagExp = /\s*<(?<tagName>[a-zA-Z_][\w\-\.]*)(?<attributes>(?:\s*(?:[^\s"'<>\/=]+)\s*(?:=\s*(?:"(?:[^"]*)"+|'(?:[^']*)'+|(?:[^\s"'=<>`]+)))?)*)\s*(?<unary>\/?)>/;

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
export const htmlCommentExp = /\s*<!--([^]*?)-->\s*/;

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
  const _root: AstRoot = new AstRoot([]);

  // 1. 斩掉script标签
  html = stripScripts(html);

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

    match = html.match(htmlCommentExp);
    if (html.match(htmlCommentStartExp) && match) {
      isChars = false;
      html = html.substring(match[0].length);
      pushChild(new AstComment(match[1]));
    }

    if (html.startsWith("</")) {
      // 结束标签
      match = html.match(endTagExp); // 匹配结束tag
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
      match = html.match(startTagExp);
      if (match) {
        isChars = false;
        html = html.substring(match[0].length);
        parseStartTag({
          tagName: match.groups!.tagName.toLowerCase(),
          attrs: match.groups!.attributes || "",
          unary: !!match.groups!.unary,
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
    unary,
  }: {
    tagName: string;
    attrs: string;

    /**
     * 是否为自闭和标签,最后那个匹配(\/?)的分组
     */
    unary: boolean;
  }) {
    const astElement: AstElement = new AstElement({
      name: tagName,
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
