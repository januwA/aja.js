import { GetDataCallBack } from "../aja";
export interface Pipe {
    (...value: any[]): any;
}
export interface Pipes {
    [pipeName: string]: Pipe;
}
export declare const pipes: Pipes;
export declare function usePipes(data: any, pipeList: string[], getData: GetDataCallBack | null): any;
