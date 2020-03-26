import { Type } from "../interfaces/type";
import { ANNOTATIONS, METADATANAME } from "./decorators";
import { arrayp } from "./p";

/**
 * 解析类的注入
 */
export class ParseAnnotations {
  public readonly annotations: any;
  public get isWidget() {
    return this.annotations[METADATANAME] === "Widget";
  }

  public get isAjaModule() {
    return this.annotations[METADATANAME] === "AjaModule";
  }

  constructor(cls: Type<any>) {
    const annotations = (<any>cls)[ANNOTATIONS];
    if (annotations && arrayp(annotations) && annotations.length) {
      this.annotations = annotations[0];
    }
  }
}
