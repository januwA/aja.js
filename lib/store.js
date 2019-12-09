"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const l = console.log;
exports.autorun = (f) => {
    f();
    Store.autorunListeners.push(f);
};
class Store {
    constructor({ state, computeds, actions }) {
        for (const k in state) {
            Object.defineProperty(this, k, {
                get() {
                    let value = state[k];
                    if (typeof state[k] === "object") {
                        value = new Store({
                            state: value,
                            computeds: {}
                        });
                    }
                    return value;
                },
                set(newValue) {
                    state[k] = newValue;
                    for (const f of Store.autorunListeners) {
                        f();
                    }
                },
                enumerable: true,
                configurable: true
            });
        }
        for (const k in computeds) {
            Object.defineProperty(this, k, {
                get() {
                    return computeds[k].call(this);
                },
                enumerable: true
            });
        }
        if (actions) {
            this.$actions = actions;
            // 在actions中调用this.m()
            Object.assign(this, actions);
        }
    }
}
exports.Store = Store;
/**
 * * 任意一个属性的变化，都会触发所有的监听事件
 */
Store.autorunListeners = [];
//# sourceMappingURL=store.js.map