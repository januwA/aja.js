"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("./utils/util");
const l = console.log;
/**
 * * 任意一个属性的变化，都会触发所有的监听事件
 */
const autorunListeners = [];
function updateAll() {
    for (const f of autorunListeners) {
        f();
    }
}
exports.autorun = (f) => {
    f();
    autorunListeners.push(f);
};
class Store {
    constructor({ state, computeds, actions, context }) {
        const _that = context ? context : this;
        // _that.$state = state;
        for (const k in state) {
            let v = state[k];
            if (util_1.arrayp(v)) {
                // 如果是Array，那么拦截一些原型函数
                var aryMethods = [
                    "push",
                    "pop",
                    "shift",
                    "unshift",
                    "splice",
                    "sort",
                    "reverse"
                ];
                var arrayAugmentations = Object.create(Array.prototype);
                aryMethods.forEach(method => {
                    let original = Array.prototype[method];
                    arrayAugmentations[method] = function (...args) {
                        // 将传递进来的值，重新代理
                        const _applyArgs = new Store({
                            state: args,
                            context: []
                        });
                        // 调用原始方法
                        const r = original.apply(this, _applyArgs);
                        // 跟新
                        updateAll();
                        return r;
                    };
                });
                v = v.map(el => {
                    return new Store({
                        state: el,
                        context: {}
                    });
                });
                Object.setPrototypeOf(v, arrayAugmentations);
            }
            if (Store._isObject(v)) {
                if (util_1.objectp(v)) {
                    const newContext = Object.create(v);
                    v = new Store({
                        state: v,
                        context: newContext
                    });
                }
            }
            state[k] = v;
            Object.defineProperty(_that, k, {
                get() {
                    const _r = state[k];
                    return _r;
                },
                set(newValue) {
                    state[k] = newValue;
                    updateAll();
                },
                enumerable: true,
                configurable: true
            });
        }
        if (computeds) {
            for (const k in computeds) {
                Object.defineProperty(_that, k, {
                    get() {
                        return computeds[k].call(_that);
                    },
                    enumerable: true
                });
            }
        }
        // 只把actions绑定在store上
        if (actions) {
            this.$actions = actions;
            // 在actions中调用this.m()
            Object.assign(this, actions);
        }
        if (context)
            return context;
    }
    /**
     * 跳过null和空的对象
     * @param val
     */
    static _isObject(val) {
        return typeof val === "object" && val !== null;
    }
    toString() {
        return JSON.stringify(this.$state);
    }
}
exports.Store = Store;
function observifyArray(array) {
    var aryMethods = [
        "push",
        "pop",
        "shift",
        "unshift",
        "splice",
        "sort",
        "reverse"
    ];
    var arrayAugmentations = Object.create(Array.prototype);
    aryMethods.forEach(method => {
        let original = Array.prototype[method];
        arrayAugmentations[method] = function (...args) {
            const r = original.apply(this, array);
            l(args[0], array);
            return r;
        };
    });
    Object.setPrototypeOf(array, arrayAugmentations);
}
//# sourceMappingURL=store.js.map