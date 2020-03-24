import { attrp, eventp, modelp } from "../utils/p";

abstract class AstHtmlBase {
  /**
   * 拼接为html字符串
   */
  abstract toString(): string;

  /**
   * 返回DOM元素
   */
  abstract toElement(): HTMLElement | Text | Comment;
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
  "wbr"
];

const interpolationExpressionExp = /{{\s*([^]+)\s*}}/g;

// children可能包含的类型
export type childType = AstText | AstElement | AstComment;

export interface IAstElement {
  name: string;
  attrbutes?: AstAttrbute[];
  inputs?: AstAttrbute[];
  outputs?: AstAttrbute[];
  models?: AstAttrbute[];
  directives?: AstAttrbute[];
  children?: childType[];
}

function createElement(vnode: childType): Text | Element | Comment {
  if (vnode instanceof AstText) {
    return document.createTextNode(vnode.value);
  }
  if (vnode instanceof AstComment) {
    return document.createComment(vnode.data);
  }
  const { name, attrbutes, children } = vnode;
  const el = document.createElement(name);

  attrbutes.forEach(({ name, value }) => el.setAttribute(name, value));
  children.map(createElement).forEach(node => el.appendChild(node));
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

  toElement(): Text {
    return createElement(this) as Text;
  }

  /**
   *
   * 是否存在插值表达式
   * 'hello'        => fasle
   * '{{ hello }}'  => true
   */
  get isInterpolationExpression() {
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
    models = []
  }: IAstElement) {
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

  toElement(): HTMLElement {
    return createElement(this) as HTMLElement;
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
        .map(e => e.toString())
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

  toElement(): Comment {
    return createElement(this) as Comment;
  }
}
