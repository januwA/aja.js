import { Type } from "../interfaces";
import { putIfAbsent } from "../utils/util";

/**
 * 所有指令工厂
 */
export class DirectiveFactory {
  private static _id: number = 1;

  private _value!: Type<any>;

  public get value(): any {
    return this._value;
  }

  private static _cache = new Map<String, DirectiveFactory>();

  static forEach(fn: (value: DirectiveFactory, key: String) => void) {
    this._cache.forEach((value: DirectiveFactory, key: String) => {
      fn(value, key);
    });
  }

  /**
   * @param select 指令名
   * @param directive 需要实例化的类，在实例化时，会被[observable]
   */
  constructor(select: string, directive?: Type<any>) {
    return putIfAbsent(DirectiveFactory._cache, select, () =>
      this._constructor(directive as Type<any>)
    );
  }

  private _constructor(directive: Type<any>) {
    this._value = directive;
    return this;
  }
}
