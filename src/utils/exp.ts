export const interpolationExpressionExp = /{{(.*?)}}/g;
export const attrStartExp = /^\[/;
export const attrEndExp = /\]$/;
export const eventStartExp = /^\(/;
export const eventEndExp = /\)$/;
export const tempvarExp = /^#/;
export const parsePipesExp = /(?<![\|])\|(?![\|])/;