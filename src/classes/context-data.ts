import { BindingTempvarBuilder } from "./binding-builder";
import { FormGroup } from "./forms";

export interface ContextDataOpts {
  /**
   * * 用户通过state传递进来，被代理的数据
   */
  store: any;

  /**
   * * 结构型指令产生的上下文变量
   */
  contextState?: any;

  /**
   * * 模板引用变量上下文, 也将被结构型指令分割
   */
  tData: any;

  /**
   * * for结构指令，默认的上下文变量
   * :for="of arr" -> :for="$_ of arr"
   * for -> $_
   *   for -> $__
   *     ...
   */
  forLet?: string;

  /**
   * * 方便再上下文找到
   */
  formGroup?: FormGroup;
}

export class ContextData {
  /**
   * * for结构指令，默认的上下文变量
   * :for="of arr" -> :for="$_ of arr"
   * for -> $_
   *   for -> $__
   *     ...
   */
  forLet: string = "$_";

  /**
   * * 用户通过state传递进来，被代理的数据
   */
  store: any;

  /**
   * * 结构型指令产生的上下文变量
   */
  contextState?: { [k: string]: any };

  /**
   * * 模板引用变量上下文, 也将被结构型指令分割
   */
  tData: BindingTempvarBuilder;

  formGroup?: FormGroup;

  constructor(options: ContextDataOpts) {
    this.store = options.store;
    if (options.contextState) this.contextState = options.contextState;
    this.tData = options.tData;
    if (options.forLet) this.forLet = options.forLet;
    if (options.formGroup) this.formGroup = options.formGroup;
  }

  copyWith(options: {
    globalState?: any;
    contextState?: any;
    tvState?: any;
    forLet?: string;
    formGroup?: FormGroup;
  }): ContextData {
    return new ContextData({
      store: options.globalState || this.store,
      contextState: options.contextState || this.contextState,
      tData: options.tvState || this.tData,
      forLet: options.forLet || this.forLet,
      formGroup: options.formGroup || this.formGroup
    });
  }
}
