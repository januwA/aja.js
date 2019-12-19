//* 匹配 {{ name }} {{ obj.age }}
// export const interpolationExpressionExp = /{{([\w\s\.][\s\w\.]+)}}/g;
export const interpolationExpressionExp = /{{(.*?)}}/g;

//* 匹配空格
export const spaceExp = /\s/g;

export const attrStartExp = /^\[/;
export const attrEndExp = /\]$/;

export const eventStartExp = /^\(/;
export const eventEndExp = /\)$/;

export const tempvarExp = /^#/;

export const parsePipesExp = /(?<![\|])\|(?![\|])/;

export const evalExp = /[!\&\|\+\-\*\%=\/<\>\^\(\)\~\:\?\;]/g;
