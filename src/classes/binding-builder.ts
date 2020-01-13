import { ContextData } from "./context-data";
import { getData, setData } from "../core";

import { FormControl, FormGroup } from "./forms";
import { FormControlSerivce } from "../service/form-control.service";
import {
  attrStartExp,
  attrEndExp,
  eventStartExp,
  eventEndExp,
  tempvarExp
} from "../utils/exp";
import {
  emptyString,
  hasStructureDirective,
  getAttrs,
  eachChildNodes,
  toArray,
  getCheckboxRadioValue,
  parsePipe
} from "../utils/util";
import { autorun } from "../aja-mobx";
import { AjaModel } from "./aja-model";
import {
  radiop,
  selectp,
  textareap,
  inputp,
  checkboxp,
  arrayp,
  objectp,
  numberStringp,
  elementNodep,
  tempvarp,
  formp
} from "../utils/p";
import {
  EventType,
  modelDirective,
  formControlAttrName,
  structureDirectives,
  templateEvent,
  modelChangeEvent,
  ajaModelString,
  formGroupAttrName,
  formControlNameAttrName,
  formGroupNameAttrName,
  formArrayNameAttrName,
  switchAttrName
} from "../utils/const-string";
import { AjaModuleProvider } from "./aja-module-provider";
import { AjaWidget } from "./aja-weidget-provider";

const l = console.log;

export class BindingBuilder {
  get name(): string {
    return this.attr.name;
  }
  get value() {
    return this.attr.value.trim();
  }
  constructor(
    public readonly attr: Attr,
    public readonly contextData: ContextData,
    public readonly ajaModule: AjaModuleProvider
  ) {}

  private get _parsePipe() {
    return parsePipe(this.value);
  }

  get bindKey(): string {
    return this._parsePipe[0];
  }

  get pipeList(): string[] {
    return this._parsePipe[1];
  }

  /**
   * 自动将数据使用管道过滤后返回
   */
  getPipeData<T extends any>(): T {
    return this.ajaModule.usePipes(
      getData(this.bindKey, this.contextData),
      this.pipeList,
      this.contextData
    );
  }
}

export class BindingAttrBuilder extends BindingBuilder {
  static parseAttr(
    attr: Attr
  ): {
    attrName: string;
    attrChild: string | undefined;
  } {
    // [style.coloe] => [style, coloe]
    const [attrName, attrChild] = attr.name
      .replace(attrStartExp, emptyString)
      .replace(attrEndExp, emptyString)
      .split(".");
    return { attrName, attrChild };
  }

  get attrName(): string {
    return BindingAttrBuilder.parseAttr(this.attr).attrName;
  }

  get attrChild(): string | undefined {
    return BindingAttrBuilder.parseAttr(this.attr).attrChild;
  }

  constructor(
    public readonly node: HTMLElement,
    public readonly attr: Attr,
    public readonly contextData: ContextData,
    public readonly ajaModuel: AjaModuleProvider
  ) {
    super(attr, contextData, ajaModuel);
    if (this.name === formControlAttrName) {
      // [formControl]
      this._formControlSetup();
    } else if (this.name === formGroupAttrName && formp(this.node)) {
      // [formGroup]
      const formGroup = getData(this.value, this.contextData);
      new FormControlSerivce(this.node, formGroup);
      contextData.formGroup = formGroup;
    } else if (this.name === formControlNameAttrName) {
      // [formControlName]
      if (
        contextData.formGroup &&
        this.value in contextData.formGroup.controls
      ) {
        const formControl = contextData.formGroup.controls[this.value];
        new FormControlSerivce(this.node, formControl);
      }
    } else if (this.name === formGroupNameAttrName) {
      // [formGroupName]
      if (
        contextData.formGroup &&
        this.value in contextData.formGroup.controls
      ) {
        const formGroup = contextData.formGroup.controls[this.value];
        new FormControlSerivce(this.node, formGroup);
        contextData.formGroup = formGroup as FormGroup;
      }
    } else if (this.name === formArrayNameAttrName) {
      // [formArrayName]
      if (
        contextData.formGroup &&
        this.value in contextData.formGroup.controls
      ) {
        const formArray = contextData.formGroup.controls[this.value];
        new FormControlSerivce(this.node, formArray);
      }
    } else if (this.name === switchAttrName) {
      // [switch]
      contextData.switch = {
        value: new BindingBuilder(attr, contextData, this.ajaModuel),
        default: []
      };
    } else {
      // other
      switch (this.attrName) {
        case "style":
          this._styleSetup();
          break;
        case "class":
          this._classSetup();
          break;
        case "html":
          this._innerHTMLSetup();
          break;
        default:
          this._otherAttrSetup();
          break;
      }
    }
    node.removeAttribute(this.name);
  }

