import { EventType } from "../utils/const-string";
import { autorun } from "mobx";
import { AbstractControl } from "../classes/forms";

const l = console.log;

/**
 * * 将dom节点和FormControl绑定在一起
 */
export class FormControlSerivce {
  static classes = {
    // 控件被访问过
    touched: "aja-touched", // true
    untouched: "aja-untouched", // false

    // 控件的值变化了
    dirty: "aja-dirty", // true
    pristine: "aja-pristine", // false

    // 控件的值有效
    valid: "aja-valid", // true
    invalid: "aja-invalid" // false
  };

  constructor(
    public readonly node: HTMLElement,
    public control: AbstractControl
  ) {
    this.setup();
  }

  /**
   * * 控件 <=> FormContril
   * @param node
   */
  setup() {
    // 控件同步到formControl
    this._checkValidity();
    // 是否禁用
    if ("disabled" in this.node) {
      const inputNode = this.node as HTMLInputElement;
      if (inputNode.disabled) this.control.disable();
      else this.control.enable();
    }

    // 值发生变化了
    this.node.addEventListener(EventType.input, () => {
      if ("value" in this.node) {
        this.control.setValue((this.node as HTMLInputElement).value);
      }
      this._checkValidity();
      this.control.markAsDirty();
    });

    // 控件被访问了
    this.node.addEventListener(EventType.blur, () =>
      this.control.markAsTouched()
    );

    // formControl同步到控件
    autorun(() => {
      // 这个主要监听setValue()，和初始化时，将新值同步到控件中去
      const inputNode = this.node as HTMLInputElement;
      if (this.control.value !== inputNode.value) {
        inputNode.value = this.control.value;
        this._checkValidity();
      }
    });
    autorun(() => {
      this.node.classList.toggle(
        FormControlSerivce.classes.touched,
        this.control.touched
      );
      this.node.classList.toggle(
        FormControlSerivce.classes.untouched,
        this.control.untouched
      );
      this.node.classList.toggle(
        FormControlSerivce.classes.pristine,
        this.control.pristine
      );
      this.node.classList.toggle(
        FormControlSerivce.classes.dirty,
        this.control.dirty
      );
      this.node.classList.toggle(
        FormControlSerivce.classes.valid,
        this.control.valid
      );
      this.node.classList.toggle(
        FormControlSerivce.classes.invalid,
        this.control.invalid
      );

      const inputNode = this.node as HTMLInputElement;
      if ("disabled" in inputNode) {
        inputNode.disabled = this.control.disabled;
      }
    });
  }

  /**
   * * 验证节点的值
   * * 如果控件被禁用，则不校验
   * @param node
   */
  private _checkValidity() {
    if ("checkValidity" in this.node) {
      const inputNode = this.node as HTMLInputElement;
      // 如果控件被禁用，这将一直返回true
      // 初始化时只会验证required
      // 只有在input期间验证，才会验证到minlength之类的
      const ok = inputNode.checkValidity();
      l(ok);
      if (ok) {
        // h5验证完后启用内置的验证
        this.control.updateValueAndValidity();
      } else {
        this.control.setErrors({
          error: inputNode.validationMessage
        });
      }
    }
  }
}
