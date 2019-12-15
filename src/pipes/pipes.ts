import { numberp } from "../utils/p";
import { GetDataCallBack } from "../aja";

export interface Pipe {
  (...value: any[]): any;
}

export interface Pipes {
  [pipeName: string]: Pipe;
}

export const pipes: Pipes = {
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

  json(str: string) {
    return JSON.stringify(str, null, " ");
  },

  slice(str: string, start: number, end: number) {
    return str.slice(start, end);
  }
};

// 开始管道加工
export function usePipes(
  data: any,
  pipeList: string[],
  getData: GetDataCallBack | null
): any {
  let _result = data;
  if (pipeList.length) {
    pipeList.forEach(pipe => {
      const [p, ...pipeArgs] = pipe.split(":");
      if (p in pipes) {
        let parsePipeArgs;
        if (getData) {
          parsePipeArgs = pipeArgs.map(arg => {
            if (numberp(arg)) return arg;
            return getData(arg);
          });
        } else {
          parsePipeArgs = pipeArgs;
        }
        _result = pipes[p](_result, ...parsePipeArgs);
      }
    });
  }
  return _result;
}
