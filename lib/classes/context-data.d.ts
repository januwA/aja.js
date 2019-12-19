import { BindingTempvarBuilder } from "./binding-tempvar-builder";
export interface ContextDataOptions {
    /**
     * * 用户通过state传递进来，被代理的数据
     */
    globalState: any;
    /**
     * * 结构型指令产生的上下文变量
     */
    contextState?: any;
    /**
     * * 模板引用变量上下文, 也将被结构型指令分割
     */
    tvState: any;
    /**
     * * for结构指令，默认的上下文变量
     * :for="of arr" -> :for="$_ of arr"
     * for -> $_
     *   for -> $__
     *     ...
     */
    forLet?: string;
}
export declare class ContextData {
    /**
     * * for结构指令，默认的上下文变量
     * :for="of arr" -> :for="$_ of arr"
     * for -> $_
     *   for -> $__
     *     ...
     */
    forLet: string;
    /**
     * * 用户通过state传递进来，被代理的数据
     */
    globalState: any;
    /**
     * * 结构型指令产生的上下文变量
     */
    contextState?: {
        [k: string]: any;
    };
    /**
     * * 模板引用变量上下文, 也将被结构型指令分割
     */
    tvState: BindingTempvarBuilder;
    constructor(options: ContextDataOptions);
    copyWith(options: {
        globalState?: any;
        contextState?: any;
        tvState?: any;
        forLet?: string;
    }): ContextData;
}
