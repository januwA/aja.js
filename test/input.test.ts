import { Input } from "../src";
import { PROP_METADATA } from "../src/utils/decorators";

/**
 * 测试 @Input 装饰器
 */

class Cls {
  @Input("hello") name = "";
}

let cls: Cls;

beforeAll(() => {
  cls = new Cls();
});

describe("@Input() 装饰器测试", () => {
  it("Input", () => {
    const constructor = cls.constructor;
    expect(constructor.hasOwnProperty(PROP_METADATA)).toBe(true);
    expect("name" in (<any>constructor)[PROP_METADATA]).toBe(true);
    expect(
      ((<any>constructor)[PROP_METADATA]["name"][0] as Input)
        .bindingPropertyName
    ).toBe("hello");
  });
});
