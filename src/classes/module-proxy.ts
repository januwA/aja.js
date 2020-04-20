import { AjaModule } from "../metadata/directives";
import { Type } from "../interfaces";

export class ModuleProxy {
  imports?: Type<any>[];
  declarations?: Type<any>[];
  exports?: Type<any>[];
  bootstrap?: Type<any>[];

  constructor(decoratorFactory: AjaModule) {
    this.imports = decoratorFactory.imports;
    this.declarations = decoratorFactory.declarations;
    this.exports = decoratorFactory.exports;
    this.bootstrap = decoratorFactory.bootstrap;
  }

  private _widgets = new Map<string, boolean>();

  addWidget(selector: string): void {
    this._widgets.set(selector.toLowerCase(), true);
  }

  /**
   *
   * @param selector app-home or APP-HOME
   */
  hasWidget(selector: string): boolean {
    return this._widgets.has(selector.toLowerCase());
  }
}
