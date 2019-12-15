import { Store } from "../store";

export class AjaModel {
  static classes = {
    // 控件被访问过
    // 一般就是监听blur事件
    touched: "aja-touched", // true
    untouched: "aja-untouched", // false

    // 控件的值变化了
    dirty: "aja-dirty", // true
    pristine: "aja-pristine", // false

    // 控件的值有效
    valid: "aja-valid", // true
    invalid: "aja-invalid" // false
  };

  get model(): string {
    return this.node.value;
  }

  get name(): any {
    return this.node.name;
  }

  get value() {
    return this.node.value;
  }

  get disabled(): boolean {
    return this.node.disabled;
  }

  get enabled(): boolean {
    return !this.disabled;
  }

  control: {
    [k: string]: any;
  } = {
    touched: this.node.classList.contains(AjaModel.classes.touched),
    untouched: this.node.classList.contains(AjaModel.classes.untouched),

    dirty: this.node.classList.contains(AjaModel.classes.dirty),
    pristine: this.node.classList.contains(AjaModel.classes.pristine),

    valid: this.node.classList.contains(AjaModel.classes.valid),
    invalid: this.node.classList.contains(AjaModel.classes.invalid)
  };

  get dirty(): boolean {
    return this.control.dirty;
  }

  get pristine(): boolean {
    return this.control.pristine;
  }

  get valid(): boolean {
    return this.control.valid;
  }
  get invalid(): boolean {
    return this.control.invalid;
  }

  get touched(): boolean {
    return this.control.touched;
  }
  get untouched(): boolean {
    return this.control.untouched;
  }

  constructor(public node: HTMLInputElement) {
    this.control = Store.map(this.control);
    this._setup();
  }

  private _setup() {
    // 值发生变化了
    this.node.addEventListener("input", () => {
      this.control.pristine = false;
      this.control.dirty = true;

      if (this.node.required && this.node.value) {
        // 控件的值有效
        this.control.valid = true;
        this.control.invalid = false;
      } else {
        // 控件的值无效
        this.control.valid = false;
        this.control.invalid = true;
      }
    });

    // 控件被访问了
    this.node.addEventListener("blur", () => {
      this.control.untouched = false;
      this.control.touched = true;
    });
  }
}
