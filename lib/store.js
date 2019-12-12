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
    /**
     *
     * @param state 需要代理的数据
     */
    constructor({ state, computeds, actions }) {
        Store.map(state, this);
        if (computeds) {
            for (const k in computeds) {
                Object.defineProperty(this, k, {
                    get() {
                        return computeds[k].call(this);
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
    }
    /**
     * * 代理每个属性的 get， set
     */
    static map(object, context) {
        for (const k in object) {
            let v = object[k];
            if (util_1.arrayp(v)) {
                v = Store.list(v);
            }
            if (util_1.objectp(v)) {
                v = Store.map(v, {});
            }
            object[k] = v;
            Object.defineProperty(context, k, {
                get() {
                    const _r = object[k];
                    return _r;
                },
                set(newValue) {
                    object[k] = newValue;
                    updateAll();
                },
                enumerable: true,
                configurable: true
            });
        }
        return context;
    }
    /**
     * * 拦截数组的非幕等方, 并循环代理每个元素
     * @param array
     */
    static list(array) {
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
                const _applyArgs = Store.list(args);
                // 调用原始方法
                const r = original.apply(this, _applyArgs);
                // 跟新
                updateAll();
                return r;
            };
        });
        // 遍历代理数组每项的值
        array = array.map(el => {
            if (util_1.objectp(el)) {
                return Store.map(el, {});
            }
            if (util_1.arrayp(el)) {
                return Store.list(el);
            }
            return el;
        });
        Object.setPrototypeOf(array, arrayAugmentations);
        return array;
    }
}
exports.Store = Store;
//# sourceMappingURL=store.js.map