  private _formControlSetup() {
    const formControl: FormControl = getData(this.value, this.contextData);
    new FormControlSerivce(this.node, formControl);
  }

  private _styleSetup() {
    autorun(() => {
      let data = this.getPipeData();
      if (this.attrChild && this.attrChild in this.node.style) {
        (this.node.style as { [k: string]: any })[this.attrChild] = data;
      } else {
        const styles: CSSStyleDeclaration = data;
        for (const key in styles) {
          if (Object.getOwnPropertyDescriptor(this.node.style, key)) {
            this.node.style[key] = styles[key];
          }
        }
      }
    });
  }

  private _classSetup() {
    autorun(() => {
      let data = this.getPipeData();
      if (data === null) data = emptyString;
      if (!this.attrChild) {
        if (objectp(data)) {
          for (const klass in data) {
            if (data[klass]) this.node.classList.add(klass);
            else this.node.classList.remove(klass);
          }
        } else {
          this.node.setAttribute(this.attrName, data);
        }
      } else {
        if (data) this.node.classList.add(this.attrChild);
      }
    });
  }

  private _innerHTMLSetup() {
    autorun(() => {
      this.node.innerHTML = this.getPipeData();
    });
  }

  private _otherAttrSetup() {
    autorun(() => {
      let data = this.getPipeData();
      if (data === null) data = emptyString;
      if (data) {
        this.node.setAttribute(this.attrName, data);
      } else {
        this.node.removeAttribute(this.attrName);
      }
    });
  }
}

export class BindingTextBuilder {
  /**
   * * 保存插值表达式的模板，千万不要改变
   */
  public readonly text: string;

  constructor(
    public readonly node: ChildNode,
    public readonly contextData: ContextData,
    public readonly ajaModuel: AjaModuleProvider
  ) {
    this.text = node.textContent || "";
    this._setup();
  }

  _setup() {
    if (!this.text.trim()) return;
    //! 注意[RegExp.test]函数的BUG
    const interpolationExpressionExp = /{{([\S\s]*?)}}/g;
    if (!interpolationExpressionExp.test(this.text)) return;
    autorun(() => {
      const text = this.text.replace(
        interpolationExpressionExp,
        (match, g1) => {
          const pipeData = this.getPipeData(g1);
          return pipeData;
        }
      );
      this.node.textContent = text;
    });
  }

  private getPipeData(key: string) {
    const [bindKey, pipeList] = parsePipe(key);
    const data = getData(bindKey, this.contextData);
    return this.ajaModuel.usePipes(data, pipeList, this.contextData);
  }
}

export class BindingModelBuilder extends BindingBuilder {
  /**
   * 查找一个节点是否包含[(model)]指令
   * 并返回
   */
  static findModelAttr(node: HTMLElement): Attr | undefined {
    if (node.attributes && node.attributes.length) {
      const attrs = toArray(node.attributes);
      return attrs.find(({ name }) => name === modelDirective);
    }
  }

  // input / textarea
  input?: HTMLInputElement | HTMLTextAreaElement;
  checkbox?: HTMLInputElement;
  radio?: HTMLInputElement;
  select?: HTMLSelectElement;

  get options(): HTMLOptionElement[] {
    if (!this.select) return [];
    return toArray(this.select.options);
  }

  get selectValues(): string[] {
    return this.options.filter(op => op.selected).map(op => op.value);
  }

  constructor(
    public readonly node: HTMLElement,
    public readonly attr: Attr,
    public readonly contextData: ContextData,
    public readonly ajaModule: AjaModuleProvider
  ) {
    super(attr, contextData, ajaModule);
    this._setup();
    this.node.removeAttribute(this.name);
  }

