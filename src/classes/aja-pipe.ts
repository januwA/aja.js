import { numberStringp } from "../utils/p";
import { ContextData } from "../classes/context-data";
import { getData } from "../core";


// 开始管道加工
export function usePipes(
    target: any,
    pipeList: string[],
    contextData: ContextData
): any {
    let _result = target;
    if (pipeList.length) {
        pipeList.forEach(pipe => {
            const [p, ...pipeArgs] = pipe.split(":");
            const ajaPipe = AjaPipes.get(p);
            if (ajaPipe) {
                const parsePipeArgs = pipeArgs.map(arg =>
                    numberStringp(arg) ? arg : getData(arg, contextData)
                );
                try {
                    _result = ajaPipe.transform(_result, ...parsePipeArgs);
                } catch (er) {
                    console.error(er);
                }
            } else {
                console.error(`没有找到管道[${p}], 请注册!!!`);
            }
        });
    }
    return _result;
}

export abstract class AjaPipe {
    abstract pipeName: string;
    abstract transform(...value: any[]): any;
}

/**
* 全部大写
* @param value
*/
class UppercasePipe extends AjaPipe {
    pipeName = 'uppercase';

    transform(value: string) {
        return value.toUpperCase();
    }
}

/**
* 全部小写
* @param value
*/
class LowercasePipe extends AjaPipe {
    pipeName = 'lowercase';

    transform(value: string) {
        return value.toLowerCase();
    }
}

/**
 * 首字母小写
 * @param str
 */
class CapitalizePipe extends AjaPipe {
    pipeName = 'capitalize';

    transform(value: string) {
        return value.charAt(0).toUpperCase() + value.substring(1);
    }
}

class JsonPipe extends AjaPipe {
    pipeName = 'json';

    transform(value: string) {
        return JSON.stringify(value, null, " ");
    }
}

class SlicePipe extends AjaPipe {
    pipeName = 'slice';

    transform(value: string, start: number, end: number) {
        return value.slice(start, end);
    }
}



export class AjaPipes {
    private static _pipes: AjaPipe[] = [new UppercasePipe, new LowercasePipe, new CapitalizePipe, new JsonPipe, new SlicePipe];

    static get(name: string) {
        return this._pipes.find(pipe => pipe.pipeName === name);
    }

    static has(name: string) {
        return !!this.get(name);
    }

    static add(pipe: AjaPipe) {
        this._pipes.push(pipe);

    }
}