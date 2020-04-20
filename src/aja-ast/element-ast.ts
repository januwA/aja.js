import { attrp, eventp, modelp } from "../utils/p";
import { DirectiveFactory } from "../factory/directive-factory";
import {
  getAnnotations,
  parseParamtypes,
  getPropMetadata,
  parsePipe,
  EMPTY_STRING,
  trim,
} from "../utils/util";
import { autorun } from "../aja-mobx";
import { usePipes } from "../factory/pipe-factory";
import { getData } from "../core";
import { ContextData } from "../classes/context-data";
import {
  attrStartExp,
  attrEndExp,
  eventStartExp,
  eventEndExp,
} from "../utils/exp";
import { templateEvent } from "../utils/const-string";

abstract class AstHtmlBase {
  /**
   * 拼接为html字符串
   */
  abstract toString(): string;

  /**
   * 返回DOM元素
   */
  abstract toElement(contextData: ContextData): HTMLElement | Text | Comment;
}

/**
 * 所有的自闭和标签
 */
const SELFCLOSING = [
  "br",
  "hr",
  "area",
  "base",
  "img",
  "input",
  "link",
  "meta",
  "basefont",
  "param",
  "col",
  "frame",
  "embed",
  "keygen",
  "source",
  "command",
  "track",
  "wbr",
];

const interpolationExpressionExp = /{{\s*([^]+)\s*}}/g;

// children可能包含的类型
export type childType = AstText | AstElement | AstComment;

function createElement(
  vnode: childType,
  contextData: ContextData
): Text | Element | Comment {
  if (vnode instanceof AstText) {
    return vnode.createTextNode(contextData);
  }
  if (vnode instanceof AstComment) {
    return document.createComment(vnode.data);
  }
  const { name, attrbutes, children } = vnode;

  // 创建dom
  const el = document.createElement(name);

  let isStopParseChildren = false;
  // 先解析attrs
  attrbutes.forEach((it) =>
    it.toDom(el, contextData, () => {
      isStopParseChildren = true;
    })
  );

  if (isStopParseChildren) return el;

  // 在解析子元素
  children
    .map((it) => createElement(it, contextData))
    .forEach((node) => el.appendChild(node));
  return el;
}

export class AstText extends AstHtmlBase {
  value: string;

  constructor(value: string) {
    super();
    this.value = this._replaceStartAndEndSpeace(value);
  }

  toString() {
    return `${this.value}`;
  }
  contextData?: ContextData;

  toElement(contextData: ContextData): Text {
    return createElement(this, contextData) as Text;
  }

  private _getPipeData(key: string) {
    const [bindKey, pipeList] = parsePipe(key);
    const data = getData(bindKey, this.contextData!);
    return usePipes(data, pipeList, this.contextData!);
  }

  createTextNode(contextData: ContextData): Text {
    this.contextData = contextData;
    const text = document.createTextNode(this.value);
    if (this.isConputed) {
      autorun(() => {
        const textContent = this.value.replace(
          interpolationExpressionExp,
          (match, g1) => {
            const pipeData = this._getPipeData(g1);
            return pipeData;
          }
        );
        text.textContent = textContent;
      });
    }
    return text;
  }

  /**
   *
   * 是否存在插值表达式
   * 'hello'        => fasle
   * '{{ hello }}'  => true
   */
  get isConputed() {
    return this.value.match(interpolationExpressionExp) !== null;
  }

  /**
   * 如果首尾空格的空格大于一个，那么全部替换为一个空格
   */
  private _replaceStartAndEndSpeace(v: string) {
    return v.replace(/^\s{2,}/, " ").replace(/\s{2,}$/, " ");
  }
}

export class AstAttrbute {
  constructor(readonly name: string, readonly value: string) {}

  toString() {
    return `${this.name}="${this.value}"`;
  }

  /**
   * [name]="name"
   * [class.select]="true"
   */
  get isInput(): boolean {
    return attrp(this.name);
  }

  /**
   * (click)="action($event)"
   */
  get isOutput(): boolean {
    return eventp(this.name);
  }

  /**
   * 结构指令
   * *if="show"
   */
  get isStructuredDirective() {
    return this.name.charAt(0) === "*";
  }

  /**
   * 双向绑定
   * [(subtitle)]="subtitle"
   */
  get isModel() {
    return modelp(this.name);
  }

  /**
   * 有些attr可能是这种情况
   *
   * ```html
   * <p [class.select]="true">hello world</p>
   * ```
   */
  parseAttr() {
    // [style.coloe] => [style, coloe]
    const [attrName, attrChild] = this.name
      .replace(attrStartExp, "")
      .replace(attrEndExp, "")
      .split(".");
    return { attrName, attrChild };
  }

  /**
   * (click) -> click
   */
  get eventType() {
    return this.name
      .replace(eventStartExp, EMPTY_STRING)
      .replace(eventEndExp, EMPTY_STRING);
  }

  /**
   * (click)="hello"
   * (click)="hello()"
   * (click)="hello($event)"
   * (click)="hello($event, 1)"
   */
  parseEventValue() {
    let funcName = this.value;
    let args: string[] = [];
    // TODO: 这部分的逻辑和正则可以优化
    if (this.value.includes("(")) {
      // 带参数的函数
      const index = this.value.indexOf("(");

      // 砍出函数名
      funcName = this.value.substr(0, index);

      // 砍掉函数名
      // 去掉首尾圆括号
      // 用逗号分割参数
      args = this.value
        .substr(index)
        .trim()
        .replace(/(^\(*)|(\)$)/g, EMPTY_STRING)
        .split(",")
        .map(trim);
    }
    return { funcName, args };
  }

