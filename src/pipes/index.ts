import { numberStringp } from "../utils/p";
import { ContextData } from "../classes/context-data";
import { getData } from "../core";

export interface Pipe {
  (...value: any[]): any;
}

export interface Pipes {
  [pipeName: string]: Pipe;
}


export const ajaPipes: Pipes = {
  /**
   * * 全部大写
   * @param value
   */
  uppercase(value: string) {
    return value.toUpperCase();
  },

  /**
   * * 全部小写
   * @param value
   */
  lowercase(value: string) {
    return value.toLowerCase();
  },
  /**
   * * 首字母小写
   * @param str
   */
  capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.substring(1);
  },

  json(data: any) {
    return JSON.stringify(data, null, " ");
  },

  slice(str: string, start: number, end: number) {
    return str.slice(start, end);
  }
};

// 开始管道加工
export function usePipes(
  target: any,
  pipeList: string[],
  contextData: ContextData
): any {
  let _result = target;
  if (pipeList.length) {
    pipeList.forEach(pipe => {
      const [p, ...pipeArgs] = pipe.split(":");
      if (p in ajaPipes) {
        const parsePipeArgs = pipeArgs.map(arg =>
          numberStringp(arg) ? arg : getData(arg, contextData)
        );
        _result = ajaPipes[p](_result, ...parsePipeArgs);
      }
    });
  }
  return _result;
}