  private _setup() {
    if (inputp(this.node) || textareap(this.node)) {
      this.input = this.node;
      autorun(() => {
        if (this.input) this.input.value = this.getPipeData();
      });
      this._inputChangeListener(this.contextData);
    } else if (checkboxp(this.node)) {
      this.checkbox = this.node as HTMLInputElement;
      const data = getData(this.attr.value, this.contextData);
      autorun(() => {
        this._checkboxSetup(data);
      });
      this._checkboxChangeListener(data, this.contextData);
    } else if (radiop(this.node)) {
      this.radio = this.node;
      autorun(() => {
        this._radioSetup(getData(this.attr!.value, this.contextData));
      });

      this._radioChangeListener(this.contextData);
    } else if (selectp(this.node)) {
      this.select = this.node as HTMLSelectElement;
      setTimeout(() => {
        autorun(() => {
          this._selectSetup(getData(this.attr!.value, this.contextData));
        });
      });

      this._selectChangeListener(this.contextData);
    }

    AjaModel.classListSetup(this.node);

    // 控件被访问了
    // 所有绑定的model的元素，都会添加这个服务
    this.node.addEventListener(EventType.blur, () =>
      AjaModel.touched(this.node)
    );
  }

  private _checkboxSetup(data: any) {
    if (this.checkbox) {
      // array 处理数组，否则处理boolean值
      if (arrayp(data)) {
        let ivalue = getCheckboxRadioValue(this.checkbox);
        const checkde = data.some((d: any) => d === ivalue);
        this.checkbox.checked = checkde;
      } else {
        this.checkbox.checked = !!data;
      }
    }
  }

  private _checkboxChangeListener(data: any, contextData: ContextData) {
    if (this.checkbox) {
      this.checkbox.addEventListener(EventType.change, () => {
        if (!this.checkbox) return;
        if (arrayp(data)) {
          let ivalue = getCheckboxRadioValue(this.checkbox);
          if (this.checkbox.checked) data.push(ivalue);
          else
            (data as {
              [remove: string]: any;
            }).remove(ivalue);
        } else {
          if (this.attr)
            setData(this.attr.value, this.checkbox.checked, contextData);
        }
        AjaModel.valueChange(this.checkbox);
      });
    }
  }

  private _radioSetup(states: any[]) {
    if (this.radio) {
      this.radio.checked = states[0] === this.radio.value;
    }
  }

  private _radioChangeListener(contextData: ContextData) {
    if (this.radio) {
      this.radio.addEventListener(EventType.change, () => {
        if (!this.radio) return;
        let newData = getCheckboxRadioValue(this.radio);
        this.radio.checked = true;
        AjaModel.valueChange(this.radio);
        if (this.attr) setData(this.attr.value, newData, contextData);
      });
    }
  }

  private _inputChangeListener(contextData: ContextData) {
    if (this.input) {
      // 值发生变化了
      this.input.addEventListener(EventType.input, () => {
        if (this.input && this.attr) {
          AjaModel.valueChange(this.input);
          AjaModel.checkValidity(this.input);
          setData(this.attr.value, this.input.value, contextData);
        }
      });
    }
  }

  private _selectSetup(states: any[]) {
    if (this.select) {
      const data = states[0];
      const selectOptions = toArray(this.select.options);
      // 多选参数必须为 array
      if (this.select.multiple && arrayp(data)) {
        let notFind = true;
        this.select.selectedIndex = -1;
        this.options.forEach(option => {
          if (data.some((d: any) => d === option.value)) {
            notFind = false;
            option.selected = true;
          }
        });
        if (notFind) this.select.selectedIndex = -1;
      } else {
        // 没找到默认-1
        const index = selectOptions.findIndex(op => op.value === data);
        this.select.selectedIndex = index;
      }
    }
  }

  private _selectChangeListener(contextData: ContextData) {
    if (this.select) {
      this.select.addEventListener(EventType.change, () => {
        if (this.select && this.attr) {
          const bindKey = this.attr.value;
          if (this.select.multiple) {
            setData(bindKey, this.selectValues, contextData);
          } else {
            setData(bindKey, this.select.value, contextData);
          }
          AjaModel.valueChange(this.select);
        }
      });
    }
  }
}

