import { AjaModel } from "./aja-model";
import { hasStructureDirective, toArray, emptyString } from "../utils/util";
import { tempvarp, elementNodep } from "../utils/p";
import { tempvarExp } from "../utils/exp";

export interface TemplateVariableInterface {
  [key: string]: ChildNode | Element | HTMLElement | AjaModel;
}

export class BindingTempvarBuilder {
  /**
   * * 模板变量保存的DOM
   */
  templateVariables: TemplateVariableInterface = {};

  constructor(
    node: HTMLElement,
    templateVariables: TemplateVariableInterface = {}
  ) {
    // 浅克隆
    Object.assign(this.templateVariables, templateVariables);
    this.deepParse(node);
  }

  has(key: string): boolean {
    return key.toLowerCase() in this.templateVariables;
  }

  get(key: string) {
    return this.templateVariables[key];
  }

  set(key: string, value: any) {
    this.templateVariables[key] = value;
  }

  copyWith(node: HTMLElement) {
    return new BindingTempvarBuilder(node, this.templateVariables);
  }

  /**
   * * 解析模板引用变量
   * @param root
   */
  private deepParse(root: HTMLElement) {
    // 如果有结构指令，则跳过
    if (!hasStructureDirective(root)) {
      toArray(root.attributes)
        .filter(({ name }) => tempvarp(name))
        .forEach(attr => {
          this._tempvarBindHandle(root, attr);
        });

      toArray(root.childNodes).forEach(itemNode => {
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
    if (value === "ajaModel") {
      // 表单元素才绑定 ajaModel
      this.set(_key, new AjaModel(node as HTMLInputElement));
    } else {
      this.set(_key, node);
    }
    node.removeAttribute(name);
  }
}
