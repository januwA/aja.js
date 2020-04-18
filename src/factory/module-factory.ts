import { Type } from "../interfaces/type";
import { ANNOTATIONS } from "../utils/decorators";
import { ModuleProxy } from "../classes/module-proxy";
import { ParseAnnotations } from "../utils/parse-annotations";
import { Widget } from "../metadata/directives";
import { putIfAbsent, getAnnotations } from "../utils/util";

/**
 * 解析导入的所有模块,
 * @param importModule modules
 */
export function parseImports(importModule: ModuleProxy) {
  importModule.imports
    ?.map(({ name }) => new ModuleFactory(name).value)
    .forEach((exportModule) => {
      exportModule.exports
        ?.map((e) => new ParseAnnotations(e))
        .forEach((parseAnnotations) => {
          if (parseAnnotations.annotations) {
            if (parseAnnotations.isWidget) {
              const widgetMetaData = parseAnnotations.annotations as Widget;
              if (exportModule.hasWidget(widgetMetaData.selector)) {
                importModule.addWidget(widgetMetaData.selector);
              }
            }
          }
        });
    });
}

/**
 * 解析模块的所有声明
 * @param m
 */
export function parseDeclarations(m: ModuleProxy) {
  m.declarations?.forEach((el) => {
    const parseAnnotations = new ParseAnnotations(el);
    if (parseAnnotations.annotations) {
      if (parseAnnotations.isWidget)
        m.addWidget((<Widget>parseAnnotations.annotations).selector);
    }
  });
}

/**
 * 存储使用[@Widget]注册的小部件
 */
export class ModuleFactory {
  private _value!: Type<any>;
  private _valueCache?: ModuleProxy;

  public get value(): ModuleProxy {
    // 返回缓存
    if (this._valueCache) return this._valueCache;

    // 第一次构建

    // 1. 获取元数据
    const { paramtypes, ...decoratorFactory } = getAnnotations(this._value);

    // TODO: 解析construct依赖注入参数[paramtypes]
    new this._value(...paramtypes);

    // 2. 代理
    const ajaModuleProvider: ModuleProxy = new ModuleProxy(decoratorFactory);

    // 3. 解析申明
    if (
      ajaModuleProvider.declarations &&
      ajaModuleProvider.declarations.length
    ) {
      parseDeclarations(ajaModuleProvider);
    }

    // 4. 解析导入
    if (ajaModuleProvider.imports && ajaModuleProvider.imports.length) {
      parseImports(ajaModuleProvider);
    }

    return (this._valueCache = ajaModuleProvider);
  }

  private static _cache = new Map<String, ModuleFactory>();

  constructor(name: string, module?: Type<any>) {
    return putIfAbsent(ModuleFactory._cache, name, () =>
      this._constructor(module as Type<any>)
    );
  }

  private _constructor(value: Type<any>) {
    this._value = value;
    return this;
  }
}
