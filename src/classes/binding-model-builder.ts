import { AjaModel } from "./aja-model";
import {
  toArray,
  getCheckboxRadioValue,
  setData,
  findModelAttr
} from "../utils/util";
import {
  radiop,
  selectp,
  textareap,
  inputp,
  checkboxp,
  arrayp
} from "../utils/p";
import { EventType, modelDirective } from "../utils/const-string";
import { ContextData } from "./context-data";

export class BindingModelBuilder {
  // input / textarea
  input?: HTMLInputElement;
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

  modelAttr?: Attr;

  constructor(public node: HTMLElement) {
    this.modelAttr = findModelAttr(node, modelDirective);
    if (!this.modelAttr) return;
    this._setup();
  }
  private _setup() {
    if (inputp(this.node) || textareap(this.node)) {
      if (checkboxp(this.node as HTMLInputElement)) {
        this.checkbox = this.node as HTMLInputElement;
      } else if (radiop(this.node as HTMLInputElement)) {
        this.radio = this.node as HTMLInputElement;
      } else {
        this.input = this.node as HTMLInputElement;
      }
    } else if (selectp(this.node)) {
      this.select = this.node as HTMLSelectElement;
    }
    this.node.classList.add(
      AjaModel.classes.untouched,
      AjaModel.classes.pristine,
      AjaModel.classes.valid
    );

    // 控件被访问了
    // 所有绑定的model的元素，都会添加这个服务
    this.node.addEventListener(EventType.blur, () => {
      this.touched();
    });
    this.node.removeAttribute(this.modelAttr!.name);
  }

  checkboxSetup(data: any) {
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

  checkboxChangeListener(data: any, contextData: ContextData) {
    if (this.checkbox) {
      this.checkbox.addEventListener(EventType.change, () => {
        if (!this.checkbox) return;
        if (arrayp(data)) {
          let ivalue = getCheckboxRadioValue(this.checkbox);
          if (this.checkbox.checked) data.push(ivalue);
          else data.remove(ivalue);
        } else {
          if (this.modelAttr)
            setData(this.modelAttr.value, this.checkbox.checked, contextData);
        }
        this.dirty();
      });
    }
  }

  radioSetup(states: any[]) {
    if (this.radio) {
      this.radio.checked = states[0] === this.radio.value;
    }
  }

  radioChangeListener(contextData: ContextData) {
    if (this.radio) {
      this.radio.addEventListener(EventType.change, () => {
        if (!this.radio) return;
        let newData = getCheckboxRadioValue(this.radio);
        this.radio.checked = true;
        this.dirty();
        if (this.modelAttr) setData(this.modelAttr.value, newData, contextData);
      });
    }
  }

  inputSetup(states: any[]) {
    if (this.input) {
      this.input.value = states[0];
    }
  }
  inputChangeListener(contextData: ContextData) {
    if (this.input) {
      // 值发生变化了
      this.input.addEventListener(EventType.input, () => {
        this.dirty();
        if (this.modelAttr)
          setData(this.modelAttr.value, this.input?.value, contextData);
      });
    }
  }

  selectSetup(states: any[]) {
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

  selectChangeListener(contextData: ContextData) {
    if (this.select) {
      this.select.addEventListener(EventType.change, () => {
        if (this.select?.multiple) {
          if (this.modelAttr)
            setData(this.modelAttr.value, this.selectValues, contextData);
        } else {
          if (this.modelAttr)
            setData(this.modelAttr.value, this.select?.value, contextData);
        }
        this.dirty();
      });
    }
  }

  /**
   * * 控件的值有效时
   */
  valid() {
    this.node.classList.replace(
      AjaModel.classes.invalid,
      AjaModel.classes.valid
    );
  }
  /**
   * * 控件的值无效时
   */
  invalid() {
    this.node.classList.replace(
      AjaModel.classes.valid,
      AjaModel.classes.invalid
    );
  }

  /**
   * * 控件的值发生变化
   */
  dirty() {
    this.node.classList.replace(
      AjaModel.classes.pristine,
      AjaModel.classes.dirty
    );
  }

  /**
   * * 控件被访问
   */
  touched() {
    this.node.classList.replace(
      AjaModel.classes.untouched,
      AjaModel.classes.touched
    );
  }
}
