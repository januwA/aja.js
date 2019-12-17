"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const p_1 = require("../utils/p");
const util_1 = require("../utils/util");
const l = console.log;
const reactionListeners = [];
function reactionUpdate(some) {
    for (const reactionItem of reactionListeners) {
        const stateList = reactionItem.listenerStateList();
        // equal 深比较
        l(some, stateList[0]);
        if (stateList.some(e => util_1.equal(e, some))) {
            reactionItem.cb(stateList);
        }
    }
}
/**
 * * 监听指定属性的变更
 * @param listenerStateList
 * @param cb
 *
 * ## Example
 *
 * ```ts
 * let store = new Store({
 *    state: {
 *      name: 22,
 *      age: 22
 *    }
 *  });
 *
 *  reaction(
 *    () => [store.name],
 *    state => {
 *      l(state); // ["ajanuw"]
 *    }
 *  );
 *
 *  store.age = 12;
 *  store.name = "ajanuw";
 * ```
 */
function reaction(listenerStateList, cb) {
    cb(listenerStateList());
    reactionListeners.push({
        listenerStateList,
        cb
    });
}
exports.reaction = reaction;
const autorunListeners = [];
function autorunUpdate() {
    for (const f of autorunListeners) {
        f();
    }
}
/**
 * * 任意一个属性的变化，都会触发所有的监听事件
 * @param f
 *
 * ## Example
 *
 * ```ts
 * let store = new Store({
 *    state: {
 *      name: 22,
 *      age: 22
 *    }
 *  });
 *
 *  autorun(() => {
 *      l('state change'); // x 3
 *    }
 *  );
 *
 *  store.age = 12;
 *  store.name = "ajanuw";
 * ```
 */
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
    static map(object, context = {}) {
        for (const k in object) {
            Object.defineProperty(context, k, {
                get() {
                    let v = object[k];
                    if (p_1.arrayp(v)) {
                        v = Store.list(v);
                    }
                    if (p_1.objectp(v)) {
                        v = Store.map(v);
                    }
                    return v;
                },
                set(newValue) {
                    // 设置了同样的值， 将跳过
                    if (util_1.equal(newValue, object[k]))
                        return;
                    object[k] = newValue;
                    autorunUpdate();
                    reactionUpdate(object[k]);
                },
                enumerable: true,
                configurable: true
            });
        }
        return context;
    }
    /**
     * * 拦截数组的非幕等方, 并循环代理每个元素
     * @param list
     */
    static list(list) {
        const resriteMethods = [
            "push",
            "pop",
            "shift",
            "unshift",
            "splice",
            "sort",
            "reverse"
        ];
        const proto = Object.create(Array.prototype);
        resriteMethods.forEach(m => {
            const original = proto[m];
            Object.defineProperty(proto, m, {
                value: function (...args) {
                    const r = original.apply(list, args);
                    // 跟新
                    autorunUpdate();
                    reactionUpdate(list);
                    return r;
                },
                writable: true,
                configurable: true,
                enumerable: false // 可被枚举 for(let i in o)
            });
        });
        // 遍历代理数组每项的值
        const newList = list.map(el => {
            if (p_1.objectp(el)) {
                return Store.map(el);
            }
            if (p_1.arrayp(el)) {
                return Store.list(el);
            }
            return el;
        });
        Object.setPrototypeOf(newList, proto);
        return newList;
    }
}
exports.Store = Store;
//# sourceMappingURL=store.js.map