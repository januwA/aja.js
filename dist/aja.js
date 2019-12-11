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
  function modelp(str, _modeldirective = "[(model)]") {
      return str === _modeldirective;
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
  function objectp(data) {
      return Object.prototype.toString.call(data) === "[object Object]";
  }
  function arrayp(data) {
      return Object.prototype.toString.call(data) === "[object Array]";
  }
  function elementNodep(node) {
      return (node.nodeType === Node.ELEMENT_NODE ||
          node.nodeType === Node.DOCUMENT_FRAGMENT_NODE);
  }
  function textNodep(node) {
      return node.nodeType === Node.TEXT_NODE;
  }
  /**
   * * 将['on']转为[null]
   * @param checkbox
   */
  function getCheckBoxValue(checkbox) {
      let value = checkbox.value;
      if (value === "on")
          value = null;
      return value;
  }

  /**
   * * 任意一个属性的变化，都会触发所有的监听事件
   */
  const autorunListeners = [];
  function updateAll() {
      for (const f of autorunListeners) {
          f();
      }
  }
  const autorun = (f) => {
      f();
      autorunListeners.push(f);
  };
  class Store {
      /**
       *
       * @param state 需要代理的数据
       */
      constructor({ state, computeds, actions }) {
          Store.proxyObject(state, this);
          if (computeds) {
              for (const k in computeds) {
                  Object.defineProperty(this, k, {
                      get() {
                          return computeds[k].call(this);
                      },
                      enumerable: true
                  });
              }
          }
          // 只把actions绑定在store上
          if (actions) {
              this.$actions = actions;
              // 在actions中调用this.m()
              Object.assign(this, actions);
          }
      }
      /**
       * * 代理每个属性的 get， set
       */
      static proxyObject(object, context) {
          for (const k in object) {
              let v = object[k];
              if (arrayp(v)) {
                  v = Store.proxyArray(v);
              }
              if (objectp(v)) {
                  v = Store.proxyObject(v, {});
              }
              object[k] = v;
              Object.defineProperty(context, k, {
                  get() {
                      const _r = object[k];
                      return _r;
                  },
                  set(newValue) {
                      object[k] = newValue;
                      updateAll();
                  },
                  enumerable: true,
                  configurable: true
              });
          }
          return context;
      }
      /**
       * * 拦截数组的非幕等方, 并循环代理每个元素
       * @param array
       */
      static proxyArray(array) {
          var aryMethods = [
              "push",
              "pop",
              "shift",
              "unshift",
              "splice",
              "sort",
              "reverse"
          ];
          var arrayAugmentations = Object.create(Array.prototype);
          aryMethods.forEach(method => {
              let original = Array.prototype[method];
              arrayAugmentations[method] = function (...args) {
                  // 将传递进来的值，重新代理
                  const _applyArgs = Store.proxyArray(args);
                  // 调用原始方法
                  const r = original.apply(this, _applyArgs);
                  // 跟新
                  updateAll();
                  return r;
              };
          });
          // 遍历代理数组每项的值
          array = array.map(el => {
              if (objectp(el)) {
                  return Store.proxyObject(el, {});
              }
              if (arrayp(el)) {
                  return Store.proxyArray(el);
              }
              return el;
          });
          Object.setPrototypeOf(array, arrayAugmentations);
          return array;
      }
  }

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
          /**
           * * 双向绑定指令
           */
          this._modeldirective = "[(model)]";
          const root = createRoot(view);
          if (root === null)
              return;
          if (options.instructionPrefix)
              this._instructionPrefix = options.instructionPrefix;
          if (options.templateEvent)
              this._templateEvent = options.templateEvent;
          if (options.modeldirective)
              this._modeldirective = options.modeldirective;
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
      get $actions() {
          return this.$store.$actions;
      }
      /**
       * 扫描绑定
       * @param root
       */
      _define(root, state) {
          const depath = this._bindingAttrs(root, state);
          if (depath)
              this._bindingChildrenAttrs(Array.from(root.childNodes), state);
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
      _forBindHandle(htmlElement, attrs, state) {
          let depath = true;
          // 是否有 :for 指令
          let forAttr = attrs.find(({ name }) => ifp(name, this._forInstruction));
          if (forAttr) {
              depath = false;
              const { name, value } = forAttr;
              // 解析for指令的值
              let [varb, data] = value.split(/\bin\b/).map(s => s.trim());
              if (!varb)
                  return depath;
              // 创建注释节点
              const commentElement = document.createComment("");
              htmlElement.replaceWith(commentElement);
              htmlElement.removeAttribute(this._forInstruction);
              const fragment = document.createDocumentFragment();
              if (isNumber(data)) {
                  const _data = +data;
                  for (let _v = 0; _v < _data; _v++) {
                      const forState = {};
                      Object.defineProperty(forState, varb, {
                          get() {
                              return _v;
                          }
                      });
                      const item = htmlElement.cloneNode(true);
                      fragment.append(item);
                      this._define(item, forState);
                  }
                  // 创建完添加到节点
                  commentElement.after(fragment);
              }
              else {
                  const _varb = varb
                      .trim()
                      .replace(eventStartExp, emptyString)
                      .replace(eventEndExp, emptyString)
                      .split(",")
                      .map(v => v.trim());
                  const _data = this._getData(data, state);
                  const _that = this;
                  // 记录for生成的items，下次更新将全部删除
                  const forBuffer = [];
                  // 不要直接 in _data, 原型函数能被枚举
                  autorun(() => {
                      for (const forItem of forBuffer) {
                          forItem.remove();
                      }
                      const _keys = Object.keys(_data);
                      for (const _k in _keys) {
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
                          forBuffer.push(item);
                          this._define(item, forState);
                      }
                      commentElement.after(fragment);
                  });
              }
              commentElement.data = createForCommentData(data);
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
      /**
       * * 解析指定HTMLElement的属性
       * @param htmlElement
       * @param state
       */
      _bindingAttrs(htmlElement, state) {
          let depath = true;
          const attrs = Array.from(htmlElement.attributes);
          if (!attrs.length)
              return depath;
          // :if
          depath = this._ifBindHandle(htmlElement, attrs, state);
          // :for
          depath = this._forBindHandle(htmlElement, attrs, state);
          if (!depath)
              return depath;
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
              // [(model)]="username"
              if (modelp(name, this._modeldirective)) {
                  const nodeName = htmlElement.nodeName;
                  if (nodeName === "INPUT" || nodeName === "TEXTAREA") {
                      const inputElement = htmlElement;
                      // l(inputElement.type);
                      if (inputElement.type === "checkbox") {
                          const data = this._getData(value, state);
                          // 这个时候的data如果是array, 就对value进行处理
                          // 不然就当作bool值处理
                          if (!arrayp(data)) {
                              autorun(() => {
                                  const data = this._getData(value, state);
                                  inputElement.checked = !!data;
                              });
                              inputElement.addEventListener("change", () => {
                                  this._setDate(value, inputElement.checked, state);
                              });
                          }
                          else {
                              autorun(() => {
                                  const data = this._getData(value, state);
                                  let ivalue = getCheckBoxValue(inputElement);
                                  inputElement.checked = data.some((d) => d === ivalue);
                              });
                              inputElement.addEventListener("change", () => {
                                  const data = this._getData(value, state);
                                  let ivalue = getCheckBoxValue(inputElement);
                                  if (inputElement.checked) {
                                      data.push(ivalue);
                                  }
                                  else {
                                      const newData = Store.proxyArray(data.filter((d) => d !== ivalue));
                                      this._setDate(value, newData, state);
                                  }
                              });
                          }
                      }
                      else if (inputElement.type === "radio") {
                          // 单选按钮
                          autorun(() => {
                              const data = this._getData(value, state);
                              inputElement.checked = data === inputElement.value;
                          });
                          inputElement.addEventListener("change", () => {
                              let newData = inputElement.value;
                              if (newData === "on")
                                  newData = "";
                              this._setDate(value, newData, state);
                              inputElement.checked = true;
                          });
                      }
                      else {
                          // 其它
                          autorun(() => {
                              inputElement.value = `${this._getData(value, state)}`;
                          });
                          inputElement.addEventListener("input", () => {
                              this._setDate(value, inputElement.value, state);
                          });
                      }
                  }
                  else if (nodeName === "SELECT") {
                      // 对比value
                      const selectElement = htmlElement;
                      // 稍微延迟下，因为内部的模板可能没有解析
                      setTimeout(() => {
                          autorun(() => {
                              const data = this._getData(value, state);
                              const selectOptions = Array.from(selectElement.options);
                              let notFind = true;
                              // 多选参数必须为 array
                              if (selectElement.multiple && arrayp(data)) {
                                  selectElement.selectedIndex = -1;
                                  for (let index = 0; index < selectOptions.length; index++) {
                                      const option = selectOptions[index];
                                      const v = option.value;
                                      if (data.some(d => d === v)) {
                                          notFind = false;
                                          option.selected = true;
                                      }
                                  }
                              }
                              else {
                                  // 没找到默认-1
                                  const index = selectOptions.findIndex(op => op.value === data);
                                  selectElement.selectedIndex = index;
                                  notFind = false;
                              }
                              if (notFind)
                                  selectElement.selectedIndex = -1;
                          });
                      });
                      selectElement.addEventListener("change", () => {
                          if (selectElement.multiple) {
                              const multipleValue = Array.from(selectElement.options)
                                  .filter(op => op.selected)
                                  .map(op => op.value);
                              this._setDate(value, multipleValue, state);
                          }
                          else {
                              this._setDate(value, selectElement.value, state);
                          }
                      });
                  }
                  htmlElement.removeAttribute(name);
              }
          }
          return depath;
      }
      /**
       * * 循环解析子节点
       * @param childNodes
       * @param state
       */
      _bindingChildrenAttrs(children, state) {
          if (!children.length)
              return null;
          const childNode = children[0];
          // dom节点
          if (elementNodep(childNode)) {
              this._define(childNode, state);
          }
          if (textNodep(childNode)) {
              this._setTextContent(childNode, state);
          }
          return this._bindingChildrenAttrs(children.slice(1), state);
      }
      /**
       * * 解析文本节点的插值表达式
       * @param childNode
       * @param state
       */
      _setTextContent(childNode, state) {
          // 创建一个变量保存源文本
          let _initTextContent = childNode.textContent || emptyString;
          // 文本不包含插值表达式的，那么就跳过
          if (!interpolationExpressionExp.test(_initTextContent))
              return;
          autorun(() => {
              childNode.textContent = _initTextContent.replace(interpolationExpressionExp, (match, g1) => {
                  // 获取插值表达式里面的文本 {{name}} -> name
                  const key = g1.replace(spaceExp, emptyString);
                  let _data = this._getData(key, state);
                  // 如果返回null字符，不好看
                  // hello null :(
                  // hello      :)
                  if (_data === null)
                      return emptyString;
                  return typeof _data === "string"
                      ? _data
                      : JSON.stringify(_data, null, " ");
              });
          });
      }
  }

  return Aja;

})));
//# sourceMappingURL=aja.js.map
