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
  function boolStringp(str) {
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
  /**
   * Object.prototype.toString.call({}) -> "[object Object]"
   * @param data
   */
  function dataTag(data) {
      return Object.prototype.toString.call(data);
  }
  function objectp(data) {
      return dataTag(data) === "[object Object]";
  }
  function arrayp(data) {
      return dataTag(data) === "[object Array]";
  }
  /**
   * 把字符串安全格式化 为正则表达式源码
   * {{ arr[0] }} -> \{\{ arr\[0\] \}\}
   * @param str
   */
  function escapeRegExp(str) {
      return str.replace(/([-.*+?^${}()|[\]\/\\])/g, "\\$1");
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
   * * <template> 模板节点
   * @param node
   */
  function templatep(node) {
      return node.nodeName === "TEMPLATE";
  }
  //# sourceMappingURL=util.js.map

  const reactionListeners = [];
  function reactionUpdate(some) {
      for (const reactionItem of reactionListeners) {
          const stateList = reactionItem.listenerStateList();
          if (stateList.some(e => e === some)) {
              reactionItem.cb(stateList);
          }
      }
  }
  /**
   * * 监听指定属性的变更
   * @param listenerStateList
   * @param cb
   *
   * ## Example
   *
   * ```ts
   * let store = new Store({
   *    state: {
   *      name: 22,
   *      age: 22
   *    }
   *  });
   *
   *  reaction(
   *    () => [store.name],
   *    state => {
   *      l(state); // ["ajanuw"]
   *    }
   *  );
   *
   *  store.age = 12;
   *  store.name = "ajanuw";
   * ```
   */
  function reaction(listenerStateList, cb) {
      cb(listenerStateList());
      reactionListeners.push({
          listenerStateList,
          cb
      });
  }
  const autorunListeners = [];
  function autorunUpdate() {
      for (const f of autorunListeners) {
          f();
      }
  }
  class Store {
      /**
       *
       * @param state 需要代理的数据
       */
      constructor({ state, computeds, actions }) {
          Store.map(state, this);
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
      static map(object, context) {
          for (const k in object) {
              let v = object[k];
              if (arrayp(v)) {
                  v = Store.list(v);
              }
              if (objectp(v)) {
                  v = Store.map(v, {});
              }
              object[k] = v;
              Object.defineProperty(context, k, {
                  get() {
                      const _r = object[k];
                      return _r;
                  },
                  set(newValue) {
                      // 用户设置了同样的值， 将跳过
                      if (newValue === object[k])
                          return;
                      object[k] = newValue;
                      autorunUpdate();
                      reactionUpdate(object[k]);
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
      static list(array) {
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
                  const _applyArgs = Store.list(args);
                  // 调用原始方法
                  const r = original.apply(this, _applyArgs);
                  // 跟新
                  autorunUpdate();
                  reactionUpdate(this);
                  return r;
              };
          });
          // 遍历代理数组每项的值
          array = array.map(el => {
              if (objectp(el)) {
                  return Store.map(el, {});
              }
              if (arrayp(el)) {
                  return Store.list(el);
              }
              return el;
          });
          Object.setPrototypeOf(array, arrayAugmentations);
          return array;
      }
  }
  //# sourceMappingURL=store.js.map

  //* 匹配 {{ name }} {{ obj.age }}
  // export const interpolationExpressionExp = /{{([\w\s\.][\s\w\.]+)}}/g;
  const interpolationExpressionExp = /{{(.*?)}}/g;
  const attrStartExp = /^\[/;
  const attrEndExp = /\]$/;
  const eventStartExp = /^\(/;
  const eventEndExp = /\)$/;
  const tempvarExp = /^#/;
  //# sourceMappingURL=exp.js.map

  class BindingIfBuilder {
      constructor(node, ifInstruction) {
          this.node = node;
          this.cloneChildren = [];
          const attrs = Array.from(node.attributes);
          let ifAttr = attrs.find(({ name }) => name === ifInstruction);
          if (!ifAttr)
              return;
          this.ifAttr = ifAttr;
          this.commentNode = document.createComment("");
          node.before(this.commentNode);
      }
      /**
       * * 只有存在if指令，其他的方法和属性才生效
       */
      get hasIfAttr() {
          return !!this.ifAttr;
      }
      get value() {
          if (this.hasIfAttr) {
              return this.ifAttr.value.trim();
          }
      }
      /**
       * * 这里使用了回调把template标签给渲染了
       * @param show
       * @param cb
       */
      checked(show, cb) {
          if (!this.commentNode)
              return;
          if (show) {
              if (templatep(this.node)) {
                  let clone = document.importNode(this.node.content, true);
                  this.cloneChildren.push(...Array.from(clone.children));
                  cb(clone);
                  // 先把template节点替换为注释节点
                  this.node.replaceWith(this.commentNode);
                  // 再把fgm节点注释节点下面插
                  this.commentNode.after(clone);
              }
              else {
                  this.commentNode.after(this.node);
              }
          }
          else {
              if (templatep(this.node)) {
                  for (const item of this.cloneChildren) {
                      item.remove();
                  }
                  this.cloneChildren = [];
              }
              else {
                  this.node.replaceWith(this.commentNode);
              }
          }
          this.commentNode.data = this._createIfCommentData(show);
      }
      _createIfCommentData(value) {
          return `{":if": "${!!value}"}`;
      }
  }

  class BindingForBuilder {
      constructor(elem, forInstruction) {
          this.elem = elem;
          this.forInstruction = forInstruction;
          this.forBuffer = [];
          const attrs = Array.from(this.elem.attributes) || [];
          let forAttr = attrs.find(({ name }) => name === this.forInstruction);
          // 没有for指令，就不构建下去了
          if (!forAttr)
              return;
          this.forAttr = forAttr;
          this.cm = document.createComment("");
          this.fragment = document.createDocumentFragment();
          elem.replaceWith(this.cm);
          elem.removeAttribute(forInstruction);
      }
      get hasForAttr() {
          return !!this.forAttr;
      }
      get forAttrValue() {
          if (!this.forAttr)
              return null;
          let [variable, bindData] = this.forAttr.value
              .split(/\bin\b/)
              .map(s => s.trim());
          const variables = variable
              .trim()
              .replace(eventStartExp, emptyString)
              .replace(eventEndExp, emptyString)
              .split(",")
              .map(v => v.trim());
          return {
              variable,
              variables,
              bindData
          };
      }
      get bindVar() {
          if (this.hasForAttr) {
              return this.forAttrValue.variable;
          }
      }
      get bindKey() {
          if (this.hasForAttr) {
              return this.forAttrValue.variables[0];
          }
      }
      get bindValue() {
          if (this.hasForAttr) {
              return this.forAttrValue.variables[1];
          }
      }
      get bindData() {
          if (this.hasForAttr) {
              return this.forAttrValue.bindData;
          }
      }
      get isNumberData() {
          if (this.hasForAttr) {
              return isNumber(this.bindData);
          }
      }
      /**
       * * 添加一个节点
       * @param item
       */
      add(item) {
          if (this.fragment) {
              this.fragment.append(item);
              this.forBuffer.push(item);
          }
      }
      /**
       * * 将所有节点插入DOM
       * @param data
       */
      draw(data) {
          if (this.cm && this.fragment) {
              this.cm.after(this.fragment);
              this.cm.data = this.createForCommentData(data);
          }
      }
      /**
       * * 清除所有节点
       */
      clear() {
          for (const forItem of this.forBuffer) {
              forItem.remove();
          }
          this.forBuffer = [];
      }
      createForContextState(k, v = null, isNumber = true) {
          const forState = {};
          if (isNumber && this.bindVar) {
              Object.defineProperty(forState, this.bindVar, {
                  get() {
                      return k;
                  }
              });
          }
          else {
              if (this.bindKey && this.bindValue) {
                  Object.defineProperties(forState, {
                      [this.bindKey]: {
                          get() {
                              return k;
                          }
                      },
                      [this.bindValue]: {
                          get() {
                              return v;
                          }
                      }
                  });
              }
              else if (this.bindKey) {
                  Object.defineProperties(forState, {
                      [this.bindKey]: {
                          get() {
                              return v;
                          }
                      }
                  });
              }
          }
          return forState;
      }
      createForCommentData(obj) {
          let data = obj;
          if (arrayp(data)) {
              data = obj.slice(0, 6);
          }
          return `{":for": "${data}"}`;
      }
  }
  //# sourceMappingURL=binding-for-builder.js.map

  class BindingTextBuilder {
      constructor(childNode) {
          this.childNode = childNode;
          this._bindTextContent = childNode.textContent || "";
      }
      /**
       * * 是否需要解析
       */
      get needParse() {
          return interpolationExpressionExp.test(this._bindTextContent);
      }
      /**
       * * "{{name}} {{ age }}" -> ["{{name}}", "{{ age }}"]
       */
      get matchs() {
          let matchs = this._bindTextContent.match(interpolationExpressionExp) || [];
          return matchs;
      }
      /**
       * * ["{{name}}", "{{ age }}"] -> ["name", "age"]
       */
      get bindVariables() {
          return this.matchs.map(e => e.replace(/[{}\s]/g, ""));
      }
      draw(states) {
          this.childNode.textContent = this._parseBindingTextContent(this._bindTextContent, this.matchs, states);
      }
      /**
       * * 解析文本的表达式
       *
       * @param textContent  "{{ age }} - {{ a }} = {{ a }}""
       * @param matchs  ["{{ age }}", "{{ a }}", "{{ a }}"]
       * @param states [12, "x", "x"]
       * @returns "12 - x = x"
       */
      _parseBindingTextContent(textContent, matchs, states) {
          if (matchs.length !== states.length)
              return "[[aja.js: 框架意外的解析错误!!!]]";
          for (let index = 0; index < matchs.length; index++) {
              const m = matchs[index];
              let state = states[index];
              if (state === null)
                  state = "";
              state =
                  typeof state === "string" ? state : JSON.stringify(state, null, " ");
              textContent = textContent.replace(new RegExp(escapeRegExp(m), "g"), state);
          }
          return textContent;
      }
  }
  //# sourceMappingURL=binding-text-builder.js.map

  const l = console.log;
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
          if (options.initState)
              options.initState.call(this.$store);
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
          if (depath) {
              this._bindingChildrenAttrs(Array.from(root.childNodes), state);
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
       * @param isModel 是否为展开的双向绑定事件  [(model)]="name" (modelChange)="nameChange($event)"
       */
      _parseArgsToArguments(args, e, state, isModel = false) {
          return args.map(arg => {
              if (!arg)
                  return arg;
              let el = arg.trim();
              if (el === this._templateEvent) {
                  let _result;
                  if (isModel) {
                      if (e.target) {
                          _result = e.target.value;
                      }
                  }
                  else {
                      _result = e;
                  }
                  return _result;
              }
              return this._getData(el, state);
          });
      }
      /**
       * 处理 :if 解析
       * @param node
       * @param attrs
       */
      _ifBindHandle(node, attrs, state) {
          let show = true;
          const bifb = new BindingIfBuilder(node, this._ifInstruction);
          if (bifb.hasIfAttr) {
              const value = bifb.value;
              if (boolStringp(value)) {
                  show = value === "true";
                  bifb.checked(show, clone => {
                      l(clone);
                      if (clone)
                          this._define(clone, state);
                  });
              }
              else {
                  reaction(() => [this._getData(value, state)], states => {
                      show = states[0];
                      bifb.checked(show, clone => {
                          if (clone)
                              this._define(clone, state);
                      });
                  });
              }
              node.removeAttribute(this._ifInstruction);
          }
          return show;
      }
      _forBindHandle(htmlElement, state) {
          const bforb = new BindingForBuilder(htmlElement, this._forInstruction);
          if (bforb.hasForAttr) {
              // 创建注释节点
              if (bforb.isNumberData) {
                  const _data = +bforb.bindData;
                  for (let v = 0; v < _data; v++) {
                      const forState = bforb.createForContextState(v);
                      const item = htmlElement.cloneNode(true);
                      bforb.add(item);
                      this._define(item, forState);
                  }
                  bforb.draw(_data);
              }
              else {
                  const _that = this;
                  reaction(() => [this._getData(bforb.bindData, state)], states => {
                      const _data = states[0];
                      bforb.clear();
                      let keys;
                      if (arrayp(_data))
                          keys = Object.keys(_data);
                      else
                          keys = _data;
                      for (const k in keys) {
                          const forState = bforb.createForContextState(k, _data[k], false);
                          // ? [cloneNode]不会克隆事件
                          // ? 所以我才创建了[_cloneNode]函数
                          // ? 但是后来发现[cloneNode]莫名其妙的绑定了事件
                          //
                          // const item =  _that._cloneNode(htmlElement, forState);
                          const item = htmlElement.cloneNode(true);
                          bforb.add(item);
                          _that._define(item, forState);
                      }
                      bforb.draw(_data);
                  });
              }
          }
          return !bforb.hasForAttr;
      }
      /**
       * 处理 [title]='xxx' 解析
       * @param htmlElement
       * @param param1
       */
      _attrBindHandle(htmlElement, { name, value }, state) {
          let [attrName, attrChild] = name
              .replace(attrStartExp, emptyString)
              .replace(attrEndExp, emptyString)
              .split(".");
          reaction(() => [this._getData(value, state)], states => {
              const data = states[0];
              if (attrName === "style") {
                  if (attrChild && attrChild in htmlElement.style) {
                      htmlElement.style[attrChild] = data;
                  }
                  else {
                      const styles = data;
                      for (const key in styles) {
                          if (Object.getOwnPropertyDescriptor(htmlElement.style, key) &&
                              styles[key]) {
                              reaction(() => [styles[key]], states => {
                                  htmlElement.style[key] = states[0];
                              });
                          }
                      }
                  }
              }
              else if (attrName === "class") {
                  let _value = data;
                  if (_value === null)
                      _value = emptyString;
                  if (!attrChild) {
                      if (objectp(_value)) {
                          for (const klass in _value) {
                              reaction(() => [_value[klass]], states => {
                                  if (states[0]) {
                                      htmlElement.classList.add(klass);
                                  }
                                  else {
                                      htmlElement.classList.remove(klass);
                                  }
                              });
                          }
                      }
                      else {
                          htmlElement.setAttribute(attrName, _value);
                      }
                  }
                  else {
                      if (_value) {
                          htmlElement.classList.add(attrChild);
                      }
                  }
              }
              else if (attrName === "innerhtml") {
                  htmlElement.innerHTML = data;
              }
              else {
                  let _value = data;
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
          let eventName = name
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
          const modelChangep = eventName === "modelchange";
          if (modelChangep)
              eventName = "input";
          htmlElement.addEventListener(eventName, e => {
              //? 每次点击都需解析参数?
              //! 如果只解析一次，那么模板变量需要提前声明, 并且模板变量不会更新!
              if (this.$actions && funcName in this.$actions) {
                  this.$actions[funcName].apply(this.$store, this._parseArgsToArguments(args, e, state, modelChangep));
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
          const attrs = Array.from(htmlElement.attributes || []);
          if (!attrs.length)
              return depath;
          // :if
          depath = this._ifBindHandle(htmlElement, attrs, state);
          // :for
          depath = this._forBindHandle(htmlElement, state);
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
                              reaction(() => [this._getData(value, state)], states => {
                                  inputElement.checked = !!states[0];
                              });
                              inputElement.addEventListener("change", () => {
                                  this._setDate(value, inputElement.checked, state);
                              });
                          }
                          else {
                              reaction(() => [this._getData(value, state)], states => {
                                  const data = states[0];
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
                                      const newData = Store.list(data.filter((d) => d !== ivalue));
                                      this._setDate(value, newData, state);
                                  }
                              });
                          }
                      }
                      else if (inputElement.type === "radio") {
                          // 单选按钮
                          reaction(() => [this._getData(value, state)], states => {
                              inputElement.checked = states[0] === inputElement.value;
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
                          reaction(() => [this._getData(value, state)], states => {
                              inputElement.value = `${states[0]}`;
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
                          reaction(() => [this._getData(value, state)], states => {
                              const data = states[0];
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
       * * 递归解析子节点
       * @param childNodes
       * @param state
       */
      _bindingChildrenAttrs(children, state) {
          if (!children.length)
              return;
          let node = children[0];
          if (elementNodep(node)) {
              this._define(node, state);
          }
          if (textNodep(node)) {
              this._setTextContent(node, state);
          }
          return this._bindingChildrenAttrs(children.slice(1), state);
      }
      /**
       * * 解析文本节点的插值表达式
       * @param childNode
       * @param state
       */
      _setTextContent(childNode, state) {
          const btextb = new BindingTextBuilder(childNode);
          if (!btextb.needParse)
              return;
          reaction(() => btextb.bindVariables.map(k => this._getData(k, state)), (states) => {
              btextb.draw(states);
          });
      }
  }
  //# sourceMappingURL=aja.js.map

  //# sourceMappingURL=main.js.map

  return Aja;

})));
//# sourceMappingURL=aja.js.map
