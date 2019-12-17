import { AjaModel } from "./aja-model";
import { hasStructureDirective, toArray, emptyString } from "../utils/util";
import { tempvarp } from "../utils/p";
import { tempvarExp } from "../utils/exp";

export class BindingTempvarBuilder {
  /**
   * * 模板变量保存的DOM
   */
  private static readonly _templateVariables: {
    [key: string]: ChildNode | Element | HTMLElement | AjaModel;
  } = {};

  static has(key: string): boolean {
    return key.toLowerCase() in this._templateVariables;
  }

  static get(key: string) {
    return this._templateVariables[key];
  }

  static set(key: string, value: any) {
    if (this.has(key)) return;
    this._templateVariables[key] = value;
  }

  /**
   * * 解析模板引用变量
   * @param root
   */
  static deepParse(root: HTMLElement) {
    // 如果有结构指令，则跳过
    if (!hasStructureDirective(root)) {
      toArray(root.attributes)
        .filter(({ name }) => tempvarp(name))
        .forEach(attr => {
          this._tempvarBindHandle(root, attr);
        });

      toArray(root.children).forEach(node =>
        this.deepParse(node as HTMLElement)
      );
    }
  }

  /**
   * * 处理模板变量 #input 解析
   * @param node
   * @param param1
   */
  private static _tempvarBindHandle(
    node: HTMLElement,
    { name, value }: Attr
  ): void {
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
