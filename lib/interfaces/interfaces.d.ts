import { Pipes } from "../pipes/interfaces/interfaces";
export interface OptionsInterface {
    state?: any;
    actions?: any;
    initState?: Function;
    pipes?: Pipes;
}
