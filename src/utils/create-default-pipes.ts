import { PipeTransform, Pipe } from "../";

/**
 * 注册默认管道
 */
export function createDefaultPipes() {
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
}
