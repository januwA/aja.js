import {
  AstTextAttrbute,
  AstReference,
  AstBoundAttrbute,
  AstBoundEvent,
  MethodCall,
  PropertyRead,
  BindingPipe,
} from "./ast-attrbute";
import { ContextData } from "../classes/context-data";
import { AstHtmlBase } from "./ast-html-base";
import { childType } from "./child-type";
import { referencep, attrp, eventp, modelp } from "../utils/p";
import { DirectiveFactory } from "../factory/directive-factory";
import {
  getAnnotations,
  parseParamtypes,
  getPropMetadata,
} from "../utils/util";
import { autorun } from "../aja-mobx";
import { usePipes } from "../factory/pipe-factory";
import { getData } from "../core";

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

export class AstElement extends AstHtmlBase<HTMLElement> {
  host!: HTMLElement;
  contextData!: ContextData;

  name: string;
  attrbutes: AstTextAttrbute[];
  inputs: AstBoundAttrbute[];
  outputs: AstBoundEvent[];

  /**
   * 存结构指令
   *
   * ```
   * *ngIf="heroes.length"
   * ```
   *
   * TODO: 定义类型
   */
  templateAttrs: any[];
  references: AstReference[];
  children: Array<childType>;

  constructor({
    name,
    attrbutes = [],
    inputs = [],
    outputs = [],
    children = [],
    references = [],
    templateAttrs = [],
  }: {
    name: string;
    attrbutes?: AstTextAttrbute[];
    inputs?: AstBoundAttrbute[];
    outputs?: AstBoundEvent[];
    references?: AstReference[];
    children?: childType[];
    templateAttrs?: any[];
  }) {
    super();
    this.name = name;
    this.attrbutes = attrbutes;
    this.inputs = inputs;
    this.outputs = outputs;
    this.children = children;
    this.references = references;
    this.templateAttrs = templateAttrs;
  }

  /**
   * 判断是否为自闭和标签
   */
  get isSelfClosing() {
    return SELFCLOSING.indexOf(this.name) !== -1;
  }

  /**
   * 在ast解析期间，解析模板上绑定的属性
   * @param name
   * @param value
   */
  setAttr(name: string, value: string) {
    if (referencep(name)) {
      this.references.push(new AstReference(name, value));
      return;
    }

    if (attrp(name)) {
      this.inputs.push(new AstBoundAttrbute(name, value));
      return;
    }

    if (eventp(name)) {
      this.outputs.push(new AstBoundEvent(name, value));
      return;
    }

    if (name.charAt(0) === "*") {
      //TODO: 处理*语法糖模板
      this.templateAttrs.push(new AstBoundAttrbute(name, value));
    }

    if (modelp(name)) {
      //TODO: 处理双向绑定的情况
      this.inputs.push(new AstBoundAttrbute(name, value));
      this.outputs.push(new AstBoundEvent(name, value));
      return;
    }

    this.attrbutes.push(new AstTextAttrbute(name, value));
  }

  createHost<T>(contextData: ContextData): T {
    this.contextData = contextData;
    this.host = document.createElement(this.name);
    // 解析属性
    this._parseAttrbute();
    this._parseInputs();
    this._parseOutputs();
    //TODO: 处理references,templateAttrs
    // 解析children
    this._parseChildren();
    return this.host as any;
  }

  private _parseAttrbute() {
    this.attrbutes.forEach((it) => {
      this.host.setAttribute(it.name, it.value);
    });
  }
  private _parseInputs() {
    this.inputs.forEach((it) => {
      const select = `[${it.name}]`;
      if (select === "[innerHTML]") {
        // TODO: 停止继续解析
      }

      // 获取指令解析器
      const directiveClass = new DirectiveFactory(select).value;
      if (!directiveClass) {
        throw new Error(`未找到指令${select}的解析器，请注册.`);
      }

      // 获取类装饰器数据
      const { paramtypes } = getAnnotations(directiveClass);
      const args = parseParamtypes(paramtypes, { host: this.host });
      const directive = new directiveClass(...args);

      // 获取属性装饰器数据
      //? @Input 这种属性装饰器
      const props = getPropMetadata(directive.constructor);
      for (const key in props) {
        if (it.value.ast instanceof MethodCall) {
          directive[key] = getData(
            it.value.ast.name,
            this.contextData!
          )(it.value.ast.args.map((e) => getData(e, this.contextData!)));
        } else if (it.value.ast instanceof PropertyRead) {
          autorun(() => {
            const v = getData(
              (<PropertyRead>it.value.ast).name,
              this.contextData
            );
            directive[key] = it.type !== 0 ? { [it.name]: v } : v;
          });
        } else if (it.value.ast instanceof BindingPipe) {
          autorun(() => {
            const ast = <BindingPipe>it.value.ast;
            const v = usePipes(
              getData(ast.exp, this.contextData!),
              ast.pipeList,
              this.contextData
            );
            directive[key] = it.type !== 0 ? { [it.name]: v } : v;
          });
        }
      }
    });
  }
  private _parseOutputs() {
    const transformArgs = (args: any[], e: Event) => {
      return args.map((arg) => {
        if (!arg) return arg;
        if (arg === "$event") return e;
        return getData(arg, this.contextData);
      });
    };

    this.outputs.forEach((it) => {
      if (!(it.handle.ast instanceof MethodCall)) return;
      const ast = <MethodCall>it.handle.ast;

      //TODO: 只处理了默认dom事件，自定义事件还没处理
      this.host.addEventListener(it.name, (e: Event) => {
        try {
          getData(ast.name, this.contextData)(...transformArgs(ast.args, e));
        } catch (error) {
          throw new Error(`${ast.name} 函数未定义.`);
        }
      });
    });
  }
  private _parseReferences() {}
  private _parseTemplateAttrs() {}
  private _parseChildren() {
    this.children.forEach((it) =>
      this.host.appendChild(it.createHost(this.contextData))
    );
  }

  toString() {
    //TODO: 记录下匹配时的,起始位置和结束位置
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
