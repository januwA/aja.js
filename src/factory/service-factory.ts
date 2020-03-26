import { Type } from "../interfaces/type";
import { observable } from "../aja-mobx";

declare global {
  interface Map<K, V> {
    /**
     * 查找[key]的值，如果不存在，请添加一个新值
     *
     * 返回与[key]关联的值（如果有）。 否则，调用[ifAbsent]获取新值，将[key]关联到该值，然后返回新值。
     *
     * @param name
     * @param ifAbsent
     */
    putIfAbsent(key: string, ifAbsent?: () => V): V;
  }
}

Map.prototype.putIfAbsent = function<K, V>(key: K, ifAbsent?: () => V): V {

  // 没有找到管道
  if(!this.has(key) && !ifAbsent){
    throw `No pipeline named [${key}] was found`;
  }

  if (this.has(key)) {
    ifAbsent = undefined;
    return this.get(key);
  }
  if (ifAbsent) {
    const v = ifAbsent();
    this.set(key, v);
    return v;
  } else {
    throw `not find ifAbsent function`;
  }
};
/**
 * 使用@Injectable()的全局服务
 *
 * 工厂函数，保存所有注册的service
 */
export class ServiceFactory {
  public value: any;
  private static _cache = new Map<String, ServiceFactory>();

  /**
   * @param name service的name
   * @param service 需要实例化的类，在实例化时，会被[observable]
   */
  constructor(name: string, service?: Type<any>) {
    return ServiceFactory._cache.putIfAbsent(
      name,
      service ? () => this._constructor(service) : undefined
    );
  }

  private _constructor(service: Type<any>) {
    this.value = observable.cls(service);
    return this;
  }
}
