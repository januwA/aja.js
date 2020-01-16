import { Type } from "../aja";
import { ANNOTATIONS } from "../metadata/directives";
import { arrayp } from "../utils/p";

/**
 * 在构建的时，解析元数据
 */
export class MetaData {
  public readonly metadata: any;
  public isWidget() {
    return this.metadata["metadataName"] === "Widget";
  }
  
  public isPiper() {
    return this.metadata["metadataName"] === "Piper";
  }

  constructor(cls: Type<any>) {
    const meta = (<any>cls)[ANNOTATIONS];
    if (meta && arrayp(meta) && meta.length) {
      this.metadata = meta[0];
    }
  }
}
