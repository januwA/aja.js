"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ContextData {
    constructor(options) {
        /**
         * * for结构指令，默认的上下文变量
         * :for="of arr" -> :for="$_ of arr"
         * for -> $_
         *   for -> $__
         *     ...
         */
        this.forLet = "$_";
        this.store = options.store;
        if (options.contextState)
            this.contextState = options.contextState;
        this.tData = options.tData;
        if (options.forLet)
            this.forLet = options.forLet;
        if (options.formGroup)
            this.formGroup = options.formGroup;
    }
    copyWith(options) {
        return new ContextData({
            store: options.globalState || this.store,
            contextState: options.contextState || this.contextState,
            tData: options.tvState || this.tData,
            forLet: options.forLet || this.forLet,
            formGroup: options.formGroup || this.formGroup
        });
    }
}
exports.ContextData = ContextData;
//# sourceMappingURL=context-data.js.map