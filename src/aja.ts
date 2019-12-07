import { qs, attrp, eventp, tempvarp } from "./utils/util";
import { createStore, autorun, Computeds } from "./store";

const l = console.log;

interface ModelData {
  [key: string]: any;
}

interface ModelInterface {
  data?: ModelData;
  readonly methods?: {
    [key: string]: Function;
  };
  readonly computeds?: Computeds;
}
const templateVariables: {
  [key: string]: ChildNode | Element | HTMLElement;
} = {};

/**
 * *  指令前缀
 * [:for] [:if]
 */
export const instructionPrefix = ":";

// 扫描
export function define(
  view: string | HTMLElement,
  model: ModelInterface
): null | {
  [key: string]: any;
} {
  const state = model.data ? model.data : {};
  const actions = model.methods ? model.methods : {};
  const computeds = model.computeds ? model.computeds : {};
  const _result = createStore({
    state,
    actions,
    computeds
  });

  const root =
    typeof view === "string" ? document.querySelector<HTMLElement>(view) : view;
  if (root === null) return null;

  const children = Array.from(root.childNodes);
  for (let index = 0; index < children.length; index++) {
    const el = children[index];

    // dom节点
    if (
      el.nodeType === Node.ELEMENT_NODE ||
      el.nodeType === Node.DOCUMENT_FRAGMENT_NODE
    ) {
      // 递归遍历
      if (Array.from(el.childNodes).length) {
        define(el as HTMLElement, model);
      }
      const attrs: Attr[] = Array.from((el as HTMLElement).attributes) || [];
      for (let attr of attrs) {
        let key = attr.name;
        let value = attr.value;
        if (attrp(key)) {
          // [title]="title"
          let len = key.length;
          let name = key.substr(1, len - 2); // [title] -> title
          autorun(() => {
            if (name === "style") {
              const styles: CSSStyleDeclaration = _result[value];
              for (const key in styles) {
                const _isNaN = isNaN(parseInt(key));
                if (
                  _isNaN &&
                  Object.getOwnPropertyDescriptor(
                    (el as HTMLElement).style,
                    key
                  )
                ) {
                  const _value = styles[key];
                  if (_value) {
                    (el as HTMLElement).style[key] = _value;
                  }
                }
              }
            } else {
              (el as HTMLElement).setAttribute(name, _result[value]); // 属性扫描绑定
            }
          });
        }
        if (eventp(key)) {
          // 绑定的事件: (click)="echo('hello',$event)"
          let len = key.length;
          let name = key.substr(1, len - 2); // (click) -> click

          // 函数名
          let funcName: string;
          // 函数参数
          let args: any[];
          if (value.includes("(")) {
            // 带参数的函数
            let index = value.indexOf("(");
            funcName = value.substr(0, index);
            args = value
              .substr(index, value.length - 2)
              .replace(/(^\(*)|(\))/g, "")
              .split(",")
              .map(a => a.trim());
          } else {
            funcName = value;
          }
          el.addEventListener(name, function(e) {
            args = args.map(el => (el === "$event" ? e : el));
            if (funcName in _result) {
              return _result[funcName](...args);
            }
          });
        }
        if (tempvarp(key)) {
          // 模板变量 #input
          templateVariables[key.replace(/^#/, "")] = el;
        } else {
          // l("绑定的静态数据", attrName)
        }

        // TODO 处理for指令
        // ! 插值表达式被提前处理为 undefined
        const forInstruction: string = instructionPrefix + "for";
        if (key === forInstruction) {
          // 解析for指令的值
          let [varb, d] = value.split("in").map(s => s.trim());
          if (!varb) return null;
          if (!isNaN(+d)) {
            const fragment = document.createDocumentFragment();
            (el as HTMLElement).removeAttribute(forInstruction);
            for (let index = 0; index < +d; index++) {
              const item = el.cloneNode(true);
              define(item as HTMLElement, {
                data: {
                  ...model.data,
                  [varb]: index
                },
                methods: model.methods,
                computeds: model.computeds
              });
              fragment.append(item);
            }
            el.replaceWith(fragment);
          } else {
          }
        }

        // TODO 处理if指令
        if (key === ":if") {
        }
      }
    } else if (el.nodeType === Node.TEXT_NODE) {
      // 插值表达式 {{ name }} {{ obj.age }}
      if (el.textContent) {
        const exp = /{{([\w\s\.][\s\w\.]+)}}/g;
        if (exp.test(el.textContent)) {
          const _initTextContent = el.textContent;
          autorun(() => {
            const text = _initTextContent.replace(exp, function(match) {
              var key = Array.prototype.slice
                .call(arguments, 1)[0]
                .replace(/\s/g, "");
              let keys = key.split(".");
              let data: any;
              // 在data中找数据
              for (const el of keys) {
                data = data ? data[el] : _result[el];
              }

              // 没有在data中找到数据, 寻找模板变量里面
              if (data === undefined) {
                // TODO 模板变量双向绑定
                const isTemplateVariables = keys[0] in templateVariables;
                if (isTemplateVariables) {
                  for (const el of keys) {
                    data = data ? data[el] : templateVariables[el];
                  }
                }
              }
              return data;
            });
            el.textContent = text;
          });
        }
      }
    }
  }
  return _result;
}
