"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const l = console.log;
const listeners = [];
exports.autorun = (f) => {
    f();
    listeners.push(f);
};
function createStore({ state, computeds, actions }) {
    let _result = {};
    for (let k in state) {
        // 将所有state，重新代理
        Object.defineProperty(_result, k, {
            get: function proxyGetter() {
                let value;
                if (typeof state[k] === "object") {
                    value = createStore({
                        state: state[k]
                    });
                }
                else {
                    value = state[k];
                }
                return value;
            },
            set: function proxySetter(value) {
                state[k] = value;
                // 设置的时候调用回调
                for (const f of listeners) {
                    f();
                }
            },
            enumerable: true,
            configurable: true
        });
    }
    for (let k in computeds) {
        Object.defineProperty(_result, k, {
            get: function proxyGetter() {
                return computeds[k].call(this);
            }
        });
    }
    Object.assign(_result, actions);
    return _result;
}
exports.createStore = createStore;
//# sourceMappingURL=store.js.map