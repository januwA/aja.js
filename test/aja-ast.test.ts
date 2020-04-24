import { AstElement } from "../src/aja-ast/ast-element";
import { htmlAst, AstRoot, AstText } from "../src/aja-ast";
import {
  htmlCommentExp,
  startTagOpenExp,
  startTagExp,
  attributeExp,
} from "../src/aja-ast/html-ast";
import { ContextData } from "../src/classes/context-data";

let astRoot: AstRoot;
let tast: AstRoot;
let emptyContextData: ContextData;

beforeAll(() => {
  emptyContextData = new ContextData({
    store: {},
    tData: {},
  });
  astRoot = htmlAst(`
  
  <body style="color: red;" data-k=1 checked>
      hi
      <h1>My First Heading</h1>
      <p>My first paragraph.</p>
  </body>
  
  <div>
    <p>hello</p>
  </div>
  
  hello
  
  `);

  tast = htmlAst(`
  <app-tile [title]="title" (click)="action($event)" *if="show" [(subtitle)]="subtitle">
    {{ text }}
    <p>hello</p>
  </app-tile>
  `);
});

describe("html Ast test", () => {
  it("nodes test", () => {
    expect(astRoot.nodes.length).toBe(3);
  });

  it("nodes[0] test", () => {
    const body = astRoot.nodes[0] as AstElement;
    expect(body.attrbutes.length).toBe(3);

    // attr
    expect(body.attrbutes[0].name).toBe("style");
    expect(body.attrbutes[0].value).toBe("color: red;");
    expect(body.attrbutes[1].name).toBe("data-k");
    expect(body.attrbutes[1].value).toBe("1");

    expect(body.attrbutes[2].name).toBe("checked");
    expect(body.attrbutes[2].value).toBe("");

    // children
    expect(body.children.length).toBe(3);

    expect((body.children[0] as AstText).value.includes("hi")).toBe(true);

    expect(
      body.children[1] instanceof AstElement && body.children[1].name === "h1"
    ).toBe(true);
  });
});

describe("template html Ast test", () => {
  it("nodes test", () => {
    expect(tast.nodes.length).toBe(1);
  });

  it("attrs test", () => {
    const appTile = tast.nodes[0] as AstElement;
    expect(appTile.name).toBe("app-tile");
    expect(appTile.inputs.length).toBe(2);
    expect(appTile.outputs.length).toBe(2);
    expect(appTile.templateAttrs.length).toBe(1);
    expect((appTile.children[0] as AstText).isConputed).toBe(true);
    // console.log(appTile.toString());
    // expect(appTile.toString()).toBe(
    //   '<app-tile [title]="title" (click)="action($event)" *if="show" [(subtitle)]="subtitle"> {{ text }} <p>hello</p></app-tile>'
    // );
  });
});

describe("html Ast comment test", () => {
  it("comment exp test", () => {
    const m = `<!-- hello world -->`.match(htmlCommentExp);
    expect(m).not.toBeNull();
    if (m) expect(m[1]).toBe(" hello world ");
  });

  it("comment ast test", () => {
    const ast = htmlAst(`
      <!--title start-->
      <p> title </p>
      <!--title end-->
    `);
    // console.log(ast);
    // console.log(ast.toString());
    expect(ast.toString()).toBe(
      "<!--title start--><p> title </p><!--title end-->"
    );
  });
});

describe("html Ast To Element test", () => {
  it("span Element test", () => {
    const ast = htmlAst(`<span>hello world</span>`);
    const el = ast.nodes[0].createHost(emptyContextData) as HTMLElement;
    expect(el!.textContent).toBe("hello world");
  });
  it("div Element test", () => {
    const ast = htmlAst(
      `<span>hello</span> <br> <script src=""></script> <span>world</span>`
    );
    ast.host = document.createElement("div");
    const root = ast.createHost<HTMLElement>(emptyContextData);
    expect(root.children.length).toBe(3);
    expect(root.children[0].textContent).toBe("hello");
    expect(root.children[1].tagName.toLowerCase()).toBe("br");
    expect(root.children[2].textContent).toBe("world");
  });
});

describe("exp test", () => {
  it("startTagOpen test", () => {
    expect(startTagOpenExp.test("<app-home")).toBe(true);
    expect(startTagOpenExp.test("<1home")).toBe(false);
  });

  it("startTagExp test", () => {
    // key and value
    expect(startTagExp.test(`<app-home title='ajanuw'>`)).toBe(true);
    expect(startTagExp.test(`<app-home title=true>`)).toBe(true);

    // bool key
    expect(startTagExp.test(`<app-home autoplay>`)).toBe(true);

    // console.log(
    //   `<app-home title='ajanuw' autoplay checked />`.match(startTagExp)
    // );
  });

  it("attributeExp test", () => {
    const m1 = `   title="ajanuw" autoplay checked`.match(attributeExp);
    if (!m1) throw "attributeExp error.";
    expect(m1[1]).toBe("title");
    expect(m1[2]).toBe("ajanuw");

    const m2 = `   title='ajanuw' autoplay checked`.match(attributeExp);
    if (!m2) throw "attributeExp error.";
    expect(m2[1]).toBe("title");
    expect(m2[3]).toBe("ajanuw");

    const m3 = `   title=ajanuw autoplay checked`.match(attributeExp);
    if (!m3) throw "attributeExp error.";
    expect(m3[1]).toBe("title");
    expect(m3[4]).toBe("ajanuw");

    const m4 = `   title autoplay checked`.match(attributeExp);
    if (!m4) throw "attributeExp error.";
    expect(m4[1]).toBe("title");

    const m5 = `   #inputRef autoplay checked`.match(attributeExp);
    if (!m5) throw "attributeExp error.";
    expect(m5[1]).toBe("#inputRef");
  });
});
