...


## 属性绑定
```html
<p [title]="title" class="c" [style]="style"></p>
<p [innerhtml]="'name'"></p>
```

## 事件绑定
```html
<button (click)="setTitle()">设置 title</button>
<button (click)="setName($event)">设置 name</button>
```

## 插值表达式
```
<p>我叫{{ name }}, 今年{{ obj.age * 10 }}岁</p>

{{ v ? 1 : 2 }}
```

## 模板变量
> 权限最高，就近原则
```html
<input type="text" value="hello ajanuw" #input />
<p>value: {{ input.value }} {{input.type}}</p>
```

## :for
```html
<ul>
    <li :for="item in 10">item {{ item }}</li>
    
    <li :for="item in array">item {{ item }}</li>
    <li :for="(index, item) in array">item {{ item }}</li>
    
    <li :for="(key, value) in object">item {{ item }}</li>
     <p :for="value in object">{{ value }}</p>
</ul
```

## :if
```html
<p :if="show">hello world</p>
```

## 双向绑定
```html
<input type="text" [(model)]="form.username" />
<p>{{ form.username }}</p>
```


## TODO
- 响应式表单