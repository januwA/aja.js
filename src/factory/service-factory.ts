import { Type } from "../interfaces";
import { observable } from "../aja-mobx";
import { ANNOTATIONS } from "../utils/decorators";
import { putIfAbsent } from "../utils/util";

/**
 * 存储使用[@Injectable]注册的service
 */
export class ServiceFactory {
  private _value!: Type<any>;
  private _valueCache?: any;

  public get value(): any {
    if (this._valueCache) return this._valueCache;
    return (this._valueCache = observable.cls(
      this._value,
      undefined,
      this._getParams()
    ));
  }

  private static _cache = new Map<String, ServiceFactory>();

  /**
   * @param name service的name
   * @param service 需要实例化的类，在实例化时，会被[observable]
   */
  constructor(name: string, service?: Type<any>) {
    return putIfAbsent(ServiceFactory._cache, name, () =>
      this._constructor(service as Type<any>)
    );
  }

  private _constructor(service: Type<any>) {
    this._value = service;
    return this;
  }
  private _getParams() {
    return (<any>this._value)[ANNOTATIONS][0].ctorParameters;
  }
}
