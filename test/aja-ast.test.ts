import { getData } from "../src/core";
import { IAstRoot, htmlAst, htmlComment } from "../src/aja-ast";
import { AstElement, AstText } from "../src/aja-ast/element-ast";

let ast: IAstRoot;
let tast: IAstRoot;
beforeAll(() => {
  ast = htmlAst(`
  
  <body style="color: red;" data-k="1">
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
    expect(ast.nodes.length).toBe(3);
  });

  it("nodes[0] test", () => {
    const body = ast.nodes[0] as AstElement;
    expect(body.attrbutes.length).toBe(2);

    // attr
    expect(body.attrbutes[0].name).toBe("style");
    expect(body.attrbutes[0].value).toBe("color: red;");
    expect(body.attrbutes[1].name).toBe("data-k");
    expect(body.attrbutes[1].value).toBe("1");

    // children
    expect(body.children.length).toBe(3);

    expect(
      body.children[0] instanceof AstText &&
        body.children[0].value.includes("hi")
    ).toBe(true);

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
    expect(appTile.attrbutes.length).toBe(4);
    expect((appTile.children[0] as AstText).isInterpolationExpression).toBe(
      true
    );
    // console.log(appTile.toString());
    expect(appTile.toString()).toBe(
      '<app-tile [title]="title" (click)="action($event)" *if="show" [(subtitle)]="subtitle"> {{ text }} <p>hello</p></app-tile>'
    );
  });
});

describe("html Ast comment test", () => {
  it("comment exp test", () => {
    const m = `<!-- hello world -->`.match(htmlComment);
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
    expect(ast.toString()).toBe('<!--title start--><p> title </p><!--title end-->')
  });
});
