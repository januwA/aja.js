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
  function createForCommentData(obj) {
      return `{":for": "${obj}"}`;
  }
  function ifp(key, ifInstruction) {
      return key === ifInstruction;
  }
  function forp(key, forInstruction) {
      return key === forInstruction;
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
  /**
   * 'false' || 'true'
   * @param str
   */
  function isBoolString(str) {
      return str === "true" || str === "false";
  }
  //# sourceMappingURL=util.js.map

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
              // 在actions中调用this.m()
              Object.assign(this, actions);
          }
      }
  }
  /**
   * * 任意一个属性的变化，都会触发所有的监听事件
   */
  Store.autorunListeners = [];

  //* 匹配 {{ name }} {{ obj.age }}
  const interpolationExpressionExp = /{{([\w\s\.][\s\w\.]+)}}/g;
  //* 匹配空格
  const spaceExp = /\s/g;
  //* !!hide
  const firstWithExclamationMarkExp = /^!*/;
  const attrStartExp = /^\[/;
  const attrEndExp = /^\[/;
  const eventStartExp = /^\(/;
  const eventEndExp = /\)$/;
  const tempvarExp = /^#/;
  const firstAllValue = /^./;
  const endAllValue = /.$/;
  //# sourceMappingURL=exp.js.map

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
          this._define(root);
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
      get $actions() {
          return this.$store.$actions;
      }
      /**
       * 扫描绑定
       * @param root
       * @param contextState
       */
      _define(root, contextState = null) {
          const state = contextState ? contextState : this.$store;
          const children = Array.from(root.childNodes);
          for (let index = 0; index < children.length; index++) {
              const childNode = children[index];
              // dom节点
              if (childNode.nodeType === Node.ELEMENT_NODE ||
                  childNode.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
                  const htmlElement = childNode;
                  // :if权限最大
                  const attrs = Array.from(htmlElement.attributes);
                  let depath = this._ifBindHandle(htmlElement, attrs, state);
                  if (!depath)
                      continue;
                  // 遍历节点属性
                  for (const attr of attrs) {
                      const { name, value } = attr;
                      // [title]='xxx'
                      if (attrp(name)) {
                          this._attrBindHandle(htmlElement, attr, state);
                          continue;
                      }
                      // #input #username
                      if (tempvarp(name)) {
                          this._tempvarBindHandle(htmlElement, attr);
                          continue;
                      }
                      // for
                      if (forp(name, this._forInstruction)) {
                          // 解析for指令的值
                          let [varb, data] = value.split(/\bin\b/).map(s => s.trim());
                          if (!varb)
                              return;
                          // 创建注释节点
                          const commentElement = document.createComment("");
                          htmlElement.replaceWith(commentElement);
                          htmlElement.removeAttribute(this._forInstruction);
                          const fragment = document.createDocumentFragment();
                          let _data;
                          if (isNumber(data)) {
                              _data = +data;
                              for (let _v = 0; _v < _data; _v++) {
                                  const state2 = {};
                                  const item = htmlElement.cloneNode(true);
                                  fragment.append(item);
                                  Object.defineProperty(state2, varb, {
                                      get() {
                                          return _v;
                                      }
                                  });
                                  this._define(item, state2);
                              }
                          }
                          else {
                              const _varb = varb
                                  .trim()
                                  .replace(eventStartExp, emptyString)
                                  .replace(eventEndExp, emptyString)
                                  .split(",")
                                  .map(v => v.trim());
                              _data = this._getData(data, state);
                              const _that = this;
                              for (const _k in _data) {
                                  const forState = {};
                                  Object.defineProperties(forState, {
                                      [_varb[0]]: {
                                          get() {
                                              return _k;
                                          }
                                      },
                                      [_varb[1]]: {
                                          get() {
                                              return _that._getData(data, state)[_k];
                                          }
                                      }
                                  });
                                  const item = this._cloneNode(htmlElement, forState);
                                  fragment.append(item);
                                  this._define(item, forState);
                              }
                          }
                          commentElement.after(fragment);
                          commentElement.data = createForCommentData(_data);
                          continue;
                      }
                      // (click)="echo('hello',$event)"
                      if (eventp(name)) {
                          this._eventBindHandle(htmlElement, attr, state);
                          continue;
                      }
                  }
                  // 递归遍历
                  // if (Array.from(childNode.childNodes).length) {
                  this._define(htmlElement);
                  // }
              }
              else if (childNode.nodeType === Node.TEXT_NODE) {
                  // 插值表达式 {{ name }} {{ obj.age }}
                  if (childNode.textContent) {
                      // 文本保函插值表达式的
                      if (!interpolationExpressionExp.test(childNode.textContent))
                          continue;
                      const _initTextContent = childNode.textContent;
                      autorun(() => {
                          const text = _initTextContent.replace(interpolationExpressionExp, (...args) => {
                              var key = args[1].replace(spaceExp, emptyString);
                              return this._getData(key, state);
                          });
                          childNode.textContent = text;
                      });
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
       * * 1. 优先寻找模板变量
       * * 2. 在传入的state中寻找
       * * 3. 在this.$store中找
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
          // this.$store
          if (_result === undefined && state !== this.$store) {
              for (const k of keys) {
                  _result = _result ? _result[k] : this.$store[k];
              }
          }
          // 避免返回 undefined 的字符串
          if (_result === undefined)
              _result = emptyString;
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
                      .replace(firstAllValue, emptyString)
                      .replace(endAllValue, emptyString)
                      .toString();
              }
              const data = this._getData(el, state);
              return data ? data : eval(el);
          });
      }
      /**
       * 处理 :if 解析
       * @param htmlElement
       * @param attrs
       */
      _ifBindHandle(htmlElement, attrs, state) {
          let depath = true;
          // 是否有 :if 指令
          let ifAttr = attrs.find(({ name }) => ifp(name, this._ifInstruction));
          if (ifAttr) {
              // 创建注释节点做标记
              const commentElement = document.createComment("");
              // 将注释节点插入到节点上面
              htmlElement.before(commentElement);
              autorun(() => {
                  let value = ifAttr.value.trim();
                  const match = value.match(firstWithExclamationMarkExp)[0]; // :if="!show"
                  if (match) {
                      // 砍掉! !true -> true
                      value = value.replace(firstWithExclamationMarkExp, emptyString);
                  }
                  let show = true;
                  if (isBoolString(value)) {
                      show = value === "true";
                  }
                  else {
                      show = this._getData(value, state);
                  }
                  if (match) {
                      show = eval(`${match}${show}`);
                  }
                  if (show) {
                      commentElement.after(htmlElement);
                      depath = true;
                      if (Array.from(htmlElement.childNodes).length) {
                          this._define(htmlElement);
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
          return depath;
      }
      /**
       * 处理 [title]='xxx' 解析
       * @param htmlElement
       * @param param1
       */
      _attrBindHandle(htmlElement, { name, value }, state) {
          let attrName = name
              .replace(attrStartExp, emptyString)
              .replace(attrEndExp, emptyString);
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
      /**
       * 处理 (click)="echo('hello',$event)" 解析
       * @param htmlElement
       * @param param1
       */
      _eventBindHandle(htmlElement, { name, value }, state) {
          const eventName = name
              .replace(eventStartExp, emptyString)
              .replace(eventEndExp, emptyString);
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
          htmlElement.addEventListener(eventName, e => {
              //? 每次点击都需解析参数?
              //! 如果只解析一次，那么模板变量需要提前声明, 并且模板变量不会更新!
              if (this.$actions && funcName in this.$actions) {
                  this.$actions[funcName].apply(this.$store, this._parseArgsToArguments(args, e, state));
              }
          });
          htmlElement.removeAttribute(name);
      }
      /**
       * * 处理模板变量 #input 解析
       * @param htmlElement
       * @param param1
       */
      _tempvarBindHandle(htmlElement, { name }) {
          this._templateVariables[name.replace(tempvarExp, emptyString)] = htmlElement;
          htmlElement.removeAttribute(name);
      }
      /**
       * * 克隆DOM节点，默认深度克隆，绑定模板事件
       * @param htmlElement
       * @param forState
       * @param deep
       */
      _cloneNode(htmlElement, forState, deep = true) {
          const item = htmlElement.cloneNode(deep);
          const forElementAttrs = Array.from(htmlElement.attributes);
          const eventAttrs = forElementAttrs.filter(e => eventp(e.name));
          if (eventAttrs.length) {
              for (const eventAttr of eventAttrs) {
                  this._eventBindHandle(item, eventAttr, forState);
              }
          }
          return item;
      }
  }
  //# sourceMappingURL=aja.js.map

  //# sourceMappingURL=main.js.map

  return Aja;

})));
//# sourceMappingURL=aja.js.map
