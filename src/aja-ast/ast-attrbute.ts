import {
  attrStartExp,
  attrEndExp,
  eventStartExp,
  eventEndExp,
  parsePipesExp,
} from "../utils/exp";
import { parsePipe } from "../utils/util";

const funNameExp = /^([a-zA-Z_][a-zA-Z_0-9\.\[\]'"]*)/;
const argStartExp = /^\s*\(/;
const argExp = /("[^"]*"+|'[^']*'+|[^\s"'=<>`\(\),]+)*,?/;
const argEndExp = /\)\s*$/;
/**
 * 函数调用的值
 *
 * ```
 * (click)="a('hello')"
 * [title]="f()"
 * ```
 */
export class MethodCall {
  /**
   * 函数名
   * hello
   * data.hello
   * data[hello]
   * data['hello']
   * 
   * TODO:暂时这样解析，以后再优化
   */
  name!: string;

  /**
   * 函数的参数
   */
  args: string[] = [];

  #source: string;

  /**
   *
   * @param source hello("param");
   */
  constructor(source: string) {
    this.#source = source;
    this._parse(source);
  }

  /**
   * 解析出函数名，和参数列表
   * @param value
   */
  private _parse(value: string) {
    let match: null | RegExpMatchArray;
    while (value) {
      // value = hello(a, b)
      if (!this.name) {
        match = value.match(funNameExp);
        if (match) {
          this.name = match[1];
          step();
        } else {
          // 连函数名都没找到，直接抛出错误吧...
          throw new Error(`奇怪的函数名，无法解析: ${this.#source}`);
        }
      }

      // (
      match = value.match(argStartExp);
      if (match) {
        step();
      }

      // value = a, b)
      match = value.match(argExp);
      if (match) {
        // console.log(match);
        const arg = match[1];
        //TODO: 这里不管是字符串，数字常量，还是传入的变量，都直接添加进去，以后可以做优化
        if (arg !== undefined) this.args.push(arg);
        step();
      }

      // )
      match = value.match(argEndExp);
      if (match) {
        step();
      }
    }

    function step() {
      if (!match) return;
      value = value.substring(match[0].length);
    }
  }
}

/**
 * 普通的值，如:
 *
 * ```
 * [title]="data"
 * [title]="true"
 * [title]="1+1"
 * ```
 *
 * 如果需要解析复杂点，需要对每种情况都写一个ast
 */
export class PropertyRead {
  /**
   * [title]="data"
   * @param name data
   */
  constructor(public readonly name: string) {}
}

/**
 * value使用了管道表达式
 *
 * [style.color]="red|json:1:2"
 */
export class BindingPipe {
  #source: string;

  pipeList: string[];

  /**
   * 需要处理的对象 [red]
   */
  exp: any;

  constructor(source: string) {
    this.#source = source;
    const [bindKey, pipeList] = parsePipe(source);
    this.exp = bindKey;
    this.pipeList = pipeList;
  }
}

export class AstWithSource {
  /**
   * 如果是`f()` 将是 MethodCall
   * 如果是 `data | json` 将是 BindingPipe
   * 如果是`name` `1` `true` 将是 PropertyRead
   */
  ast: MethodCall | PropertyRead | BindingPipe;

  /**
   *
   * @param source attr.value "red|json:1:2" | f() | name
   */
  constructor(public readonly source: string) {
    const isMethod = /\(.*\)/.test(source);
    const isPipe = source.split(parsePipesExp).length > 1;
    if (isMethod) {
      this.ast = new MethodCall(source);
    } else if (isPipe) {
      this.ast = new BindingPipe(source);
    } else {
      this.ast = new PropertyRead(source);
    }
  }
}

/**
 * 属性
 * ```
 * <h1 class="a">My First Heading</h1>
 * ```
 */
export class AstTextAttrbute {
  constructor(readonly name: string, readonly value: string) {}

  toString() {
    return `${this.name}="${this.value}"`;
  }
}

/**
 * 模板引用变量
 *
 * 类似[AstTextAttrbute]类型，只有简单的name,value属性
 * ```
 * <h1 #x=a >My First Heading</h1>
 * ```
 */
export class AstReference extends AstTextAttrbute {}

/**
 * 绑定属性
 * ···
 * <h1 [title]="a" >My First Heading</h1>
 * ···
 *
 * 在angular里面`*ngIf`是`[ngIf]`的语法糖
 *
 * 如果是model属性，如：`[(ngModel)]="name"`
 * 那么ngModel会被加入inputs，ngModelChange加入outputs
 */
export class AstBoundAttrbute {
  /**
   * 对应的attr.name属性
   *
   * 如果设置的是[title]那么需要解析为 title
   * 如果设置的是[class.xx]那么需要解析为 xx
   */
  name: string;

  /**
   * 普通情况为 0
   *
   * [style.color] 3
   *
   * [class.xx] 2
   *
   * [title] 0
   */
  type: number;

  /**
   * 对应的attr.value
   */
  value: AstWithSource;

  /**
   * [title]="a"
   * @param name [title]
   * @param value a
   */
  constructor(name: string, value: string) {
    this.type = 0;
    const [attrName, attrChild] = name
      .replace(attrStartExp, "")
      .replace(attrEndExp, "")
      .split(".");
    this.name = attrChild ?? attrName;
    if (attrName === "style") {
      this.type = 3;
    }

    if (attrName === "class") {
      this.type = 2;
    }
    this.value = new AstWithSource(value);
  }
}

/**
 * 绑定事件
 * ···
 * <h1 (click)="a()">My First Heading</h1>
 * ···
 */
export class AstBoundEvent {
  /**
   * 事件名
   *
   * 如果设置的是(click)那么需要解析为 click
   */
  name: string;

  /**
   * 事件方法
   */
  handle: AstWithSource;

  /**
   * (click)="a()"
   *
   * @param name (click)
   * @param value a()
   */
  constructor(name: string, value: string) {
    // (click) -> click
    this.name = name.replace(eventStartExp, "").replace(eventEndExp, "");
    this.handle = new AstWithSource(value);
  }
}
