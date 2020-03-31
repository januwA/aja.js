import { DependenceManager } from "./dependence-manager";

export function autorun(observer: Function) {
  // 在get前, 收集依赖
  DependenceManager.beginCollect(observer);
  observer();
  DependenceManager.endCollect();
}
