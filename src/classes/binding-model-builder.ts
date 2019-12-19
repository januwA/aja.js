import { AjaModel } from "./aja-model";
import {
  toArray,
  getCheckboxRadioValue,
  findModelAttr,
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
import { autorun } from "mobx";
import { getData, setData } from "../core";

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
    this.node.removeAttribute(this.modelAttr!.name);
  }

  setup(contextData: ContextData) {
    if (!this.modelAttr || !this.modelAttr.value) return;
    if (inputp(this.node) || textareap(this.node)) {
      if (checkboxp(this.node as HTMLInputElement)) {
        this.checkbox = this.node as HTMLInputElement;
        const data = getData(this.modelAttr.value, contextData);
        autorun(() => {
          this._checkboxSetup(data);
        });
        this._checkboxChangeListener(data, contextData);
      } else if (radiop(this.node as HTMLInputElement)) {
        this.radio = this.node as HTMLInputElement;
        autorun(() => {
          this._radioSetup(getData(this.modelAttr!.value, contextData));
        });

        this._radioChangeListener(contextData);
      } else {
        this.input = this.node as HTMLInputElement;
        autorun(() => {
          this._inputSetup(getData(this.modelAttr!.value, contextData));
        });
        this._inputChangeListener(contextData);
      }
    } else if (selectp(this.node)) {
      this.select = this.node as HTMLSelectElement;
      setTimeout(() => {
        autorun(() => {
          this._selectSetup(getData(this.modelAttr!.value, contextData));
        });
      });

      this._selectChangeListener(contextData);
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
          else (data as {
            [remove: string]: any
          }).remove(ivalue);
        } else {
          if (this.modelAttr)
            setData(this.modelAttr.value, this.checkbox.checked, contextData);
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
        if (this.modelAttr) setData(this.modelAttr.value, newData, contextData);
      });
    }
  }

  private _inputSetup(value: any) {
    if (this.input) {
      this.input.value = value;
    }
  }

  private _inputChangeListener(contextData: ContextData) {
    if (this.input) {
      // 值发生变化了
      this.input.addEventListener(EventType.input, () => {
        if (this.input && this.modelAttr) {
          AjaModel.valueChange(this.input);
          AjaModel.checkValidity(this.input);
          setData(this.modelAttr.value, this.input.value, contextData);
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
        if (this.select && this.modelAttr) {
          const bindKey = this.modelAttr.value;
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
