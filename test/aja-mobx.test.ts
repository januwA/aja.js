import { observable, autorun } from "../src/aja-mobx";

describe("test aja-mobx", () => {
  it("test [observable.object]", () => {
    const x = observable({
      name: "Ajanuw",
      get hello() {
        return `hello ${this.name}`;
      },
      change() {
        this.name = "ajanuw";
      }
    });
    expect(x.name).toBe("Ajanuw");
    expect(x.hello).toBe("hello Ajanuw");
    x.change();
    expect(x.name).toBe("ajanuw");
    expect(x.hello).toBe("hello ajanuw");

    const y = observable({
      info: {
        get len() {
          return this.arr.length;
        },
        name: "Ajanuw",
        arr: ["x", "y"]
      }
    });
    expect(y.info.name).toBe("Ajanuw");
    expect(y.info.arr[0]).toBe("x");
    expect(y.info.len).toBe(2);
    y.info.arr.push("z");
    expect(y.info.len).toBe(3);
  });

  it("test [observable.cls]", () => {
    class X {
      name = "Ajanuw";
      get hello() {
        return `hello ${this.name}`;
      }
      change() {
        this.name = "ajanuw";
      }
    }
    const x = observable.cls(X);
    expect(x.name).toBe("Ajanuw");
    expect(x.hello).toBe("hello Ajanuw");
    x.change();
    expect(x.name).toBe("ajanuw");
    expect(x.hello).toBe("hello ajanuw");
  });

  it("test [observable.box]", () => {
    const x = observable.box(1);
    expect(x.get()).toBe(1);
    x.set(2);
    expect(x.get()).toBe(2);
  });
});
