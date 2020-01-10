export interface AnyObject {
  [k: string]: any;
}

export interface Type<T> extends Function {
  new(...args: any[]): T;
}