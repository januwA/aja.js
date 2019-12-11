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
      return value.charAt(0) === "#";
  }
  /**
   * * 双向绑定
   * @param str
   */
  function modelp(str) {
      return str === "[(model)]";
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
  /**
   * * 避免使用全局的eval
   * @param this
   * @param bodyString
   */
  function ourEval(bodyString) {
      const f = new Function(bodyString);
      try {
          return f.apply(this, arguments);
      }
      catch (er) {
          throw er;
      }
  }
  function arrayp(data) {
      return Object.prototype.toString.call(data) === "[object Array]";
  }
  /**
   * 把字符串安全格式化 为正则表达式源码
   * {{ arr[0] }} -> \{\{ arr\[0\] \}\}
   * @param str
   */
  function escapeRegExp(str) {
      return str.replace(/([-.*+?^${}()|[\]\/\\])/g, "\\$1");
  }
  //# sourceMappingURL=util.js.map

  const autorun = (f) => {
      f();
      Store.autorunListeners.push(f);
  };
  class Store {
      constructor({ state, computeds, actions, context }) {
          const _that = context ? context : this;
          // _that.$state = state;
          for (const k in state) {
              Object.defineProperty(_that, k, {
                  get() {
                      let value = state[k];
                      if (Store._isObject(state[k])) {
                          value = new Store({
                              state: value,
                              computeds: {},
                              context: arrayp(value) ? [] : {}
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
              Object.defineProperty(_that, k, {
                  get() {
                      return computeds[k].call(_that);
                  },
                  enumerable: true
              });
          }
          // 只把actions绑定在store上
          if (actions) {
              this.$actions = actions;
              // 在actions中调用this.m()
              Object.assign(this, actions);
          }
          if (context)
              return context;
      }
      /**
       * 跳过null和空的对象
       * @param val
       */
      static _isObject(val) {
          return typeof val === "object" && val !== null;
      }
      toString() {
          return JSON.stringify(this.$state);
      }
  }
  /**
   * * 任意一个属性的变化，都会触发所有的监听事件
   */
  Store.autorunListeners = [];
  //# sourceMappingURL=store.js.map

  //* 匹配 {{ name }} {{ obj.age }}
  // export const interpolationExpressionExp = /{{([\w\s\.][\s\w\.]+)}}/g;
  const interpolationExpressionExp = /{{(.*?)}}/g;
  //* 匹配空格
  const spaceExp = /\s/g;
  const attrStartExp = /^\[/;
  const attrEndExp = /\]$/;
  const eventStartExp = /^\(/;
  const eventEndExp = /\)$/;
  const tempvarExp = /^#/;
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
                  //? 这个[depath]有什么用?
                  //? 当绑定了if和for,指令，就没有必要递归下去了
                  let depath = this._bindingAttrs(htmlElement, state);
                  // 递归遍历
                  if (depath)
                      this._define(htmlElement);
              }
              else if (childNode.nodeType === Node.TEXT_NODE) {
                  this._setTextContent(childNode, state);
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
       * ? 优先找模板变量的数据，再找state
       * ? 虽然返回的是any， 但是这个函数不会返回 undefined
       * @param key
       * @param state
       */
      _getData(key, state) {
          if (typeof key !== "string")
              return null;
          const keys = key.split(".");
          let _result;
          const firstKey = keys[0];
          // 模板变量
          //? 如果连第一个key都不存在，那么就别找了，找下去也会找错值
          if (firstKey in this._templateVariables) {
              for (const k of keys) {
                  _result = _result ? _result[k] : this._templateVariables[k];
              }
          }
          // state
          if (_result === undefined) {
              if (firstKey in state) {
                  for (const k of keys) {
                      _result = _result ? _result[k] : state[k];
                  }
              }
          }
          // this.$store
          if (_result === undefined && state !== this.$store) {
              if (firstKey in this.$store) {
                  for (const k of keys) {
                      _result = _result ? _result[k] : this.$store[k];
                  }
              }
          }
          if (_result === undefined) {
              // 没救了， eval随便解析返回个值吧!
              _result = this._parseJsString(key, state);
          }
          return _result;
      }
      /**
       * 设置新数据，现在暂时在双向绑定的时候使用新数据, 数据来源于state
       * @param key
       * @param newValue
       * @param state
       */
      _setDate(key, newValue, state) {
          if (typeof key !== "string")
              return null;
          const keys = key.split(".");
          const keysSize = keys.length;
          if (!keysSize)
              return;
          const firstKey = keys[0];
          let _result;
          if (keysSize === 1 && firstKey in state) {
              state[firstKey] = newValue;
              return;
          }
          for (let index = 0; index < keysSize - 1; index++) {
              const k = keys[index];
              _result = _result ? _result[k] : state[k];
          }
          if (_result) {
              const lastKey = keys[keysSize - 1];
              _result[lastKey] = newValue;
              return;
          }
          this._parseJsString(key, state, true, newValue);
      }
      /**
       * 解析一些奇怪的插值表达式
       * {{ el['age'] }}
       * :for="(i, el) in arr" (click)="foo( 'xxx-' + el.name  )"
       * @param key
       * @param state
       * @param setState
       */
      _parseJsString(key, state, setState = false, newValue = "") {
          try {
              return ourEval(`return ${key}`);
          }
          catch (er) {
              // 利用错误来抓取变量
              const msg = er.message;
              if (msg.includes("is not defined")) {
                  const match = msg.match(/(.*) is not defined/);
                  if (!match)
                      return emptyString;
                  const varName = match[1];
                  const context = this._getData(varName, state);
                  if (setState) {
                      const funBody = key.replace(new RegExp(`\\b${varName}`, "g"), "this") +
                          `='${newValue}'`;
                      ourEval.call(context, `${funBody}`);
                  }
                  else {
                      const funBody = key.replace(new RegExp(`\\b${varName}`, "g"), "this");
                      let _result = ourEval.call(context, `return ${funBody}`);
                      if (_result === undefined)
                          _result = emptyString;
                      return _result;
                  }
              }
              else {
                  console.error(er);
                  throw er;
              }
          }
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
              return this._getData(el, state);
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
                  let show = true;
                  if (isBoolString(value)) {
                      show = value === "true";
                  }
                  else {
                      show = this._getData(value, state);
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
      _forBindHandle(htmlElement, { name, value }, state) {
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
                  const forState = {};
                  const item = htmlElement.cloneNode(true);
                  fragment.append(item);
                  Object.defineProperty(forState, varb, {
                      get() {
                          return _v;
                      }
                  });
                  this._bindingAttrs(item, forState);
                  this._define(item, forState);
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
                  this._bindingAttrs(item, forState);
                  this._define(item, forState);
              }
          }
          commentElement.after(fragment);
          commentElement.data = createForCommentData(data);
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
                      // 过滤掉无效的style, 和空值
                      if (Object.getOwnPropertyDescriptor(htmlElement.style, key) &&
                          styles[key]) {
                          htmlElement.style[key] = styles[key];
                      }
                  }
              }
              else if (attrName === "innerhtml") {
                  htmlElement.innerHTML = this._getData(value, state);
              }
              else {
                  let _value = this._getData(value, state);
                  if (_value === null)
                      _value = emptyString;
                  htmlElement.setAttribute(attrName, _value);
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
      _bindingAttrs(htmlElement, state) {
          // :if
          const attrs = Array.from(htmlElement.attributes);
          let depath = this._ifBindHandle(htmlElement, attrs, state);
          if (!depath)
              return false;
          // 遍历节点属性
          for (const attr of attrs) {
              const { name, value } = attr;
              // #input #username
              if (tempvarp(name)) {
                  this._tempvarBindHandle(htmlElement, attr);
                  continue;
              }
              // [title]='xxx'
              if (attrp(name)) {
                  this._attrBindHandle(htmlElement, attr, state);
                  continue;
              }
              // (click)="echo('hello',$event)"
              if (eventp(name)) {
                  this._eventBindHandle(htmlElement, attr, state);
                  continue;
              }
              // :for
              if (forp(name, this._forInstruction)) {
                  this._forBindHandle(htmlElement, attr, state);
                  // 绑定for的节点没有必要递归下去， 生成的新节点会自动递归
                  depath = false;
              }
              // [(model)]="username"
              if (modelp(name)) {
                  const inputElement = htmlElement;
                  autorun(() => {
                      inputElement.value = `${this._getData(value, state)}`;
                  });
                  inputElement.addEventListener("input", () => {
                      this._setDate(value, inputElement.value, state);
                  });
                  inputElement.removeAttribute(name);
              }
          }
          return depath;
      }
      /**
       * * 解析文本节点的插值表达式
       * @param childNode
       * @param state
       */
      _setTextContent(childNode, state) {
          // 创建一个变量保存源文本
          const _initTextContent = childNode.textContent || emptyString;
          // 文本不包含插值表达式的，那么就跳过
          if (!interpolationExpressionExp.test(_initTextContent))
              return;
          _initTextContent.replace(interpolationExpressionExp, (...args) => {
              // 捕获到的插值表达式 {{name}}
              const match = args[0];
              // 获取插值表达式里面的文本 {{name}} -> name
              const key = args[1].replace(spaceExp, emptyString);
              autorun(() => {
                  let _data = this._getData(key, state);
                  // 如果返回null字符，不好看
                  // hello null :(
                  // hello      :)
                  if (_data === null)
                      return emptyString;
                  const newTextContent = _initTextContent.replace(new RegExp(escapeRegExp(match), "g"), _data);
                  childNode.textContent = newTextContent;
              });
              return emptyString;
          });
      }
  }

  //# sourceMappingURL=main.js.map

  return Aja;

})));
//# sourceMappingURL=aja.js.map
