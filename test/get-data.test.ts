import { getData } from "../src/core";
import { ContextData } from "../src/classes/context-data";

let contextData: ContextData;
beforeAll(() => {
  contextData = new ContextData({
    store: {
      string: "Ajanuw",
      number: 1,
      boolean: true,
      null: null,
      undefined: undefined
    },
    tData: {}
  });
});

describe("getData test", () => {
  it("test string data", () => {
    const data = getData("string", contextData);
    expect(data).toBe("Ajanuw");
  });
  it("test number data", () => {
    const data = getData("number", contextData);
    expect(data).toBe(1);
  });
  it("test boolean data", () => {
    const data = getData("boolean", contextData);
    expect(data).toBe(true);
  });
  it("test null data", () => {
    const data = getData("null", contextData);
    expect(data).toBe(null);
  });
  it("test undefined data", () => {
    const data = getData("undefined", contextData);
    expect(data).toBe("");
  });
  it("test true", () => {
    const data = getData("true", contextData);
    expect(data).toBe(true);
  });
  it("test false", () => {
    const data = getData("false", contextData);
    expect(data).toBe(false);
  });
  it("test number", () => {
    const data = getData("1", contextData);
    expect(data).toBe(1);
  });
  it("test numberString", () => {
    const data = getData("'1'", contextData);
    expect(data).toBe("1");
  });
  it("test string", () => {
    const data = getData("'ajanuw'", contextData);
    expect(data).toBe("ajanuw");
  });
});
