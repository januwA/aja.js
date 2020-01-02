import { AjaModule } from "./aja-module";

export abstract class AjaPipe {
  readonly module?: AjaModule;

  setModule(m: AjaModule) {
    if (this.module) {
      throw `管道只能有一个模块`;
    }
    (this as { module: AjaModule }).module = m;
  }

  abstract pipeName: string;
  abstract transform(...value: any[]): any;
}

/**
 * 全部大写
 * @param value
 */
class UppercasePipe extends AjaPipe {
  pipeName = "uppercase";

  transform(value: string) {
    return value.toUpperCase();
  }
}

/**
 * 全部小写
 * @param value
 */
class LowercasePipe extends AjaPipe {
  pipeName = "lowercase";

  transform(value: string) {
    return value.toLowerCase();
  }
}

/**
 * 首字母小写
 * @param str
 */
class CapitalizePipe extends AjaPipe {
  pipeName = "capitalize";

  transform(value: string) {
    return value.charAt(0).toUpperCase() + value.substring(1);
  }
}

class JsonPipe extends AjaPipe {
  pipeName = "json";

  transform(value: string) {
    return JSON.stringify(value, null, " ");
  }
}

class SlicePipe extends AjaPipe {
  pipeName = "slice";

  transform(value: string, start: number, end: number) {
    return value.slice(start, end);
  }
}

export const defaultPipes = {
  [UppercasePipe.name]: new UppercasePipe(),
  [CapitalizePipe.name]: new CapitalizePipe(),
  [LowercasePipe.name]: new LowercasePipe(),
  [JsonPipe.name]: new JsonPipe(),
  [SlicePipe.name]: new SlicePipe()
};