  /**
   * 是否为指令
   */
  get isNotNativeAttr(): boolean {
    return this.isInput || this.isModel || this.isStructuredDirective;
  }

  private stopParseChildren?: () => void;
  private host?: HTMLElement;
  private contextData?: ContextData;

  /**
   * 解析自己，设置到host上
   * @param host
   * @param contextData
   * @param stopParseChildren  调用这个函数，会立即停止解析子元素
   */
  toDom(
    host: HTMLElement,
    contextData: ContextData,
    stopParseChildren: () => void
  ) {
    this.host = host;
    this.contextData = contextData;
    this.stopParseChildren = stopParseChildren;

    if (this.isNotNativeAttr) {
      this._parseDirective();
    } else if (this.isOutput) {
      this._bindEvent();
    } else {
      host.setAttribute(this.name, this.value);
    }
  }

  private _bindEvent() {
    const { funcName, args } = this.parseEventValue();
    const transformArgs = (e: Event) => {
      return args.map((arg) => {
        if (!arg) return arg;
        if (arg === templateEvent) return e;
        return getData(arg, this.contextData!);
      });
    };
    this.host?.addEventListener(this.eventType, (e: Event) => {
      try {
        getData(funcName, this.contextData!)(...transformArgs(e));
      } catch (error) {
        throw `${funcName} 函数未定义.`;
      }
    });
  }

  private _setNativeAttribute() {
    if (!this.host || !this.contextData) return;
    const { attrName, attrChild } = this.parseAttr();
    const [bindKey, pipeList] = parsePipe(this.value);

    autorun(() => {
      const v = usePipes(
        getData(bindKey, this.contextData!),
        pipeList,
        this.contextData!
      );
      this.host!.setAttribute(attrName, v);
    });
  }

  private _parseDirective() {
    if (!this.host || !this.contextData) return;
    const { attrName, attrChild } = this.parseAttr();
    const select = attrChild ? `[${attrName}]` : this.name;

    // TODO: 优化这里的代码
    if (select === "[innerHTML]") this.stopParseChildren!();

    const directiveClass = new DirectiveFactory(select).value;
    if (!directiveClass) {
      try {
        this._setNativeAttribute();
      } catch (er) {
        return console.error(`未找到指令${this.name}的解析器，请注册.`);
      }
      return;
    }
    // 获取类装饰器数据
    const { paramtypes } = getAnnotations(directiveClass);
    const args = parseParamtypes(paramtypes, { host: this.host });
    const directive = new directiveClass(...args);

    // 获取属性装饰器数据
    const props = getPropMetadata(directive.constructor);
    for (const key in props) {
      if (!props.hasOwnProperty(key)) {
        continue;
      }
      const [bindKey, pipeList] = parsePipe(this.value);
      autorun(() => {
        const v = usePipes(
          getData(bindKey, this.contextData!),
          pipeList,
          this.contextData!
        );
        directive[key] = attrChild ? { [attrChild]: v } : v;
      });
    }
  }
}

export class AstElement extends AstHtmlBase {
  name: string;
  attrbutes: AstAttrbute[];
  inputs: AstAttrbute[];
  outputs: AstAttrbute[];
  models: AstAttrbute[];
  directives: AstAttrbute[];
  children: Array<childType>;

  constructor({
    name,
    attrbutes = [],
    inputs = [],
    outputs = [],
    children = [],
    directives = [],
    models = [],
  }: {
    name: string;
    attrbutes?: AstAttrbute[];
    inputs?: AstAttrbute[];
    outputs?: AstAttrbute[];
    models?: AstAttrbute[];
    directives?: AstAttrbute[];
    children?: childType[];
  }) {
    super();
    this.name = name;
    this.attrbutes = attrbutes;
    this.inputs = inputs;
    this.outputs = outputs;
    this.children = children;
    this.directives = directives;
    this.models = models;
  }

  /**
   * 判断是否为自闭和标签
   */
  get isSelfClosing() {
    return SELFCLOSING.indexOf(this.name) !== -1;
  }

  toElement(contextData: ContextData): HTMLElement {
    return createElement(this, contextData) as HTMLElement;
  }

  setAttr(attr: AstAttrbute) {
    this.attrbutes.push(attr);
    if (attr.isInput) this.inputs.push(attr);
    if (attr.isOutput) this.outputs.push(attr);
    if (attr.isModel) this.models.push(attr);
    if (attr.isStructuredDirective) this.directives.push(attr);
  }

  toString() {
    let htmlString = ``;
    let attrs = this.attrbutes.reduce(
      (acc, item) => (acc += ` ${item.toString()}`),
      ""
    );

    if (this.isSelfClosing) {
      htmlString = `<${this.name}${attrs}>`;
    } else {
      htmlString = `<${this.name}${attrs}>${this.children
        .map((e) => e.toString())
        .join("")}</${this.name}>`;
    }
    return htmlString;
  }
}

export class AstComment extends AstHtmlBase {
  constructor(readonly data: string) {
    super();
  }
  toString(): string {
    return `<!--${this.data}-->`;
  }

  toElement(contextData: ContextData): Comment {
    return createElement(this, contextData) as Comment;
  }
}

export class AstRoot {
  constructor(public readonly nodes: childType[]) {}

  toElement(root: HTMLElement, contextData: ContextData): HTMLElement {
    this.nodes
      .map((it) => it.toElement(contextData))
      .forEach((it) => root.append(it));
    return root;
  }

  toString() {
    return this.nodes.reduce((acc, el) => (acc += el.toString()), "");
  }
}
