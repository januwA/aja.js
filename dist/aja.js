(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.Aja = factory());
}(this, (function () { 'use strict';

  function createRoot(view) {
      return typeof view === "string"
          ? document.querySelector(view)
          : view;
  }
  function createObject(obj) {
      return obj ? obj : {};
  }
  function toArray(iterable) {
      if (!iterable)
          return [];
      if (Array.from) {
          return Array.from(iterable);
      }
      else {
          return Array.prototype.slice.call(iterable);
      }
  }
  const emptyString = "";
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
  /**
   * * 将['on']转为[null]
   * @param checkbox
   */
  function getCheckboxRadioValue(checkbox) {
      let value = checkbox.value;
      if (value === "on")
          value = null;
      return value;
  }
  /**
   * 查找一个节点是否包含:if指令
   * 并返回
   */
  function hasIfAttr(node, ifInstruction) {
      if (node.attributes && node.attributes.length) {
          const attrs = Array.from(node.attributes);
          return attrs.find(({ name }) => name === ifInstruction);
      }
  }
  /**
   * 查找一个节点是否包含:if指令
   * 并返回
   */
  function hasForAttr(node, forInstruction) {
      if (node.attributes && node.attributes.length) {
          const attrs = Array.from(node.attributes);
          return attrs.find(({ name }) => name === forInstruction);
      }
  }
  /**
   * 查找一个节点是否包含[(model)]指令
   * 并返回
   */
  function hasModelAttr(node, modelAttr) {
      if (node.attributes && node.attributes.length) {
          const attrs = toArray(node.attributes);
          return attrs.find(({ name }) => name === modelAttr);
      }
  }
  /**
   * * 从表达式中获取管道
   * 抽空格，在分离 |
   * @returns [ bindKey, Pipes[] ]
   */
  function parsePipe(key) {
      const [bindKey, ...pipes] = key
          .replace(/[\s]/g, "")
          .split(/(?<![\|])\|(?![\|])/);
      return [bindKey, pipes];
  }
  //# sourceMappingURL=util.js.map

  /**
   * * 谓词
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
      return value.charAt(0) === "#";
  }
  function numberp(str) {
      if (typeof str === "number")
          return true;
      if (str && !str.trim())
          return false;
      return !isNaN(+str);
  }
  /**
   * 'false' || 'true'
   * @param str
   */
  function boolStringp(str) {
      return str === "true" || str === "false";
  }
  function objectp(data) {
      return dataTag(data) === "[object Object]";
  }
  function arrayp(data) {
      return dataTag(data) === "[object Array]";
  }
  function elementNodep(node) {
      return node.nodeType === Node.ELEMENT_NODE;
  }
  function textNodep(node) {
      return node.nodeType === Node.TEXT_NODE;
  }
  function inputp(node) {
      return node.nodeName === "INPUT";
  }
  function textareap(node) {
      return node.nodeName === "TEXTAREA";
  }
  function selectp(node) {
      return node.nodeName === "SELECT";
  }
  function checkboxp(node) {
      return node.type === "checkbox";
  }
  function radiop(node) {
      return node.type === "radio";
  }
  //# sourceMappingURL=p.js.map

  const l = console.log;
  const reactionListeners = [];
  function reactionUpdate(some) {
      for (const reactionItem of reactionListeners) {
          const stateList = reactionItem.listenerStateList();
          l(some, stateList[0], stateList.some(e => e === some));
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
  /**
   * * 任意一个属性的变化，都会触发所有的监听事件
   * @param f
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
   *  autorun(() => {
   *      l('state change'); // x 3
   *    }
   *  );
   *
   *  store.age = 12;
   *  store.name = "ajanuw";
   * ```
   */
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
      static map(object, context = {}) {
          for (const k in object) {
              Object.defineProperty(context, k, {
                  get() {
                      let v = object[k];
                      if (arrayp(v)) {
                          v = Store.list(v);
                      }
                      if (objectp(v)) {
                          v = Store.map(v);
                      }
                      return v;
                  },
                  set(newValue) {
                      // 设置了同样的值， 将跳过
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
          const resriteMethods = [
              "push",
              "pop",
              "shift",
              "unshift",
              "splice",
              "sort",
              "reverse"
          ];
          const proto = Object.create(Array.prototype);
          resriteMethods.forEach(m => {
              const original = proto[m];
              Object.defineProperty(proto, m, {
                  value: function (...args) {
                      const r = original.apply(this, args);
                      // 跟新
                      autorunUpdate();
                      reactionUpdate(this);
                      return r;
                  },
                  writable: true,
                  configurable: true,
                  enumerable: false // 可被枚举 for(let i in o)
              });
          });
          Object.setPrototypeOf(array, proto);
          // 遍历代理数组每项的值
          array = array.map(el => {
              if (objectp(el)) {
                  return Store.map(el);
              }
              if (arrayp(el)) {
                  return Store.list(el);
              }
              return el;
          });
          return array;
      }
  }
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

  class BindingIfBuilder {
      constructor(node, ifInstruction) {
          this.node = node;
          let ifAttr = hasIfAttr(node, ifInstruction);
          if (!ifAttr)
              return;
          this.ifAttr = ifAttr;
          this.commentNode = document.createComment("");
          this.node.before(this.commentNode);
          this.node.removeAttribute(ifInstruction);
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
       */
      checked(show) {
          if (!this.commentNode)
              return;
          if (show) {
              this.commentNode.after(this.node);
          }
          else {
              this.node.replaceWith(this.commentNode);
          }
          this.commentNode.data = this._createIfCommentData(show);
      }
      _createIfCommentData(value) {
          return `{":if": "${!!value}"}`;
      }
  }
  //# sourceMappingURL=binding-if-builder.js.map

  class BindingForBuilder {
      constructor(node, forInstruction) {
          this.node = node;
          this.forInstruction = forInstruction;
          this.forBuffer = [];
          let forAttr = hasForAttr(node, forInstruction);
          // 没有for指令，就不构建下去了
          if (!forAttr)
              return;
          this.forAttr = forAttr;
          this.commentNode = document.createComment("");
          this.fragment = document.createDocumentFragment();
          node.replaceWith(this.commentNode);
          node.removeAttribute(forInstruction);
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
          const p = parsePipe(bindData);
          return {
              variable,
              variables,
              bindData: p[0],
              pipes: p[1]
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
              return numberp(this.bindData);
          }
      }
      get pipes() {
          var _a;
          if (this.hasForAttr) {
              return ((_a = this.forAttrValue) === null || _a === void 0 ? void 0 : _a.pipes) || [];
          }
          else {
              return [];
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
          if (this.commentNode && this.fragment) {
              this.commentNode.after(this.fragment);
              this.commentNode.data = this.createForCommentData(data);
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
      createItem() {
          const item = this.node.cloneNode(true);
          this.add(item);
          return item;
      }
  }
  //# sourceMappingURL=binding-for-builder.js.map

  const pipes = {
      /**
       * * 全部大写
       * @param value
       */
      uppercase(value) {
          return value.toUpperCase();
      },
      /**
       * * 全部小写
       * @param value
       */
      lowercase(value) {
          return value.toLowerCase();
      },
      /**
       * * 首字母小写
       * @param str
       */
      capitalize(str) {
          return str.charAt(0).toUpperCase() + str.substring(1);
      },
      json(str) {
          return JSON.stringify(str, null, " ");
      },
      slice(str, start, end) {
          return str.slice(start, end);
      }
  };
  // 开始管道加工
  function usePipes(data, pipeList, getData) {
      let _result = data;
      if (pipeList.length) {
          pipeList.forEach(pipe => {
              const [p, ...pipeArgs] = pipe.split(":");
              if (p in pipes) {
                  let parsePipeArgs;
                  if (getData) {
                      parsePipeArgs = pipeArgs.map(arg => {
                          if (numberp(arg))
                              return arg;
                          return getData(arg);
                      });
                  }
                  else {
                      parsePipeArgs = pipeArgs;
                  }
                  _result = pipes[p](_result, ...parsePipeArgs);
              }
          });
      }
      return _result;
  }
  //# sourceMappingURL=pipes.js.map

  class BindingTextBuilder {
      constructor(node) {
          this.node = node;
          this.text = node.textContent || "";
      }
      /**
       * * 是否需要解析
       */
      get needParse() {
          return interpolationExpressionExp.test(this.text);
      }
      setText(getData) {
          const text = this.text.replace(interpolationExpressionExp, (match, g1) => {
              const key = g1.replace(spaceExp, "");
              const pipeList = parsePipe(key)[1];
              const data = getData(key);
              const pipeData = usePipes(data, pipeList, arg => getData(arg));
              return pipeData;
          });
          if (text !== this.node.textContent) {
              this.node.textContent = text;
          }
      }
  }
  //# sourceMappingURL=binding-text-builder.js.map

  class AjaModel {
      constructor(node) {
          this.node = node;
          this.control = {
              touched: this.node.classList.contains(AjaModel.classes.touched),
              untouched: this.node.classList.contains(AjaModel.classes.untouched),
              dirty: this.node.classList.contains(AjaModel.classes.dirty),
              pristine: this.node.classList.contains(AjaModel.classes.pristine),
              valid: this.node.classList.contains(AjaModel.classes.valid),
              invalid: this.node.classList.contains(AjaModel.classes.invalid)
          };
          this.control = Store.map(this.control);
          this._setup();
      }
      get model() {
          return this.node.value;
      }
      get name() {
          return this.node.name;
      }
      get value() {
          return this.node.value;
      }
      get disabled() {
          return this.node.disabled;
      }
      get enabled() {
          return !this.disabled;
      }
      get dirty() {
          return this.control.dirty;
      }
      get pristine() {
          return this.control.pristine;
      }
      get valid() {
          return this.control.valid;
      }
      get invalid() {
          return this.control.invalid;
      }
      get touched() {
          return this.control.touched;
      }
      get untouched() {
          return this.control.untouched;
      }
      _setup() {
          // 值发生变化了
          this.node.addEventListener("input", () => {
              this.control.pristine = false;
              this.control.dirty = true;
              if (this.node.required && this.node.value) {
                  // 控件的值有效
                  this.control.valid = true;
                  this.control.invalid = false;
              }
              else {
                  // 控件的值无效
                  this.control.valid = false;
                  this.control.invalid = true;
              }
          });
          // 控件被访问了
          this.node.addEventListener("blur", () => {
              this.control.untouched = false;
              this.control.touched = true;
          });
      }
  }
  AjaModel.classes = {
      // 控件被访问过
      // 一般就是监听blur事件
      touched: "aja-touched",
      untouched: "aja-untouched",
      // 控件的值变化了
      dirty: "aja-dirty",
      pristine: "aja-pristine",
      // 控件的值有效
      valid: "aja-valid",
      invalid: "aja-invalid" // false
  };
  //# sourceMappingURL=aja-model.js.map

  class BindingModelBuilder {
      constructor(node, modelAttr) {
          this.node = node;
          this.modelAttr = modelAttr;
          this._setup();
      }
      get options() {
          if (!this.select)
              return [];
          return toArray(this.select.options);
      }
      get selectValues() {
          return this.options.filter(op => op.selected).map(op => op.value);
      }
      _setup() {
          if (inputp(this.node) || textareap(this.node)) {
              if (checkboxp(this.node)) {
                  this.checkbox = this.node;
              }
              else if (radiop(this.node)) {
                  this.radio = this.node;
              }
              else {
                  this.input = this.node;
              }
          }
          else if (selectp(this.node)) {
              this.select = this.node;
          }
          this.node.classList.add(AjaModel.classes.untouched, AjaModel.classes.pristine, AjaModel.classes.valid);
          // 控件被访问了
          // 所有绑定的model的元素，都会添加这个服务
          this.node.addEventListener("blur", () => {
              this.touched();
          });
          this.node.removeAttribute(this.modelAttr.name);
      }
      checkboxSetup(states, isArray) {
          if (this.checkbox) {
              if (isArray) {
                  const data = states[0];
                  let ivalue = getCheckboxRadioValue(this.checkbox);
                  const checkde = data.some((d) => d === ivalue);
                  this.checkbox.checked = checkde;
              }
              else {
                  this.checkbox.checked = !!states[0];
              }
          }
      }
      checkboxChangeListener(isArray, data, setData) {
          if (this.checkbox) {
              this.checkbox.addEventListener("change", () => {
                  if (!this.checkbox)
                      return;
                  if (isArray) {
                      let ivalue = getCheckboxRadioValue(this.checkbox);
                      if (this.checkbox.checked)
                          data.push(ivalue);
                      else
                          data.remove((d) => d === ivalue);
                  }
                  else {
                      setData(this.checkbox.checked);
                  }
                  this.dirty();
              });
          }
      }
      radioSetup(states) {
          if (this.radio) {
              this.radio.checked = states[0] === this.radio.value;
          }
      }
      radioChangeListener(setData) {
          if (this.radio) {
              this.radio.addEventListener("change", () => {
                  if (!this.radio)
                      return;
                  let newData = getCheckboxRadioValue(this.radio);
                  this.radio.checked = true;
                  this.dirty();
                  setData(newData);
              });
          }
      }
      inputSetup(states) {
          if (this.input) {
              this.input.value = states[0];
          }
      }
      inputChangeListener(setData) {
          if (this.input) {
              // 值发生变化了
              this.input.addEventListener("input", () => {
                  var _a;
                  this.dirty();
                  setData((_a = this.input) === null || _a === void 0 ? void 0 : _a.value);
              });
          }
      }
      selectSetup(states) {
          if (this.select) {
              const data = states[0];
              const selectOptions = toArray(this.select.options);
              // 多选参数必须为 array
              if (this.select.multiple && arrayp(data)) {
                  let notFind = true;
                  this.select.selectedIndex = -1;
                  this.options.forEach(option => {
                      if (data.some((d) => d === option.value)) {
                          notFind = false;
                          option.selected = true;
                      }
                  });
                  if (notFind)
                      this.select.selectedIndex = -1;
              }
              else {
                  // 没找到默认-1
                  const index = selectOptions.findIndex(op => op.value === data);
                  this.select.selectedIndex = index;
              }
          }
      }
      selectChangeListener(setData) {
          if (this.select) {
              this.select.addEventListener("change", () => {
                  var _a, _b;
                  if ((_a = this.select) === null || _a === void 0 ? void 0 : _a.multiple) {
                      setData(Store.list(this.selectValues));
                  }
                  else {
                      setData((_b = this.select) === null || _b === void 0 ? void 0 : _b.value);
                  }
                  this.dirty();
              });
          }
      }
      /**
       * * 控件的值有效时
       */
      valid() {
          this.node.classList.replace(AjaModel.classes.invalid, AjaModel.classes.valid);
      }
      /**
       * * 控件的值无效时
       */
      invalid() {
          this.node.classList.replace(AjaModel.classes.valid, AjaModel.classes.invalid);
      }
      /**
       * * 控件的值发生变化
       */
      dirty() {
          this.node.classList.replace(AjaModel.classes.pristine, AjaModel.classes.dirty);
      }
      /**
       * * 控件被访问
       */
      touched() {
          this.node.classList.replace(AjaModel.classes.untouched, AjaModel.classes.touched);
      }
  }
  //# sourceMappingURL=binding-model-builder.js.map

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
              this._instructionPrefix = options.instructionPrefix.toLowerCase();
          if (options.templateEvent)
              this._templateEvent = options.templateEvent;
          if (options.modeldirective)
              this._modeldirective = options.modeldirective.toLowerCase();
          if (options.pipes)
              Object.assign(pipes, options.pipes);
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
          let depath = true;
          // 没有attrs就不解析了
          if (root.attributes && root.attributes.length) {
              // 优先解析if -> for -> 其它属性
              depath = this._parseBindIf(root, state);
              if (depath)
                  depath = this._parseBindFor(root, state);
              if (depath) {
                  const attrs = Array.from(root.attributes);
                  this._parseBindAttrs(root, attrs, state);
              }
          }
          const children = Array.from(root.childNodes);
          if (depath && children.length) {
              this._bindingChildrenAttrs(children, state);
          }
      }
      /**
       * * 解析指定HTMLElement的属性
       * @param node
       * @param state
       */
      _parseBindAttrs(node, attrs, state) {
          for (const attr of attrs) {
              const { name, value } = attr;
              // #input #username
              if (tempvarp(name)) {
                  this._tempvarBindHandle(node, attr);
                  continue;
              }
              // [title]='xxx'
              if (attrp(name)) {
                  this._attrBindHandle(node, attr, state);
                  continue;
              }
              // (click)="echo('hello',$event)"
              if (eventp(name)) {
                  this._eventBindHandle(node, attr, state);
                  continue;
              }
          }
          // 其它属性解析完，在解析双向绑定
          const modelAttr = hasModelAttr(node, this._modeldirective);
          if (modelAttr) {
              const model = new BindingModelBuilder(node, modelAttr);
              const { value } = modelAttr;
              if (inputp(node) || textareap(node)) {
                  if (model.checkbox && checkboxp(model.checkbox)) {
                      const data = this._getData(value, state);
                      // 这个时候的data如果是array, 就对value进行处理
                      // 不然就当作bool值处理
                      const isArrayData = arrayp(data);
                      reaction(() => [this._getData(value, state)], states => {
                          model.checkboxSetup(states, isArrayData);
                      });
                      model.checkboxChangeListener(isArrayData, data, newValue => {
                          this._setDate(value, newValue, state);
                      });
                  }
                  else if (model.radio && radiop(model.radio)) {
                      // 单选按钮
                      reaction(() => [this._getData(value, state)], states => {
                          model.radioSetup(states);
                      });
                      model.radioChangeListener(newValue => {
                          this._setDate(value, newValue, state);
                      });
                  }
                  else {
                      // 其它
                      reaction(() => [this._getData(value, state)], states => {
                          model.inputSetup(states);
                      });
                      model.inputChangeListener(newValue => {
                          this._setDate(value, newValue, state);
                      });
                  }
              }
              else if (selectp(node)) {
                  setTimeout(() => {
                      reaction(() => [this._getData(value, state)], states => {
                          model.selectSetup(states);
                      });
                  });
                  model.selectChangeListener(newValue => {
                      this._setDate(value, newValue, state);
                  });
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
          // 抽掉所有空格，再把管道排除
          const [bindKey, pipeList] = parsePipe(key);
          // 在解析绑定的变量
          const bindKeys = bindKey.split(".");
          let _result;
          const firstKey = bindKeys[0];
          // 模板变量
          if (firstKey.toLowerCase() in this._templateVariables) {
              // 绑定的模板变量，全是小写
              const lowerKeys = bindKeys.map(k => k.toLowerCase());
              for (const k of lowerKeys) {
                  _result = _result ? _result[k] : this._templateVariables[k];
              }
          }
          // state
          if (_result === undefined) {
              if (firstKey in state) {
                  for (const k of bindKeys) {
                      _result = _result ? _result[k] : state[k];
                  }
              }
          }
          // this.$store
          if (_result === undefined && state !== this.$store) {
              if (firstKey in this.$store) {
                  for (const k of bindKeys) {
                      _result = _result ? _result[k] : this.$store[k];
                  }
              }
          }
          if (_result === undefined) {
              // 没救了， eval随便解析返回个值吧!
              _result = this._parseJsString(bindKey, state);
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
       * 解析一个节点上是否绑定了:if指令, 并更具指令的值来解析节点
       * @param node
       * @param attrs
       */
      _parseBindIf(node, state) {
          let show = true;
          const bifb = new BindingIfBuilder(node, this._ifInstruction);
          if (bifb.hasIfAttr) {
              const value = bifb.value;
              if (boolStringp(value)) {
                  show = value === "true";
                  bifb.checked(show);
              }
              else {
                  reaction(() => [this._getData(value, state)], states => {
                      show = states[0];
                      const pipeList = parsePipe(value)[1];
                      show = usePipes(show, pipeList, key => this._getData(key, state));
                      bifb.checked(show);
                  });
              }
          }
          return show;
      }
      /**
       * 解析节点上绑定的for指令
       * 如果节点绑定了for指令，这个节点将不会继续被解析
       * @param node
       * @param state
       */
      _parseBindFor(node, state) {
          const forBuilder = new BindingForBuilder(node, this._forInstruction);
          if (forBuilder.hasForAttr) {
              // 创建注释节点
              if (forBuilder.isNumberData) {
                  let _data = +forBuilder.bindData;
                  _data = usePipes(_data, forBuilder.pipes, key => this._getData(key, state));
                  for (let v = 0; v < _data; v++) {
                      const forState = forBuilder.createForContextState(v);
                      const item = forBuilder.createItem();
                      this._define(item, forState);
                  }
                  forBuilder.draw(_data);
              }
              else {
                  const _that = this;
                  reaction(() => [this._getData(forBuilder.bindData, state)], states => {
                      let _data = states[0];
                      _data = usePipes(_data, forBuilder.pipes, key => this._getData(key, state));
                      forBuilder.clear();
                      let keys;
                      if (arrayp(_data))
                          keys = Object.keys(_data);
                      else
                          keys = _data;
                      for (const k in keys) {
                          const forState = forBuilder.createForContextState(k, _data[k], false);
                          const item = forBuilder.createItem();
                          _that._define(item, forState);
                      }
                      forBuilder.draw(_data);
                  });
              }
          }
          return !forBuilder.hasForAttr;
      }
      /**
       * 处理 [title]='xxx' 解析
       * @param node
       * @param param1
       */
      _attrBindHandle(node, { name, value }, state) {
          let [attrName, attrChild] = name
              .replace(attrStartExp, emptyString)
              .replace(attrEndExp, emptyString)
              .split(".");
          reaction(() => [this._getData(value, state)], states => {
              const data = states[0];
              if (attrName === "style") {
                  if (attrChild && attrChild in node.style) {
                      node.style[attrChild] = data;
                  }
                  else {
                      const styles = data;
                      for (const key in styles) {
                          if (Object.getOwnPropertyDescriptor(node.style, key) &&
                              styles[key]) {
                              reaction(() => [styles[key]], states => {
                                  node.style[key] = states[0];
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
                                      node.classList.add(klass);
                                  }
                                  else {
                                      node.classList.remove(klass);
                                  }
                              });
                          }
                      }
                      else {
                          node.setAttribute(attrName, _value);
                      }
                  }
                  else {
                      if (_value) {
                          node.classList.add(attrChild);
                      }
                  }
              }
              else if (attrName === "innerhtml") {
                  node.innerHTML = data;
              }
              else {
                  let _value = data;
                  if (_value === null)
                      _value = emptyString;
                  if (_value) {
                      node.setAttribute(attrName, _value);
                  }
                  else {
                      if (node.hasAttribute(attrName))
                          node.removeAttribute(attrName);
                  }
              }
          });
          node.removeAttribute(name);
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
       * @param node
       * @param param1
       */
      _tempvarBindHandle(node, { name, value }) {
          const _key = name.replace(tempvarExp, emptyString);
          if (value === "ajaModel") {
              // 表单元素才绑定 ajaModel
              this._templateVariables[_key] = new AjaModel(node);
          }
          else {
              this._templateVariables[_key] = node;
          }
          node.removeAttribute(name);
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
          const textBuilder = new BindingTextBuilder(childNode);
          if (!textBuilder.needParse)
              return;
          autorun(() => {
              textBuilder.setText(key => this._getData(key, state));
          });
      }
  }

  //# sourceMappingURL=main.js.map

  return Aja;

})));
//# sourceMappingURL=aja.js.map
