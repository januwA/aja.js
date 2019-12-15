import { AjaModel } from "./aja-model";
import { toArray, getCheckboxRadioValue } from "../utils/util";
import {
  radiop,
  selectp,
  textareap,
  inputp,
  checkboxp,
  arrayp
} from "../utils/p";
import { Store } from "../store";
import { SetDataCallBack } from "../aja";

export class BindingModelBuilder {
  // input / textarea
  input: HTMLInputElement | undefined;
  checkbox: HTMLInputElement | undefined;
  radio: HTMLInputElement | undefined;
  select: HTMLSelectElement | undefined;

  get options(): HTMLOptionElement[] {
    if (!this.select) return [];
    return toArray(this.select.options);
  }

  get selectValues(): string[] {
    return this.options.filter(op => op.selected).map(op => op.value);
  }

  constructor(public node: HTMLElement, public modelAttr: Attr) {
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
    this.node.addEventListener("blur", () => {
      this.touched();
    });
    this.node.removeAttribute(this.modelAttr.name);
  }

  checkboxSetup(states: any[], isArray: boolean) {
    if (this.checkbox) {
      if (isArray) {
        const data = states[0];
        let ivalue = getCheckboxRadioValue(this.checkbox);
        const checkde = data.some((d: any) => d === ivalue);
        this.checkbox.checked = checkde;
      } else {
        this.checkbox.checked = !!states[0];
      }
    }
  }

  checkboxChangeListener(
    isArray: boolean,
    data: any,
    setData: SetDataCallBack
  ) {
    if (this.checkbox) {
      this.checkbox.addEventListener("change", () => {
        if (!this.checkbox) return;
        if (isArray) {
          let ivalue = getCheckboxRadioValue(this.checkbox);
          if (this.checkbox.checked) data.push(ivalue);
          else data.remove((d: any) => d === ivalue);
        } else {
          setData(this.checkbox.checked);
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

  radioChangeListener(setData: SetDataCallBack) {
    if (this.radio) {
      this.radio.addEventListener("change", () => {
        if (!this.radio) return;
        let newData = getCheckboxRadioValue(this.radio);
        this.radio.checked = true;
        this.dirty();
        setData(newData);
      });
    }
  }

  inputSetup(states: any[]) {
    if (this.input) {
      this.input.value = states[0];
    }
  }
  inputChangeListener(setData: SetDataCallBack) {
    if (this.input) {
      // 值发生变化了
      this.input.addEventListener("input", () => {
        this.dirty();
        setData(this.input?.value);
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

  selectChangeListener(setData: SetDataCallBack) {
    if (this.select) {
      this.select.addEventListener("change", () => {
        if (this.select?.multiple) {
          setData(Store.list(this.selectValues));
        } else {
          setData(this.select?.value);
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
