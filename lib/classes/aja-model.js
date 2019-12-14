"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const store_1 = require("../store");
class AjaModel {
    constructor(node) {
        this.node = node;
        this.control = {
            touched: this.node.classList.contains(AjaModel.classes.touched),
            untouched: this.node.classList.contains(AjaModel.classes.untouched),
            dirty: this.node.classList.contains(AjaModel.classes.dirty),
            pristine: this.node.classList.contains(AjaModel.classes.pristine),
            valid: this.node.classList.contains(AjaModel.classes.valid),
            invalid: this.node.classList.contains(AjaModel.classes.invalid)
        };
        this.control = store_1.Store.map(this.control);
        this._setup();
    }
    get model() {
        return this.node.value;
    }
    get name() {
        return this.node.name;
    }
    get value() {
        return this.node.value;
    }
    get disabled() {
        return this.node.disabled;
    }
    get enabled() {
        return !this.disabled;
    }
    get dirty() {
        return this.control.dirty;
    }
    get pristine() {
        return this.control.pristine;
    }
    get valid() {
        return this.control.valid;
    }
    get invalid() {
        return this.control.invalid;
    }
    get touched() {
        return this.control.touched;
    }
    get untouched() {
        return this.control.untouched;
    }
    _setup() {
        // 值发生变化了
        this.node.addEventListener("input", () => {
            this.control.pristine = false;
            this.control.dirty = true;
            if (this.node.required && this.node.value) {
                // 控件的值有效
                this.control.valid = true;
                this.control.invalid = false;
            }
            else {
                // 控件的值无效
                this.control.valid = false;
                this.control.invalid = true;
            }
        });
        // 控件被访问了
        this.node.addEventListener("blur", () => {
            this.control.untouched = false;
            this.control.touched = true;
        });
    }
}
exports.AjaModel = AjaModel;
AjaModel.classes = {
    // 控件被访问过
    touched: "aja-touched",
    untouched: "aja-untouched",
    // 控件的值变化了
    dirty: "aja-dirty",
    pristine: "aja-pristine",
    // 控件的值有效
    valid: "aja-valid",
    invalid: "aja-invalid" // false
};
//# sourceMappingURL=aja-model.js.map