import { Pipes } from "../../lib/pipes/pipes";

export interface GetDataCallBack {
  (key: string): any;
}
export interface SetDataCallBack {
  (newData: any): void;
}

export interface Options {
  state?: any;
  actions?: any;
  initState?: Function;
  pipes?: Pipes;
}

