import { Actions } from "../aja";
import { Pipes } from "../pipes";

const l = console.log;
export abstract class AjaWidget {

    abstract inputs: string[] = [];
    abstract state?: any = {};
    abstract actions?: Actions = {};
    abstract pipes?: Pipes;

    abstract render: () => HTMLTemplateElement | undefined;
    abstract initState?: Function;

    constructor() { }

    get widget() {
        const t = this.render();
        if (!t) {
            throw `没有找到模板!!! ${this}`;
        }
        return document.importNode(t.content, true)
    }
}

export class AjaWidgets {
    private static _widgets: {
        [k: string]: AjaWidget;
    } = {}

    static register(name: string, widget: AjaWidget): void {
        let newName = name.charAt(0).toLowerCase() + name.substr(1);
        newName = newName.replace(/([A-Z])/g, '-$1');
        this._widgets[newName.toLowerCase()] = widget;
    }

    static get(name: string): AjaWidget | undefined {
        return this._widgets[name.toLowerCase()];
    }

    static has(name: string): boolean {
        return !!this.get(name);
    }
}