export class BindingIfBuilder extends BindingBuilder {
  static findIfAttr(node: HTMLElement): Attr | undefined {
    return getAttrs(node).find(({ name }) => name === structureDirectives.if);
  }
  static findElseAttr(node: HTMLElement): Attr | undefined {
    return getAttrs(node).find(({ name }) => name === structureDirectives.else);
  }

  /**
   * * 一个注释节点
   */
  commentNode: Comment = document.createComment("");

  /**
   * 重写[value]的解析
   */
  get value() {
    return this.attr.value.split(";")[0];
  }

  get elseBind(): string | undefined {
    let elesBindStr = this.attr.value.split(";")[1];
    if (elesBindStr) {
      return elesBindStr
        .trim()
        .replace(/else/, "")
        .trim();
    }
  }

  elseElement: ChildNode | Element | HTMLElement | undefined;

  constructor(
    attr: Attr,
    public node: HTMLElement,
    public contextData: ContextData,
    public readonly ajaModuel: AjaModuleProvider
  ) {
    super(attr, contextData, ajaModuel);
    this.elseElement = this._getElseElement();
    this.node.before(this.commentNode);
    this.node.removeAttribute(structureDirectives.if);
  }

  checked(show: any) {
    if (show) this._show();
    else this._hide();
    this._updateComment(show);
  }

  private _getElseElement() {
    if (this.elseBind) {
      const el = this.contextData.tData.get(this.elseBind);
      if (el instanceof AjaModel) return;
      return el;
    } else {
      if (this.node.nextElementSibling) {
        const elseAttr = BindingIfBuilder.findElseAttr(
          this.node.nextElementSibling as HTMLElement
        );
        if (elseAttr) {
          this.node.nextElementSibling.removeAttribute(
            structureDirectives.else
          );
          return this.node.nextElementSibling;
        }
      }
    }
  }

  private _show() {
    if (this.elseElement) this.elseElement.replaceWith(this.node);
    this.commentNode.after(this.node);
  }

  private _hide() {
    this.node.replaceWith(this.commentNode);
    if (this.elseElement) this.commentNode.after(this.elseElement);
  }

  private _updateComment(value: any) {
    this.commentNode.data = `{":if": "${value}"}`;
  }
}

export class BindingEventBuilder {
  static parseEventType(attr: Attr) {
    return attr.name
      .replace(eventStartExp, emptyString)
      .replace(eventEndExp, emptyString);
  }

  static parseFun(attr: Attr) {
    let funcName = attr.value;
    let args: string[] = [];
    if (attr.value.includes("(")) {
      // 带参数的函数
      const index = attr.value.indexOf("(");
      // 砍出函数名
      funcName = attr.value.substr(0, index);

      // 砍掉函数名
      // 去掉首尾圆括号
      // 用逗号分割参数
      args = attr.value
        .substr(index)
        .trim()
        .replace(/(^\(*)|(\)$)/g, emptyString)
        .split(",");
    }
    return { funcName, args };
  }

  public type: string;
  public funcName: string;

  constructor(
    public readonly node: HTMLElement,
    public readonly attr: Attr,
    public readonly contextData: ContextData,
    public readonly ajaWidget: AjaWidget
  ) {
    this.type = BindingEventBuilder.parseEventType(attr);

    let { funcName, args } = BindingEventBuilder.parseFun(attr);
    this.funcName = funcName;
    const modelChangep: boolean = attr.name === modelChangeEvent;
    if (modelChangep) this.type = EventType.input;
    if (
      this.ajaWidget &&
      this.funcName in this.ajaWidget &&
      `on${this.type}` in window
    ) {
      // 每次只需把新的event传入就行了
      node.addEventListener(this.type, e => {
        const transitionArgs = this._parseArgsToArguments(args);
        const ff = (<any>this.ajaWidget)[this.funcName];
        const argss = this._parseArgsEvent(
          transitionArgs,
          modelChangep ? (<HTMLInputElement>e.target).value : e
        );
        ff(...argss);
      });
    }
    node.removeAttribute(this.attr.name);
  }

  private _parseArgsToArguments(args: string[]) {
    return args.map(arg => {
      if (!arg) return arg;
      let el = arg.trim().toLowerCase();
      if (el === templateEvent) return el;
      return getData(el, this.contextData);
    });
  }

