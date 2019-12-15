...造轮子

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

## 绑定class
```html
<!-- [text-red] -->
<p class="a" [class]="'text-red'">x</p>

<!-- [a text-red p-2] -->
<p class="a" [class.text-red]="true" [class.p-2]="true">x</p>

<!-- a text-red p-2 -->
<p class="a" [class]="classes">x</p>
state: {
  classes: {
    'text-red': true,
    'p-2': true,
    'm-2': false,
  }
}
```

## 绑定style
```html
<p style="font-family: Consolas;" [style.color]="'red'" [style.font-size]="size">x</p>
<p style="font-family: Consolas;" [style]="styles">x</p> </div>
state: {
  size: "5rem",
  styles: {
    color: "red",
    padding: "1rem",
    backgroundColor: "#e5e5ef75",
    display: "inline-block"
  }
}
```

## 事件绑定
```html
<button (click)="setTitle()">设置 title</button>
<button (click)="setName($event)">设置 name</button>
```

## 插值表达式
```
<p>{{ name }}, {{ obj.age * 10 }}</p>

{{ v ? 1 : 2 }}
```

## 模板引用变量
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

## if和for的使用
> 不要把:if和:for同时绑定在一个节点上
```html
<div :if="show">
  <p :for="el in 10">hello</p>
</div>
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

## 展开双向绑定
```html
<div class="app">
  <input [(model)]="name" (modelChange)="nameChange($event)" />
  {{ name }}
</div>

<script>
  new Aja(".app", {
    state: {
      name: "ajanuw"
    },
    actions: {
      nameChange(v) {
        this.name = v.toUpperCase();
      },
    }
  });
</script>
```

## 钩子: initState
> [this]被指向了[vm.$store]

- 不要在[initState]设置新state，应为不会被代理

```html
<!DOCTYPE html>
<html lang="en">
  <body>
    <div class="app">
      <p>{{ age }}</p>
      <button (click)="change">change</button>
    </div>
    <script>
      const l = console.log;
      let vm = new Aja(".app", {
        state: {
          age: null
        },
        initState() {
          this.age = 2;
        },
        actions: {
          change() {
            this.age++;
          }
        }
      });
      // console.log(vm);
    </script>
  </body>
</html>
```

## pipe
```html
<p [title]="name | slice:0:3 | hello">hello</p>
<p>{{ name | uppercase }}</p>
<p>{{ name | lowercase }}</p>
<p>{{ name | capitalize | hello }}</p>
<p>{{ name | slice:1:3 }}</p>
<hr>
<ul>
  <li :for="el in 4">{{ name | slice:0:el }}</li>
</ul>

<script>
let vm = new Aja(".app", {
  pipes: {
    hello(s) {
      return "hello " + s;
    },
    slice(v, start, end) {
      return v.slice(start, end);
    }
  },
  state: {
    name: "ajanuw",
  },
});
</script>
```

## ajaModel
> 待优化

| 状态             | 为真时的 CSS 类 | 为假时的 CSS 类 |
| ---------------- | --------------- | --------------- |
| 控件被访问过。   | aja-touched     | aja-untouched   |
| 控件的值变化了。 | aja-dirty       | aja-pristine    |
| 控件的值有效。   | aja-valid       | aja-invalid     |

```html
<style>
  [hidden] {
    display: none;
  }
  .aja-invalid {
    border-color: red;
  }
</style>

<input required type="text" [(model)]="name" #nameModel="ajaModel" />
<div [hidden]="nameModel.valid || nameModel.pristine">Name is required</div>
<button (click)="asd(nameModel)">change</button>
<script>
  const l = console.log;
  let vm = new Aja(".app", {
    state: {
      name: ""
    },
    actions: {
      asd(m) {
        l(m)
      }
    }
  });
</script>
```


## TODO
- 响应式表单
- 模板变量，先使用后申明出错
- 绑定了model的节点延迟解析
- h5自带的表单验证