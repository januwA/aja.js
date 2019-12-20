import {
  createRoot,
  createObject,
  parsePipe,
  toArray,
} from "./utils/util";

import { observable, autorun, action } from "mobx";
import {
  eventp,
  boolStringp,
  attrp,
  elementNodep,
  textNodep
} from "./utils/p";
import { ajaPipes, usePipes } from "./pipes";
import { ContextData } from "./classes/context-data";
import { FormControl, FormGroup } from "./classes/forms";
import { getData } from "./core";
import { Pipes } from "./pipes/interfaces/interfaces";
import { BindingAttrBuilder, BindingTextBuilder, BindingModelBuilder, BindingIfBuilder, BindingEventBuilder, BindingForBuilder, BindingTempvarBuilder } from "./classes/binding-builder";

const l = console.log;


export interface AjaConfigOpts {
  state?: any;
  actions?: {
    [name: string]: Function;
  };
  initState?: Function;
  pipes?: Pipes;
}

class Aja {
  static FormControl = FormControl;
  static FormGroup = FormGroup;

  $store?: any;
  $actions?: {
    [name: string]: Function;
  };

  constructor(view?: string | HTMLElement, options?: AjaConfigOpts) {
    if (!options || !view) return;
    const root = createRoot(view);
    if (root === null) return;
    if (options.pipes) Object.assign(ajaPipes, options.pipes);
    this._proxyState(options);
    if (options.initState) options.initState.call(this.$store);

    const contextData = new ContextData({
      store: this.$store,
      tData: new BindingTempvarBuilder(root)
    });
    this._scan(root, contextData);
  }

  /**
   * 扫描绑定
   * @param root
   */
  private _scan(root: HTMLElement, contextData: ContextData): void {
    let depath = true;
    // 没有attrs就不解析了
    if (root.attributes && root.attributes.length) {
      // 优先解析if -> for -> 其它属性
      depath = this._parseBindIf(root, contextData);
      if (depath) depath = this._parseBindFor(root, contextData);
      if (depath) {
        const attrs: Attr[] = toArray(root.attributes);
        this._parseBindAttrs(root, attrs, contextData);
      }
    }

    const childNodes = toArray(root.childNodes);
    if (depath && childNodes.length) {
      this._bindingChildNodesAttrs(childNodes, contextData);
    }
  }

  /**
   * * 解析指定HTMLElement的属性
   * @param node
   * @param contextData
   */
  private _parseBindAttrs(
    node: HTMLElement,
    attrs: Attr[],
    contextData: ContextData
  ) {
    for (const attr of attrs) {
      const { name } = attr;

      // [title]='xxx'
      if (attrp(name)) {
        new BindingAttrBuilder(node, attr, contextData);
        continue;
      }

      // (click)="echo('hello',$event)"
      if (eventp(name)) {
        new BindingEventBuilder(node, attr, contextData, this.$actions);
        continue;
      }
    }
    new BindingModelBuilder(node, contextData);
  }

  private _proxyState(options: AjaConfigOpts): void {
    const state = createObject<any>(options.state);
    this.$actions = createObject<any>(options.actions);

    if (!this.$actions) return;

    const bounds: { [k: string]: any } = {};
    Object.keys(this.$actions).forEach(ac => (bounds[ac] = action.bound));
    this.$store = observable(Object.assign(state, this.$actions), bounds, {
      deep: true
    });
  }

  /**
   * 解析一个节点上是否绑定了:if指令, 更具指令的值来解析节点
   * @param node
   * @param attrs
   */
  private _parseBindIf(node: HTMLElement, contextData: ContextData): boolean {
    let show = true;
    const ifBuilder = new BindingIfBuilder(node);
    if (ifBuilder.attr) {
      if (boolStringp(ifBuilder.value)) {
        show = ifBuilder.value === "true";
        ifBuilder.checked(show);
      } else {
        const [bindKey, pipeList] = parsePipe(ifBuilder.value);
        autorun(() => {
          show = getData(bindKey, contextData);
          show = usePipes(show, pipeList, contextData);
          if (show) {
            this._scan(
              node,
              contextData.copyWith({
                tvState: contextData.tData.copyWith(node)
              })
            );
          }
          ifBuilder.checked(show);
        });
      }
    }
    return show;
  }

  /**
   * 解析节点上绑定的for指令
   * 如果节点绑定了for指令，这个节点将不会继续被解析
   * @param node
   * @param contextData
   */
  private _parseBindFor(node: HTMLElement, contextData: ContextData): boolean {
    const forBuilder = new BindingForBuilder(node, contextData);
    if (forBuilder.hasForAttr) {
      if (forBuilder.isNumberData) {
        let _data = +(forBuilder.bindData as string);
        _data = usePipes(_data, forBuilder.pipes, contextData);

        for (let v = 0; v < _data; v++) {
          const item = forBuilder.createItem();
          const forLet = contextData.forLet + "_";
          this._scan(
            item as HTMLElement,
            contextData.copyWith({
              contextState: forBuilder.createForContextState(v),
              tvState: contextData.tData.copyWith(node),
              forLet: forLet
            })
          );
        }
        forBuilder.draw(_data);
      } else {
        const _that = this;
        autorun(() => {
          let _data = getData(forBuilder.bindData as string, contextData);
          _data = usePipes(_data, forBuilder.pipes, contextData);
          forBuilder.clear();
          for (const k in _data) {
            const item = forBuilder.createItem();
            _that._scan(
              item as HTMLElement,
              contextData.copyWith({
                contextState: forBuilder.createForContextState(
                  k,
                  _data[k],
                  false
                ),
                tvState: contextData.tData.copyWith(node),
                forLet: contextData.forLet + "_"
              })
            );
          }
          forBuilder.draw(_data);
        });
      }
    }
    return !forBuilder.hasForAttr;
  }
  /**
   * * 递归解析子节点
   * @param childNodes
   * @param contextData
   */
  private _bindingChildNodesAttrs(
    childNodes: ChildNode[],
    contextData: ContextData
  ): any {
    if (!childNodes.length) return;
    let node: ChildNode = childNodes[0];
    if (elementNodep(node)) {
      this._scan(node as HTMLElement, contextData);
    }
    if (textNodep(node)) {
      new BindingTextBuilder(node, contextData);
    }
    return this._bindingChildNodesAttrs(childNodes.slice(1), contextData);
  }
}

export default Aja;
