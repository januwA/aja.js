export interface Pipe {
    (...value: any[]): any;
}
export interface Pipes {
    [pipeName: string]: Pipe;
}
