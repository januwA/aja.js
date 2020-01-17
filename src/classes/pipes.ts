import { Pipe } from "../metadata/directives";
import { AjaModuleProvider } from "./aja-module-provider";
import { Type } from "../interfaces/type";
import { ContextData } from "./context-data";
import { getData } from "../core";
import { ParseAnnotations } from "../utils/parse-annotations";

export function usePipes(
  value: any,
  pipeList: string[],
  contextData: ContextData,
  m: AjaModuleProvider
) {
  if (pipeList.length) {
    pipeList.forEach(bindPipe => {
      const [pipeName, ...pipeArgs] = bindPipe.split(":");

      const pipe = Pipes.hasDefault(pipeName)
        ? Pipes.getDefault(pipeName)
        : Pipes.get(pipeName);

      if (!pipe) {
        console.error(`没有找到管道[${pipeName}], 请注册!!!`);
        return;
      }
      const parsePipeArgs = pipeArgs.map(arg => getData(arg, contextData));
      try {
        value = pipe.transform(value, ...parsePipeArgs);
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

/**
 * 全部大写
 * @param value
 */
@Pipe({
  name: "uppercase"
})
class UppercasePipe implements PipeTransform {
  transform(value: string) {
    return value.toUpperCase();
  }
}

/**
 * 全部小写
 * @param value
 */
@Pipe({
  name: "lowercase"
})
class LowercasePipe implements PipeTransform {
  transform(value: string) {
    return value.toLowerCase();
  }
}

/**
 * 首字母小写
 * @param str
 */
@Pipe({
  name: "capitalize"
})
class CapitalizePipe implements PipeTransform {
  transform(value: string) {
    return value.charAt(0).toUpperCase() + value.substring(1);
  }
}

@Pipe({
  name: "json"
})
class JsonPipe implements PipeTransform {
  transform(value: string) {
    return JSON.stringify(value, null, " ");
  }
}

@Pipe({
  name: "slice"
})
class SlicePipe implements PipeTransform {
  transform(value: string, start: number, end: number) {
    return value.slice(start, end);
  }
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
export class Pipes {
  private static _defaultPipes: {
    [k: string]: PipeTransform;
  } = [
    UppercasePipe,
    CapitalizePipe,
    LowercasePipe,
    JsonPipe,
    SlicePipe
  ].reduce(
    (acc, pipe) => {
      const parseAnnotations = new ParseAnnotations(pipe);
      if (parseAnnotations.isPipe) {
        acc[parseAnnotations.annotations.name] = new pipe();
      }
      return acc;
    },
    {} as {
      [k: string]: PipeTransform;
    }
  );

  private static _pipes: {
    [k: string]: PipeTransform;
  } = {};

  static add(name: string, pipe: Type<any>): void {
    this._pipes[name] = new pipe();
  }

  static get(name: string): PipeTransform {
    return this._pipes[name];
  }

  static has(name: string): boolean {
    return !!this.get(name);
  }

  static hasDefault(name: string) {
    return !!this._defaultPipes[name];
  }
  static getDefault(name: string) {
    return this._defaultPipes[name];
  }
}
