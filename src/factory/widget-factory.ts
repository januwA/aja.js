import { Type } from "../interfaces";
import { putIfAbsent } from "../utils/util";

/**
 * 存储使用[@Widget]注册的小部件
 */
export class WidgetFactory {
  // 每个widget只是配置
  private _value!: Type<any>;

  // 每次获取只返回一个配置
  public get value(): Type<any> {
    return this._value;
  }

  private static _cache = new Map<String, WidgetFactory>();

  constructor(name: string, widget?: Type<any>) {
    return putIfAbsent(WidgetFactory._cache, name, () =>
      this._constructor(widget as Type<any>)
    );
  }

  private _constructor(value: Type<any>) {
    this._value = value;
    return this;
  }
}
