import { EventType } from "../utils/const-string";
import { observable } from "mobx";

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

  /**
   * * 初始化class服务
   * @param node
   */
  static classListSetup(node: HTMLElement) {
    node.classList.add(AjaModel.classes.untouched, AjaModel.classes.pristine);
    this.checkValidity(node as HTMLInputElement);
  }

  /**
   * * 验证节点的值
   * @param node
   */
  static checkValidity(node: HTMLElement) {
    if ("checkValidity" in node) {
      const inputNode = <HTMLInputElement>node;
      const ok = inputNode.checkValidity();
      inputNode.classList.toggle(AjaModel.classes.valid, ok);
      inputNode.classList.toggle(AjaModel.classes.invalid, !ok);
      return ok;
    }
  }

  /**
   * * 节点的值发生了变化
   * @param node
   */
  static valueChange(node: HTMLElement) {
    node.classList.replace(AjaModel.classes.pristine, AjaModel.classes.dirty);
  }

  /**
   * * 节点被访问
   */
  static touched(node: HTMLElement) {
    node.classList.replace(
      AjaModel.classes.untouched,
      AjaModel.classes.touched
    );
  }

  get model(): string {
    return this.node.value;
  }

  /**
   * * 跟踪绑定到指令的名称。父窗体使用此名称作为键来检索此控件的值。
   */
  get name(): any {
    return this.node.name || null;
  }

  get value() {
    return this.node.value;
  }

  /**
   * * 跟踪控件是否被禁用
   */
  get disabled(): boolean {
    return this.node.disabled;
  }

  get enabled(): boolean {
    return !this.disabled;
  }

  control: {
    [k: string]: any;
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
    AjaModel.classListSetup(node);
    this.control = observable({
      touched: this.node.classList.contains(AjaModel.classes.touched),
      untouched: this.node.classList.contains(AjaModel.classes.untouched),

      dirty: this.node.classList.contains(AjaModel.classes.dirty),
      pristine: this.node.classList.contains(AjaModel.classes.pristine),

      valid: this.node.classList.contains(AjaModel.classes.valid),
      invalid: this.node.classList.contains(AjaModel.classes.invalid)
    });
    this._setup();
  }

  private _setup() {
    // 值发生变化了
    this.node.addEventListener(EventType.input, () => {
      this.control.pristine = false;
      this.control.dirty = true;
      AjaModel.valueChange(this.node);

      const ok = AjaModel.checkValidity(this.node);
      if (ok) {
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
    this.node.addEventListener(EventType.blur, () => {
      this.control.untouched = false;
      this.control.touched = true;
      AjaModel.touched(this.node);
    });
  }
}
