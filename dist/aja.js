(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.Aja = factory());
}(this, (function () { 'use strict';

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
  function createIfCommentData(value) {
      return `{":if": "${!!value}"}`;
  }
  function createObject(obj) {
      return obj ? obj : {};
  }
  const emptyString = "";
  function isNumber(str) {
      if (typeof str === "number")
          return true;
      if (str && !str.trim())
          return false;
      return !isNaN(+str);
  }
  /**
   * 'name'  "name"
   *
   */
  function isTemplateString(str) {
      return /^['"`]/.test(str.trim());
  }
  /**
   * '       '
   * @param str
   */
  function isTemplateEmptyString(str) {
      return !str.trim();
  }
  /**
   * setAge( obj.age   , '        ') -> ["obj.age   ", " '        '"]
   * @param str
   */
  function parseTemplateEventArgs(str) {
      let index = str.indexOf("(");
      return str
          .substr(index, str.length - 2)
          .replace(/(^\(*)|(\)$)/g, emptyString)
          .trim()
          .split(",");
  }

  const autorun = (f) => {
      f();
      Store.autorunListeners.push(f);
  };
  class Store {
      constructor({ state, computeds, actions }) {
          for (const k in state) {
              Object.defineProperty(this, k, {
                  get() {
                      let value = state[k];
                      if (typeof state[k] === "object") {
                          value = new Store({
                              state: value,
                              computeds: {}
                          });
                      }
                      return value;
                  },
                  set(newValue) {
                      state[k] = newValue;
                      for (const f of Store.autorunListeners) {
                          f();
                      }
                  },
                  enumerable: true,
                  configurable: true
              });
          }
          for (const k in computeds) {
              Object.defineProperty(this, k, {
                  get() {
                      return computeds[k].call(this);
                  },
                  enumerable: true
              });
          }
          if (actions) {
              this.$actions = actions;
          }
      }
  }
  /**
   * * 任意一个属性的变化，都会触发所有的监听事件
   */
  Store.autorunListeners = [];

  class Aja {
      constructor(view, options) {
          /**
           * * 模板变量保存的DOM
           */
          this._templateVariables = {};
          /**
           * *  指令前缀
           * [:for] [:if]
           */
          this._instructionPrefix = ":";
          /**
           * <button (click)="setName($event)">click me</button>
           */
          this._templateEvent = "$event";
          const root = createRoot(view);
          if (root === null)
              return;
          if (options.instructionPrefix)
              this._instructionPrefix = options.instructionPrefix;
          if (options.templateEvent)
              this._templateEvent = options.templateEvent;
          this._proxyState(options);
          this._define(root, this.$store);
      }
      /**
       * * :if
       */
      get _ifInstruction() {
          return this._instructionPrefix + "if";
      }
      /**
       * * :for
       */
      get _forInstruction() {
          return this._instructionPrefix + "for";
      }
      _define(root, state) {
          const children = Array.from(root.childNodes);
          for (let index = 0; index < children.length; index++) {
              const childNode = children[index];
              // dom节点
              if (childNode.nodeType === Node.ELEMENT_NODE ||
                  childNode.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
                  const htmlElement = childNode;
                  // 遍历节点属性
                  // :if权限最大
                  const attrs = Array.from(htmlElement.attributes);
                  let depath = true;
                  let ifAttr = attrs.find(({ name }) => name === this._ifInstruction);
                  if (ifAttr) {
                      const commentElement = document.createComment("");
                      htmlElement.parentElement.insertBefore(commentElement, htmlElement);
                      autorun(() => {
                          const show = this._getData(ifAttr.value, state);
                          if (show) {
                              commentElement.after(htmlElement);
                              depath = true;
                              if (Array.from(childNode.childNodes).length) {
                                  this._define(htmlElement, state);
                              }
                          }
                          else {
                              htmlElement.replaceWith(commentElement);
                              depath = false;
                          }
                          commentElement.data = createIfCommentData(show);
                      });
                      htmlElement.removeAttribute(this._ifInstruction);
                  }
                  if (depath) {
                      for (const { name, value } of attrs) {
                          // [title]='xxx'
                          if (attrp(name)) {
                              let attrName = name
                                  .replace(/^\[/, emptyString)
                                  .replace(/\]$/, emptyString);
                              autorun(() => {
                                  if (attrName === "style") {
                                      const styles = this._getData(value, state);
                                      for (const key in styles) {
                                          // 过滤掉无效的style
                                          if (Object.getOwnPropertyDescriptor(htmlElement.style, key) &&
                                              styles[key]) {
                                              htmlElement.style[key] = styles[key];
                                          }
                                      }
                                  }
                                  else {
                                      htmlElement.setAttribute(attrName, this._getData(value, state)); // 属性扫描绑定
                                  }
                              });
                              htmlElement.removeAttribute(name);
                          }
                          // (click)="echo('hello',$event)"
                          if (eventp(name)) {
                              const eventName = name
                                  .replace(/^\(/, emptyString)
                                  .replace(/\)$/, emptyString);
                              // 函数名
                              let funcName = value;
                              // 函数参数
                              let args = [];
                              if (value.includes("(")) {
                                  // 带参数的函数
                                  const index = value.indexOf("(");
                                  funcName = value.substr(0, index);
                                  args = parseTemplateEventArgs(value);
                              }
                              childNode.addEventListener(eventName, e => {
                                  //? 每次点击都需解析参数?
                                  //! 如果只解析一次，那么模板变量需要提前声明, 并且模板变量不会更新!
                                  if (this.$store.$actions && funcName in this.$store.$actions) {
                                      this.$store.$actions[funcName].apply(this.$store, this._parseArgsToArguments(args, e, state));
                                  }
                              });
                              htmlElement.removeAttribute(name);
                          }
                          if (tempvarp(name)) {
                              // 模板变量 #input
                              this._templateVariables[name.replace(/^#/, "")] = htmlElement;
                              htmlElement.removeAttribute(name);
                          }
                          // TODO 处理for指令
                          if (name === this._forInstruction) {
                              // 解析for指令的值
                              let [varb, d] = value.split("in").map(s => s.trim());
                              if (!varb)
                                  return;
                              if (!isNaN(+d)) {
                                  const fragment = document.createDocumentFragment();
                                  htmlElement.removeAttribute(this._forInstruction);
                                  for (let index = 0; index < +d; index++) {
                                      const item = childNode.cloneNode(true);
                                      this._define(item, Object.assign(Object.assign({}, state), { [varb]: index }));
                                      fragment.append(item);
                                  }
                                  childNode.replaceWith(fragment);
                              }
                          }
                      }
                      // 递归遍历
                      if (Array.from(childNode.childNodes).length) {
                          this._define(htmlElement, state);
                      }
                  }
              }
              else if (childNode.nodeType === Node.TEXT_NODE) {
                  // 插值表达式 {{ name }} {{ obj.age }}
                  if (childNode.textContent) {
                      const exp = /{{([\w\s\.][\s\w\.]+)}}/g;
                      if (exp.test(childNode.textContent)) {
                          const _initTextContent = childNode.textContent;
                          autorun(() => {
                              const text = _initTextContent.replace(exp, (...args) => {
                                  var key = args[1].replace(/\s/g, "");
                                  return this._getData(key, state);
                              });
                              childNode.textContent = text;
                          });
                      }
                  }
              }
          }
      }
      _proxyState(options) {
          const state = createObject(options.state);
          const computeds = createObject(options.computeds);
          const actions = createObject(options.actions);
          this.$store = new Store({ state, computeds, actions });
      }
      /**
       * * 在state中寻找数据
       * * 'name' 'object.name'
       * ? 有限找模板变量的数据，再找state
       * @param key
       * @param state
       */
      _getData(key, state) {
          if (typeof key !== "string")
              return null;
          const keys = key.split(".");
          let _result;
          // 模板变量
          if (keys[0] in this._templateVariables) {
              for (const k of keys) {
                  _result = _result ? _result[k] : this._templateVariables[k];
              }
          }
          // state
          if (_result === undefined) {
              for (const k of keys) {
                  _result = _result ? _result[k] : state[k];
              }
          }
          return _result;
      }
      /**
       * ['obj.age', 12, false, '"   "', alert('xxx')] -> [22, 12, false, "   ", eval(<other>)]
       * @param args
       * @param e
       * @param state
       */
      _parseArgsToArguments(args, e, state) {
          return args.map(arg => {
              if (!arg)
                  return arg;
              let el = arg.trim();
              if (el === this._templateEvent)
                  return e;
              if (isNumber(el))
                  return +arg;
              if (isTemplateEmptyString(el))
                  return arg;
              if (isTemplateString(el)) {
                  return el
                      .replace(/^./, emptyString)
                      .replace(/.$/, emptyString)
                      .toString();
              }
              const data = this._getData(el, state);
              return data ? data : eval(el);
          });
      }
  }

  return Aja;

})));
//# sourceMappingURL=aja.js.map
