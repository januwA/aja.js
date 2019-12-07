...


## 属性绑定
```html
<p [title]="title" class="c" [style]="style"></p>
```

## 事件绑定
```html
<button (click)="setTitle()">设置 title</button>
<button (click)="setName($event)">设置 name</button>
```

## 插值表达式
```
<p>我叫{{ name }}, 今年{{ obj.age }}岁</p>
```

## 模板变量
```html
<input type="text" value="hello ajanuw" #input />
<p>value: {{ input.value }} {{input.type}}</p>
```

## TODO :for
```html
<ul>
    <li :for="item in 10">item {{ item }}</li>
    <li :for="(item, index) in array">item {{ item }}</li>
    <li :for="(key, value) in object">item {{ item }}</li>
</ul
```

## :if
```html
<p :if="show">hello world</p>
```