  private _parseArgsEvent(args: string[], e: any) {
    return args.map(arg => (arg === templateEvent ? e : arg));
  }
}

export class BindingForBuilder extends BindingBuilder {
  /**
   * 查找一个节点是否包含:if指令
   * 并返回
   */
  static findForAttr(node: HTMLElement): Attr | undefined {
    if (node.attributes && node.attributes.length) {
      return getAttrs(node).find(
        ({ name }) => name === structureDirectives.for
      );
    }
  }
  private commentNode: Comment = document.createComment("");
  private fragment: DocumentFragment = document.createDocumentFragment();
  private forBuffer: Node[] = [];
  private _render?: (root: HTMLElement, newContextData: ContextData) => void;
  addRenderListener(
    f: (root: HTMLElement, newContextData: ContextData) => void
  ) {
    this._render = f;
    return this;
  }

  constructor(
    public node: HTMLElement,
    attr: Attr,
    public contextData: ContextData,
    public readonly ajaModuel: AjaModuleProvider
  ) {
    super(attr, contextData, ajaModuel);
    this.node.replaceWith(this.commentNode);
    this.node.removeAttribute(structureDirectives.for);
    return this;
  }

  setup() {
    if (this.isNumberData) {
      const _data = this.ajaModuel.usePipes(
        +this.bindKey,
        this.pipes,
        this.contextData
      );
      this.draw(_data);
    } else {
      autorun(() => {
        let data = getData(this.bindKey, this.contextData);
        data = this.ajaModuel.usePipes(data, this.pipes, this.contextData);
        this.clear();
        this.draw(data);
      });
    }
  }

  private get _forAttrValue(): {
    variable: string;
    variables: string[];
    bindKey: string;
    pipes: string[];
  } {
    // el of arr
    // variable -> el
    // bindKey  -> arr
    const [variable, bindKey] = this.value
      .split(/\bin|of\b/)
      .map(s => s.trim());

    // (index, el) of arr
    // variables -> [index, el]
    let variables: string[] = [];
    if (variable) {
      variables = variable
        .replace(eventStartExp, emptyString)
        .replace(eventEndExp, emptyString)
        .split(",")
        .map(v => v.trim());
    }
    const p = parsePipe(bindKey);
    return {
      variable,
      variables,
      bindKey: p[0],
      pipes: p[1]
    };
  }

  get forVar(): string {
    return this._forAttrValue.variable || this.contextData.forLet;
  }
  get forKey(): string {
    return this._forAttrValue.variables[0] || this.contextData.forLet;
  }
  get forValue(): string | undefined {
    return this._forAttrValue.variables[1];
  }
  get bindKey(): string {
    return this._forAttrValue.bindKey;
  }
  get isNumberData(): boolean {
    return numberStringp(this.bindKey);
  }
  get pipes(): string[] {
    return this._forAttrValue.pipes || [];
  }
  get forLet(): string {
    return this.contextData.forLet + "_";
  }

  /**
   * * 将所有节点插入DOM
   * @param data
   */
  draw(data: any) {
    if (this.isNumberData) {
      new Array(data).fill(undefined).forEach((_, v) => {
        const root = this.createItem();
        const newContextData = this.contextData.copyWith({
          forState: this.createForContextState(v),
          tData: this.contextData.tData.copyWith(this.node),
          forLet: this.forLet
        });
        this._render && this._render(root, newContextData);
      });
    } else {
      for (const k in data) {
        const root = this.createItem();
        const newContextData = this.contextData.copyWith({
          forState: this.createForContextState(k, data[k]),
          tData: this.contextData.tData.copyWith(this.node),
          forLet: this.forLet
        });
        this._render && this._render(root, newContextData);
      }
    }
    this.commentNode.after(this.fragment);
    this._updateComment(data);
  }

  /**
   * * 清除所有节点
   */
  clear() {
    this.forBuffer.forEach(forItem => (<HTMLElement>forItem).remove());
    this.forBuffer = [];
  }

  createForContextState(k: any, v: any = null): {} {
    const forState: { [k: string]: any } = {};
    if (this.isNumberData) {
      forState[this.forVar] = k;
    } else {
      if (this.forKey && this.forValue) {
        forState[this.forKey] = k;
        forState[this.forValue] = v;
      } else if (this.forKey) {
        forState[this.forKey] = v;
      }
    }
    return forState;
  }

