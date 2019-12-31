import { BindingTempvarBuilder, BindingBuilder } from "./binding-builder";
import { FormGroup } from "./forms";

export interface ContextDataSwitch {
  value: BindingBuilder;
  default: boolean[];
}

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

  switch?: ContextDataSwitch;
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
   * * for结构型指令产生的上下文变量
   */
  forState?: { [k: string]: any };

  /**
   * * 模板引用变量上下文, 也将被结构型指令分割
   */
  tData: BindingTempvarBuilder;

  formGroup?: FormGroup;

  switch?: ContextDataSwitch;

  constructor(options: ContextDataOpts) {
    this.store = options.store;
    if (options.contextState) this.forState = options.contextState;
    this.tData = options.tData;
    if (options.forLet) this.forLet = options.forLet;
    if (options.formGroup) this.formGroup = options.formGroup;
    if (options.switch) this.switch = options.switch;
  }

  copyWith(options: {
    store?: any;
    forState?: any;
    tData?: BindingTempvarBuilder;
    forLet?: string;
    formGroup?: FormGroup;
    switch?: ContextDataSwitch;
  }): ContextData {
    return new ContextData({
      store: options.store || this.store,
      contextState: options.forState || this.forState,
      tData: options.tData || this.tData,
      forLet: options.forLet || this.forLet,
      formGroup: options.formGroup || this.formGroup,
      switch: options.switch || this.switch
    });
  }

  mergeData() {
    //? assign 无法拷贝get 计算属性，所以store不能在这里面
    return Object.assign(
      {},
      Object.assign(this.tData.templateVariables || {}, this.forState || {})
    );
  }
}
