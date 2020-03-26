import { Pipe } from "../metadata/directives";
import { AjaModuleProvider } from "../classes/aja-module-provider";
import { Type } from "../interfaces/type";
import { ContextData } from "../classes/context-data";
import { getData } from "../core";

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
  module: AjaModuleProvider;

  /**
   * pipe实例化对象
   */
  pipe: Type<any>;
}

/**
 * 存储所有管道
 */
export class PipeFactory {
  private _pipe!: Type<PipeTransform>;

  // 懒惰的单一模式pipe
  // 确保值实例化一次
  private _pipeCache?: PipeTransform;

  public get value(): PipeTransform {
    if (this._pipeCache) return this._pipeCache;
    return (this._pipeCache = new this._pipe());
  }

  private static _cache = new Map<String, PipeFactory>();

  /**
   *
   * @param name 管道名
   * @param pipe 管道[PipeTransform]，在内部会被实例化一次
   */
  constructor(name: string, pipe?: Type<any>) {
    return PipeFactory._cache.putIfAbsent(
      name,
      pipe ? () => this._constructor(pipe) : undefined
    );
  }

  private _constructor(pipe: Type<PipeTransform>) {
    this._pipe = pipe;
    return this;
  }
}
