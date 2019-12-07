(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = global || self, factory(global.aja = {}));
}(this, (function (exports) { 'use strict';

  /**
   * 获取DOM元素
   * @param s
   */
  /**
   * [title]="title"
   * @param value
   */
  function attrp(value) {
      return /^\[\w.+\]$/.test(value);
  }
  /**
   * (click)="hello('hello')"
   */
  function eventp(value) {
      return /^\(\w.+\)$/.test(value);
  }
  /**
   * #input 模板变量
   * @param value
   */
  function tempvarp(value) {
      return value[0] === "#";
  }
  function createRoot(view) {
      return typeof view === "string"
          ? document.querySelector(view)
          : view;
  }
  //# sourceMappingURL=util.js.map

  const listeners = [];
  const autorun = (f) => {
      f();
      listeners.push(f);
  };
  function createState(obj) {
      return obj ? obj : {};
  }
  function createActions(obj) {
      return obj ? obj : {};
  }
  function createComputeds(obj) {
      return obj ? obj : {};
  }
  function createStore({ state, computeds, actions }) {
      let _result = {};
      for (let k in state) {
          // 将所有state，重新代理
          Object.defineProperty(_result, k, {
              get: function proxyGetter() {
                  let value;
                  if (typeof state[k] === "object") {
                      value = createStore({
                          state: state[k]
                      });
                  }
                  else {
                      value = state[k];
                  }
                  return value;
              },
              set: function proxySetter(value) {
                  state[k] = value;
                  // 设置的时候调用回调
                  for (const f of listeners) {
                      f();
                  }
              },
              enumerable: true,
              configurable: true
          });
      }
      for (let k in computeds) {
          Object.defineProperty(_result, k, {
              get: function proxyGetter() {
                  return computeds[k].call(this);
              }
          });
      }
      Object.assign(_result, actions);
      return _result;
  }
  //# sourceMappingURL=store.js.map

  const templateVariables = {};
  /**
   * *  指令前缀
   * [:for] [:if]
   */
  const instructionPrefix = ":";
  function ifp(key) {
      return key === instructionPrefix + "if";
  }
  // 扫描
  function define(view, model) {
      const state = createState(model.state);
      const actions = createActions(model.actions);
      const computeds = createComputeds(model.computeds);
      const _result = createStore({
          state,
          actions,
          computeds
      });
      const root = createRoot(view);
      if (root === null)
          return null;
      const children = Array.from(root.childNodes);
      for (let index = 0; index < children.length; index++) {
          const childNode = children[index];
          // dom节点
          if (childNode.nodeType === Node.ELEMENT_NODE ||
              childNode.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
              const htmlElement = childNode;
              //* 遍历节点熟悉
              // :if权限最大
              const attrs = Array.from(childNode.attributes) || [];
              let depath = true;
              for (const { name, value } of attrs) {
                  if (ifp(name)) {
                      autorun(() => {
                          if (!_result[value]) {
                              htmlElement.style.display = "none";
                              depath = false;
                          }
                          else {
                              htmlElement.style.display = "block";
                              depath = true;
                              if (depath && Array.from(childNode.childNodes).length) {
                                  define(htmlElement, model);
                              }
                          }
                      });
                  }
                  if (attrp(name)) {
                      let attrName = name.replace(/^\[/, "").replace(/\]$/, "");
                      autorun(() => {
                          if (attrName === "style") {
                              const styles = _result[value];
                              for (const key in styles) {
                                  if (Object.getOwnPropertyDescriptor(htmlElement.style, key)) {
                                      const _value = styles[key];
                                      if (_value) {
                                          htmlElement.style[key] = _value;
                                      }
                                  }
                              }
                          }
                          else {
                              htmlElement.setAttribute(attrName, _result[value]); // 属性扫描绑定
                          }
                      });
                  }
                  if (eventp(name)) {
                      // 绑定的事件: (click)="echo('hello',$event)"
                      let len = name.length;
                      let eventName = name.substr(1, len - 2); // (click) -> click
                      // 函数名
                      let funcName;
                      // 函数参数
                      let args;
                      if (value.includes("(")) {
                          // 带参数的函数
                          let index = value.indexOf("(");
                          funcName = value.substr(0, index);
                          args = value
                              .substr(index, value.length - 2)
                              .replace(/(^\(*)|(\))/g, "")
                              .split(",")
                              .map(a => a.trim());
                      }
                      else {
                          funcName = value;
                      }
                      childNode.addEventListener(eventName, function (e) {
                          args = args.map(el => (el === "$event" ? e : el));
                          if (funcName in _result) {
                              return _result[funcName](...args);
                          }
                      });
                  }
                  if (tempvarp(name)) {
                      // 模板变量 #input
                      templateVariables[name.replace(/^#/, "")] = childNode;
                  }
                  // TODO 处理for指令
                  // ! 插值表达式被提前处理为 undefined
                  const forInstruction = instructionPrefix + "for";
                  if (name === forInstruction) {
                      // 解析for指令的值
                      let [varb, d] = value.split("in").map(s => s.trim());
                      if (!varb)
                          return null;
                      if (!isNaN(+d)) {
                          const fragment = document.createDocumentFragment();
                          childNode.removeAttribute(forInstruction);
                          for (let index = 0; index < +d; index++) {
                              const item = childNode.cloneNode(true);
                              define(item, {
                                  state: Object.assign(Object.assign({}, model.state), { [varb]: index }),
                                  actions: model.actions,
                                  computeds: model.computeds
                              });
                              fragment.append(item);
                          }
                          childNode.replaceWith(fragment);
                      }
                  }
              }
              // 递归遍历
              if (depath && Array.from(childNode.childNodes).length) {
                  define(htmlElement, model);
              }
          }
          else if (childNode.nodeType === Node.TEXT_NODE) {
              // 插值表达式 {{ name }} {{ obj.age }}
              if (childNode.textContent) {
                  const exp = /{{([\w\s\.][\s\w\.]+)}}/g;
                  if (exp.test(childNode.textContent)) {
                      const _initTextContent = childNode.textContent;
                      autorun(() => {
                          const text = _initTextContent.replace(exp, function (match) {
                              var key = Array.prototype.slice
                                  .call(arguments, 1)[0]
                                  .replace(/\s/g, "");
                              let keys = key.split(".");
                              let data;
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
                          childNode.textContent = text;
                      });
                  }
              }
          }
      }
      return _result;
  }

  exports.define = define;
  exports.instructionPrefix = instructionPrefix;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=aja.js.map
