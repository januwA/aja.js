import { Type } from "../interfaces/type";
import { observable } from "../aja-mobx";

/**
 * 使用@Injectable()的全局服务
 */
export class Services {
  private static _services: { [name: string]: any } = {};

  static add(service: Type<any>) {
    this._services[service.name] = observable.cls(service);
  }

  static has(name: string) {
    return name in this._services;
  }

  static get(name: string) {
    return this._services[name];
  }
}
