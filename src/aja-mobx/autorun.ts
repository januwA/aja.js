import { DependenceManager } from "./dependence-manager";

export function autorun(handler: Function) {
  //在get前, 收集依赖
  DependenceManager.beginCollect(handler);
  handler();
  DependenceManager.endCollect();
}