  private _updateComment(obj: any) {
    if (arrayp(obj)) obj = obj.slice(0, 6);
    this.commentNode.data = `{":for": "${obj}"}`;
  }

  createItem(): HTMLElement {
    const item = this.node.cloneNode(true);
    this.forBuffer.push(item);
    this.fragment.append(item);
    return item as HTMLElement;
  }
}

export type TemplateVariable = {
  [key: string]: Element | HTMLElement | AjaModel;
};

export class BindingTempvarBuilder {
  /**
   * * 模板变量保存的DOM
   */
  readonly templateVariables: TemplateVariable = {};

  constructor(
    private readonly node: HTMLElement,
    templateVariables: TemplateVariable = {}
  ) {
    // 浅克隆
    Object.assign(this.templateVariables, templateVariables);
    this.deepParse(node);
  }

  has(key: string): boolean {
    return !!this.get(key);
  }

  get(key: string) {
    return this.templateVariables[key];
  }

  set(key: string, value: any) {
    this.templateVariables[key] = value;
  }

  copyWith(node: HTMLElement): BindingTempvarBuilder {
    return new BindingTempvarBuilder(node ?? this.node, this.templateVariables);
  }

  /**
   * * 解析模板引用变量
   * @param root
   */
  private deepParse(root: HTMLElement) {
    // 如果有结构指令，则跳过
    if (!hasStructureDirective(root)) {
      getAttrs(root)
        .filter(({ name }) => tempvarp(name))
        .forEach(attr => this._tempvarBindHandle(root, attr));

      eachChildNodes(root, itemNode => {
        if (elementNodep(itemNode)) this.deepParse(itemNode as HTMLElement);
      });
    }
  }

  /**
   * * 处理模板变量 #input 解析
   * @param node
   * @param param1
   */
  private _tempvarBindHandle(node: HTMLElement, { name, value }: Attr): void {
    const _key = name.replace(tempvarExp, emptyString);
    if (value === ajaModelString) {
      // 表单元素才绑定 ajaModel
      this.set(_key, new AjaModel(node as HTMLInputElement));
    } else {
      this.set(_key, node);
    }
    node.removeAttribute(name);
  }
}

export class BindingSwitchBuilder extends BindingBuilder {
  static findCaseAttr(node: HTMLElement): Attr | undefined {
    if (node.attributes && node.attributes.length) {
      return getAttrs(node).find(
        ({ name }) => name === structureDirectives.case
      );
    }
  }
  static findDefaultAttr(node: HTMLElement): Attr | undefined {
    if (node.attributes && node.attributes.length) {
      return getAttrs(node).find(
        ({ name }) => name === structureDirectives.default
      );
    }
  }

  commentNode: Comment = document.createComment("");

  private _key: number;

  constructor(
    public node: HTMLElement,
    attr: Attr,
    public contextData: ContextData,
    public readonly ajaModuel: AjaModuleProvider
  ) {
    super(attr, contextData, ajaModuel);
    this.node.before(this.commentNode);
    this.node.removeAttribute(structureDirectives.case);
    this.node.removeAttribute(structureDirectives.default);
    this._key = this.contextData.switch?.default.length || 0;
    this._setup();
  }

  private _setup() {
    autorun(() => {
      if (!this.contextData.switch) return;
      const caseData = this.getPipeData();
      const switchData = this.contextData.switch.value.getPipeData();
      if (this.value) {
        // case
        if (caseData === switchData) {
          // show
          this.contextData.switch.default[this._key] = false;
          this.commentNode.after(this.node);
        } else {
          // hide
          this.contextData.switch.default[this._key] = true;
          this.node.replaceWith(this.commentNode);
        }
        this._updateCaseComment(caseData);
      } else {
        // default
        if (this.contextData.switch.default.every(b => b)) {
          // show
          this.commentNode.after(this.node);
        } else {
          // hide
          this.node.replaceWith(this.commentNode);
        }
      }
    });
  }

  private _updateCaseComment(value: any) {
    this.commentNode.data = `{":case": "${value}"}`;
  }
}
