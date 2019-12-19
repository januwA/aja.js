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
        this.globalState = options.globalState;
        if (options.contextState)
            this.contextState = options.contextState;
        this.tvState = options.tvState;
        if (options.forLet)
            this.forLet = options.forLet;
    }
    copyWith(options) {
        return new ContextData({
            globalState: options.globalState || this.globalState,
            contextState: options.contextState || this.contextState,
            tvState: options.tvState || this.tvState,
            forLet: options.forLet || this.forLet
        });
    }
}
exports.ContextData = ContextData;
//# sourceMappingURL=context-data.js.map