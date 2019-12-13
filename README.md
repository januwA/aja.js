...

## 基本
```html
<!DOCTYPE html>
<html lang="en">
  <body>
    <div class="app">
      <p>{{ text }}</p>
      <button (click)="change($event)">change</button>
    </div>
    <script src="../dist/aja.js"></script>
    <script>
      const l = console.log;
      let vm = new Aja(".app", {
        state: {
          text: "hello..."
        },
        actions: {
          change(e) {
            l(e);
            this.text = "x";
          }
        }
      });
      l(vm);
    </script>
  </body>
</html>
```

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
    <li :for="item in 10">{{ item }}</li>
    
    <li :for="item in array">{{ item }}</li>
    <li :for="(index, item) in array">{{ index }} {{ item }}</li>
    
    <li :for="(key, value) in object">{{ key }} {{ value }}</li>
    <p :for="value in object">{{ value }}</p>
</ul
```

## :if
```html
<p :if="show">hello world</p>
```

## 双向绑定
```html
// input
<input [(model)]="message" placeholder="edit me" />
<p>Message is: {{ message }}</p>

// textarea
<span>Multiline message is:</span>
<p style="white-space: pre-line;">{{ message }}</p>
<br />
<textarea [(model)]="message" placeholder="add multiple lines"></textarea>

// 单个复选框，绑定到布尔值
<input type="checkbox" id="checkbox" [(model)]="checked" />
<label for="checkbox">{{ checked }}</label>

// 多个复选框，绑定到同一个数组
<input type="checkbox" id="jack" value="Jack" [(model)]="checkedNames" />
<label for="jack">Jack</label>
<input type="checkbox" id="john" value="John" [(model)]="checkedNames" />
<label for="john">John</label>
<input type="checkbox" id="mike" value="Mike" [(model)]="checkedNames" />
<label for="mike">Mike</label>
<br />
<span>Checked names: {{ checkedNames }}</span>

// 单选按钮
<input type="radio" id="one" value="One" [(model)]="picked" />
<label for="one">One</label>
<br />
<input type="radio" id="two" value="Two" [(model)]="picked" />
<label for="two">Two</label>
<br />
<span>Picked: {{ picked }}</span>

// 选择框，单选
<select [(model)]="selected">
<option disabled value="">请选择</option>
<option>A</option>
<option>B</option>
<option>C</option>
</select>
<span>Selected: {{ selected }}</span>

// 选择框，多选
<select [(model)]="selected" multiple style="width: 50px;">
<option>A</option>
<option>B</option>
<option>C</option>
</select>
<br />
<span>Selected: {{ selected }}</span>

// for渲染
<select [(model)]="selected">
    <option :for="option in options" [value]="option.value">
        {{ option.text }}
    </option>
</select>
<span>Selected: {{ selected }}</span>
```


## TODO
- 响应式表单