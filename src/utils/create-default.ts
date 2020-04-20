import { PipeTransform, Pipe, ElementRef } from "..";
import { Directive, Input } from "../metadata/directives";
import { objectp } from "./p";

/**
 * 构建默认的管道，指令
 */
export function createDefault() {
  createDefaultPipes();
  createDefaultDirective();
}

/**
 * 注册默认管道
 */
function createDefaultPipes() {
  /**
   * 全部大写
   * @param value
   */
  @Pipe({
    name: "uppercase",
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
    name: "lowercase",
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
    name: "capitalize",
  })
  class CapitalizePipe implements PipeTransform {
    transform(value: string) {
      return value.charAt(0).toUpperCase() + value.substring(1);
    }
  }

  @Pipe({
    name: "json",
  })
  class JsonPipe implements PipeTransform {
    transform(value: string) {
      return JSON.stringify(value, null, " ");
    }
  }

  @Pipe({
    name: "slice",
  })
  class SlicePipe implements PipeTransform {
    transform(value: string, start: number, end: number) {
      return value.slice(start, end);
    }
  }
}

function createDefaultDirective() {
  /**
   *
   * [ct]可以是string或者是{[klass:string]: boolean}对象
   *
   * ```html
   * <p class="ajauw">hello world</p>
   * <p [class]="ct">hello world</p>
   * <p [class.select]="select">hello world</p>
   * ```
   */
  @Directive({
    selector: "[class]",
  })
  class ClassDirective {
    private node: HTMLElement;
    private oldClass?: string;
    constructor(private readonly host: ElementRef<HTMLElement>) {
      this.node = host.nativeElement;
    }

    @Input()
    set class(value: any) {
      if (!value) return;
      if (objectp(value)) {
        this._objValue(value);
        return;
      }
      this._strValue(value);
    }

    /**
     *
     *处理当value为object
     *
     * ```html
     * <p class="ajauw" [class]="ct">hello world</p>
     * ```
     *
     * ```ts
     *  ct = { a: true, b: false };
     * ```
     * @param value
     */
    private _objValue(value: any) {
      for (const klass in value as any) {
        if (value[klass]) {
          this.node.classList.add(klass);
        } else {
          this.node.classList.remove(klass);
        }
      }
    }

    /**
     * 处理value为string
     *
     * ```html
     * <p class="ajauw" [class]="ct">hello world</p>
     * ```
     *
     * ```ts
     *  ct = "list";
     * ```
     *
     * @param value
     */
    private _strValue(value: string) {
      if (this.oldClass) {
        this.node.classList.replace(this.oldClass, value);
      } else {
        this.node.classList.add(value);
      }
      this.oldClass = value;
    }
  }

  @Directive({
    selector: "[innerHTML]",
  })
  class InnerHTMLDirective {
    constructor(private readonly host: ElementRef<HTMLElement>) {}

    @Input()
    set innerHTML(value: string) {
      this.host.nativeElement.innerHTML = value;
    }
  }

  /**
   *
   * 1. 使用字面量
   * ```html
   * <p [style.color]="'red'">hello world</p>
   * ```
   *
   * 2. 使用变量
   * ```html
   * <p [style.color]="color">hello world</p>
   * ```
   * ```ts
   * color = "red";
   * ```
   *
   * 3. 使用对象
   * ```html
   * <p [style]="styles">hello world</p>
   * ```
   * ```ts
   * styles = { color: "red", fontSize: "22px"};
   * ```
   */
  @Directive({
    selector: "[style]",
  })
  class StyleDirective {
    constructor(private readonly host: ElementRef<HTMLElement>) {}

    private _isStyleKey(key: any) {
      return key in this.host.nativeElement.style;
    }

    private _setStyle(key: any, value: any) {
      this.host.nativeElement.style[key] = value;
    }

    @Input()
    set styles(value: any) {
      if (!value) return;
      if (!objectp(value)) {
        console.error(`[style]处理了意外的value: ${value}`);
        return;
      }
      
      for (const key in value) {
        if (!this._isStyleKey(key)) continue;
        this._setStyle(key, value[key]);
      }
    }
  }
}
