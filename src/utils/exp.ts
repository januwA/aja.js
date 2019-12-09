//* 匹配 {{ name }} {{ obj.age }}
export const interpolationExpressionExp = /{{([\w\s\.][\s\w\.]+)}}/g;

//* 匹配空格
export const spaceExp = /\s/g;

//* !!hide
export const firstWithExclamationMarkExp = /^!*/;

export const attrStartExp = /^\[/;
export const attrEndExp = /^\[/;

export const eventStartExp = /^\(/;
export const eventEndExp = /\)$/;

export const tempvarExp = /^#/;

export const firstAllValue = /^./;
export const endAllValue = /.$/;
