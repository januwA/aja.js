import { AjaWidget } from "./aja-widget";
import { Type } from "../aja";

export abstract class AjaModule {

    /**
     * 属于此模块的一组组件，[指令: 暂时没有这个]和管道（可声明）
     */
    declarations?: any[] = [];

    /**
     * 导入模块中的导出
     */
    imports?: any[] = [];

    /**
     * 根组件
     */
    bootstrap?: Type<AjaWidget>;

    /**
     * 在此Module中声明的组件，指令和管道的集合，
     * 可在作为导入此Module的一部分的任何组件的模板中使用。 
     * 导出的声明是模块的公共API。
     */
    exports?: any[] = [];
}