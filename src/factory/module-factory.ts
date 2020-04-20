import { Type } from "../interfaces";
import { ModuleProxy } from "../classes/module-proxy";
import { ParseAnnotations } from "../utils/parse-annotations";
import { Widget } from "../metadata/directives";
import { putIfAbsent, getAnnotations, parseParamtypes } from "../utils/util";
import { METADATANAME } from "../utils/decorators";

/**
 * 解析导入的所有模块,
 * @param importModule modules
 */
export function parseImports(importModule: ModuleProxy) {
  importModule.imports
    ?.map(({ name }) => new ModuleFactory(name).value)
    .forEach((exportModule) => {
      exportModule.exports
        ?.map((e) => getAnnotations(e))
        .forEach((annotations) => {
          // 如果模块要导出一个widget，那么必须在declarations中申明
          if (annotations[METADATANAME] === "Widget") {
            if (exportModule.hasWidget(annotations.selector)) {
              importModule.addWidget(annotations.selector);
            } else {
              throw `模块中不存在[${annotations.selector}]widget, 请在declarations中申明此widget`;
            }
          }
        });
    });
}

/**
 * 解析模块的所有声明
 * 现在对于模块只提供了widget的分离，service，pipe，注册后都是全局的
 * @param m
 */
export function parseDeclarations(m: ModuleProxy) {
  m.declarations?.forEach((el) => {
    const a = getAnnotations(el);
    if (a[METADATANAME] === "Widget") m.addWidget(a.selector);
  });
}

export class ModuleFactory {
  private static _cache = new Map<String, ModuleFactory>();

  private _module!: Type<any>;
  private _moduleCache?: ModuleProxy;

  public get value(): ModuleProxy {
    // 有缓存就返回缓存
    if (this._moduleCache) return this._moduleCache;

    // 1. 获取元数据
    const { paramtypes, ...opt } = getAnnotations(this._module);
    new this._module(...parseParamtypes(paramtypes));

    // 2. 构建代理
    const proxy = new ModuleProxy(opt);

    // 3. 解析申明
    if (proxy.declarations && proxy.declarations.length) {
      parseDeclarations(proxy);
    }

    // 4. 解析导入
    if (proxy.imports && proxy.imports.length) {
      parseImports(proxy);
    }

    return (this._moduleCache = proxy);
  }

  constructor(name: string, module?: Type<any>) {
    return putIfAbsent(ModuleFactory._cache, name, () =>
      this._constructor(module as Type<any>)
    );
  }

  private _constructor(value: Type<any>) {
    this._module = value;
    return this;
  }
}
