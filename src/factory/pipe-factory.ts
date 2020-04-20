import { Pipe } from "../metadata/directives";
import { ModuleProxy } from "../classes/module-proxy";
import { Type } from "../interfaces";
import { ContextData } from "../classes/context-data";
import { getData } from "../core";
import { ANNOTATIONS } from "../utils/decorators";
import { putIfAbsent } from "../utils/util";

export function usePipes(
  value: any,
  pipeList: string[],
  contextData: ContextData
  // m: AjaModuleProvider
) {
  if (pipeList.length) {
    pipeList.forEach(bindPipe => {
      const [pipeName, ...pipeArgs] = bindPipe.split(":");
      const pipe = new PipeFactory(pipeName);
      if (!pipe) {
        console.error(`没有找到管道[${pipeName}], 请注册!!!`);
        return;
      }
      const parsePipeArgs = pipeArgs.map(arg => getData(arg, contextData));
      try {
        value = pipe.value.transform.call(pipe.value, value, ...parsePipeArgs);
      } catch (er) {
        console.error(er);
      }
    });
  }
  return value;
}

export interface PipeTransform {
  transform(value: any, ...args: any[]): any;
}

export interface PipeItem {
  /**
   * 注入的元数据
   */
  pipeMetaData: Pipe;

  /**
   * 该widget属于那个模块
   */
  module: ModuleProxy;

  /**
   * pipe实例化对象
   */
  pipe: Type<any>;
}

/**
 * 存储使用[@Pipe]注册的管道
 */
export class PipeFactory {
  private _value!: Type<PipeTransform>;
  private _valueCache?: PipeTransform;

  public get value(): PipeTransform {
    if (this._valueCache) return this._valueCache;
    return (this._valueCache = new this._value(...this._getParams()));
  }

  private static _cache = new Map<String, PipeFactory>();

  /**
   *
   * @param name 管道名
   * @param pipe 管道[PipeTransform]，在内部会被实例化一次
   */
  constructor(name: string, pipe?: Type<any>) {
    return putIfAbsent(PipeFactory._cache, name, () =>
      this._constructor(pipe as Type<any>)
    );
  }

  private _constructor(pipe: Type<PipeTransform>) {
    this._value = pipe;
    return this;
  }

  private _getParams() {
    return (<any>this._value)[ANNOTATIONS][0].ctorParameters;
  }
}
