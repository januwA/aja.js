import { EventType } from "../utils/const-string";
import { autorun } from "mobx";
import { AbstractControl } from "../classes/forms";
import { inputp } from "../utils/p";

const l = console.log;


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

  /**
   * * 响应式表单与dom的桥梁
   * * dom <=> FormControl
   */
  constructor(
    public readonly node: HTMLElement,
    public control: AbstractControl
  ) {
    this.setup();
  }

  /**
   * * 控件 <=> FormControl
   * @param node
   */
  setup() {

    autorun(() => {
      if (inputp(this.node)) {
        this.node.value = this.control.value;
      }
    })

    // 控件同步到formControl
    this._h5CheckValidity();

    // 是否禁用
    if (inputp(this.node)) {
      if (this.node.disabled) this.control.disable();
      else this.control.enable();
    }

    // 值发生变化了
    this.node.addEventListener(EventType.input, () => {
      if ("value" in this.node) {
        this.control.setValue((<HTMLInputElement>this.node).value);
      }
      this._h5CheckValidity();
      this.control.markAsDirty();
    });

    // 控件被访问了
    this.node.addEventListener(EventType.blur, () =>
      this.control.markAsTouched()
    );

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

      if (inputp(this.node)) {
        this.node.disabled = this.control.disabled;
      }
    });
  }

  /**
   * * 验证节点的值
   * @param node
   */
  private _h5CheckValidity() {
    if ("checkValidity" in this.node) {
      const inputNode = this.node as HTMLInputElement;
      // 如果控件被禁用，h5将一直返回true
      // 初始化时只会验证required
      // 只有在input期间验证，才会验证到minlength之类的
      const ok = inputNode.checkValidity();
      if (!ok) {
        this.control.setErrors({
          error: inputNode.validationMessage
        });
      }
    }
  }
}
