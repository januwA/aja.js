`v0.0.14` 此版本已经不能直接在浏览器上跑了，需要[aja-cli](https://github.com/januwA/aja-cli)，下面的文档待更新。

## 基本
```html
<body>
  <app-home></app-home>

  <template id="app">
    <p>{{ name | uppercase }}</p>
    <p>{{ helloName }}</p>
    <app-tile [title]="'hello world'" (alert)="test"></app-tile>
    <button (click)="test()" #btn>test</button>
  </template>

  <template id="tile">
    <h3>title: {{ title }}</h3>
    <p>subtitle: {{subtitle | hello }}</p>
    <button (click)="send()">emit</button>
  </template>

  <script src="../dist/dist/aja.umd.js"></script>
  <script>
    const l = console.log;
    const { AjaWidget, AjaModule, AjaPipe } = Aja;

    class HelloPipe extends AjaPipe {
      pipeName = 'hello';
      transform(v) {
        return `hello ${v}`;
      }
    }

    class AppTile extends AjaWidget {

      inputs = ['title'];

      state = {
        subtitle: '模板'
      }

      actions = {
        send() {
          l(this.subtitle)
          this.alert(this.title);
        }
      }

      constructor() {
        super();
      }

      render() {
        return document.querySelector('#tile')
      }
    }

    class AppHome extends AjaWidget {
      state = {
        name: 'x',
        get helloName() {
          return `hello ${this.name}`
        }
      }

      actions = {
        test(title) {
          l(title)
          this.name = 'c'
        },
      }

      render() {
        return document.querySelector('#app');
      }
    }
    
    class SharedModule extends AjaModule {
      declarations = [HelloPipe];
      exports = [HelloPipe];
    }
    
    class AppModule extends AjaModule {
      declarations = [
        AppHome,
        AppTile
      ];
      imports = [
        SharedModule
      ];
      bootstrap = AppHome;
    }

    Aja.bootstrapModule(AppModule);
  </script>
</body>
```

## 返回字符串
```html
<app-home></app-home>

<script>
  const l = console.log;
  const { AjaWidget, AjaModule } = Aja;
  class AppHome extends AjaWidget {

    // 模板中绑定的变量
    state = {
      name: 'x',
      get helloName() {
        return `hello ${this.name}`
      }
    }

    // 模板中绑定的事件
    actions = {

      // 这些函数的[this]指向[this.$store]
      test() {
        this.name = 'c'
      },
    }

    initHostStyle() {
      this.host.style.display = 'block';
      this.host.classList.add('p-2', 'color');
    }

    // 没什么用，应为什么都没有开始
    constructor() {
      super();
    }

    // 这个函数的[this]指向[AjaWidget]
    initState() {
      this.initHostStyle();
      setTimeout(() => {
        this.$store.name = 'ajanuw'
      }, 2000);
    }

    render() {
      return `
        hello {{  name }}
        <p>{{ name | uppercase }}</p>
        <p>{{ helloName }}</p>
        <button (click)="test()" #btn>test</button>
      `;
    }
  }

  class AppModule extends AjaModule {
    declarations = [
      AppHome,
    ];
    bootstrap = AppHome;
  }

  Aja.bootstrapModule(AppModule);
</script>
```


## 属性绑定
```html
  <app-home></app-home>
  <script src="../dist/dist/aja.umd.js"></script>
  <script>
    const { AjaWidget, AjaModule } = Aja;

    class AppHome extends AjaWidget {
      state = {
        title: 'title...',
        style: {
          padding: '1em',
          color: 'red'
        }
      }
      render() {
        return `
          <p [title]="title" class="c" [style]="style">{{ title }}</p>
          <p [html]="'name'"></p>
        `;
      }
    }

    class AppModule extends AjaModule {
      declarations = [AppHome];
      bootstrap = [AppHome];
    }

    Aja.bootstrapModule(AppModule);
  </script>
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



## 输入 `@Input()`
```html
<app-tile [name]="name"></app-tile>
```
```ts
import { AjaWidget, Input } from "@aja";

export class AppTile extends AjaWidget {
  @Input() name = "<default name>";
}

export class AppTile extends AjaWidget {
  private _name = "xxx";

  @Input()
  set name(nv: string) {
    this._name = "Hello " + nv;
  }

  get name() {
    return this._name;
  }
}
```

## 插值表达式
<html>
  <p style="color: red;">!!!复杂的表达式还是推荐使用计算属性，速度快点</p>
</html>

```
<p>{{ name }}, {{ obj.age * 10 }}</p>

{{ v ? 1 : 2 }}
```

## 模板引用变量
> 权限最高，就近原则
```html
<input type="text" value="hello ajanuw" #input />
<p>value: {{ input.value }} {{input.type}}</p>

<div :if="show">
  <p>{{ pass.value }}</p>
  <input type="text" value="pass" #pass />
</div>
<!-- 错误，不要使用结构型指令内部的变量，因为上下文不一样 -->
<p>{{ pass.value }}</p>
```

## :for
```html
<ul>
    <li :for="item in 10">{{ item }}</li>
    
    <li :for="item in array">{{ item }}</li>
    <li :for="(index, item) in array">{{ index }} {{ item }}</li>
    
    <li :for="(key, value) in object">{{ key }} {{ value }}</li>
    <p :for="value in object">{{ value }}</p>
</ul>


```

## for自带的上下文
```html
<app-home></app-home>
<script src="../dist/dist/aja.umd.js"></script>
<script>
  const l = console.log;
  const { AjaWidget, AjaModule } = Aja;

  class AppHome extends AjaWidget {
    state = {
      arr: [
        {
          key: 1,
          list: ['x', 'y', 'z']
        },
        {
          key: 2,
          list: ['q', 'w', 'e']
        },
        {
          key: 3,
          list: ['a', 'b', 'c']
        },
      ],
    }

    render() {
      return `
        <div :for="of 3">
          <p># {{ $_ }}</p>
          <ul>
            <li :for="of 2">## {{ $__ }}</li>
          </ul>
        </div>

        <div :for="of arr">
          <p>{{ $_.key }}</p>
          <ul>
            <li :for="of $_.list">{{ $__}}</li>
          </ul>
        </div>
      `;
    }
  }

  class AppModule extends AjaModule {
    declarations = [AppHome];
    bootstrap = [AppHome];
  }

  Aja.bootstrapModule(AppModule);
</script>
```

## if&else
```html
<!-- if -->
<p :if="show">hello world</p>

<!-- if else 这个优先于:else -->
<p :if="show; else other">hello</p>
<h1 #other>hello world</h1>

<!-- or -->
<p :if="!show">hello</p>
<h1 :else>hello world</h1>
```

## if和for的使用
> 不要把:if和:for同时绑定在一个节点上
```html
<div :if="show">
  <p :for="el in 10">hello</p>
</div>
```

## switch
```html
<div [switch]="true">
  <h1>233</h1>
  <p :case="name === 'a' || name === 'b'">hello {{name}}</p>
  <p :case="name === 'ajanuw'">bey bey {{name}}</p>
  <p :default>not name!</p>
</div>


<div [switch]="name">
  <h1>233</h1>
  <p :case="'ajanuw'">hello {{name}}</p>
  <p :case="'ajanuw'">bey bey {{name}}</p>
  <p :case="'c'">i'm {{name}}...</p>
  <p :default>not name!</p>
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
  new Aja(document.querySelector(".app"), {
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

## pipe
```html
<div class=".app">
  <p [title]="name | slice:0:3 | hello">hello</p>
  <p>{{ name | uppercase }}</p>
  <p>{{ name | lowercase }}</p>
  <p>{{ name | capitalize | hello }}</p>
  <p>{{ name | slice:1:3 }}</p>
  <hr>
  <ul>
    <li :for="el in 4">{{ name | slice:0:el }}</li>
  </ul>
</div>
```

## ajaModel [创建出色的表单](https://developers.google.cn/web/fundamentals/design-and-ux/input/forms/)

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
  .aja-valid {
    border-color: #33ff00;
  }
</style>

<app-home></app-home>
<script src="../dist/dist/aja.umd.js"></script>
<script>
  const l = console.log;
  const { AjaWidget, AjaModule } = Aja;

  class AppHome extends AjaWidget {
    state = {
      name: "",
    }

    actions = {
      submit(m) {
        l(m)
      }
    }

    render() {
      // 属性在获取时会被设置为小写，如果要使用，就用下划线分割
      return `
        <input type="text" [(model)]="name" #name_model="ajaModel" required />
        <div [hidden]="name_model.valid || name_model.pristine">Name is required</div>
        <button (click)="submit(name_model)" [disabled]="name_model.invalid">click me</button>
      `;
    }
  }

  class AppModule extends AjaModule {
    declarations = [AppHome];
    bootstrap = [AppHome];
  }

  Aja.bootstrapModule(AppModule);
</script>
```

## [formControl]属性
> FormControl 实例用于追踪单个表单控件的值和验证状态。
- 可以看看angular的[文档](https://angular.cn/guide/forms-overview)
- [更多属性和方法可以看这里](https://github.com/januwA/aja.js/blob/master/src/classes/forms.ts)

```html
<style>
  [hidden] {
    display: none;
  }
  .aja-touched.aja-invalid {
    border-color: red;
  }
  .aja-valid {
    border-color: #33ff00;
  }
</style>

<app-home></app-home>
<script src="../dist/dist/aja.umd.js"></script>
<script>
  const l = console.log;
  const { AjaWidget, AjaModule, FormControl } = Aja;

  function validatorFn(control) {
    return control.value.includes("Ajanuw")
      ? null
      : {
        validatorFn: "必须包含 Ajanuw"
      };
  }

  function validatorFn2(control) {
    return control.value.includes("hello")
      ? null
      : {
        validatorFn2: "必须包含 hello"
      };
  }

  function asyncValidatorFn(control) {
    return new Promise(res => {
      setTimeout(() => {
        if (control.value.length > 20) {
          res(null);
        } else {
          res({
            asyncValidatorFn: "length须>20"
          });
        }
      }, 1500);
    });
  }

  class AppHome extends AjaWidget {
    state = {
      name: new FormControl(
        "",
        [validatorFn, validatorFn2],
        asyncValidatorFn
      ),
    }

    actions = {
      asd(m) {
        this.name.setValue("hello Ajanuw");
      }
    }

    render() {
      return `
      <input required type="text" [formControl]="name" />
      <p [hidden]="!name.pending">等待验证...</p>
      <p :if="name.touched && name.errors">{{ name.errors | json }}</p>
      <br />
      <button (click)="asd()">change</button>
      `;
    }
  }

  class AppModule extends AjaModule {
    declarations = [AppHome];
    bootstrap = [AppHome];
  }

  Aja.bootstrapModule(AppModule);
</script>
```

## FormGroup
```html
<style>
  [hidden] {
    display: none;
  }

  .aja-touched.aja-invalid {
    border-color: red;
  }

  .aja-valid {
    border-color: #33ff00;
  }
</style>

<app-home></app-home>
<script src="../dist/dist/aja.umd.js"></script>
<script>
  const l = console.log;
  const { AjaWidget, AjaModule } = Aja;

  function requeredValue(control) {
    return control.value
      ? null
      : {
        requered: "不能为空"
      };
  }

  class AppHome extends AjaWidget {
    state = {
      profileForm: new Aja.FormGroup({
        firstName: new Aja.FormControl('a'),
        lastName: new Aja.FormControl('b'),
      }, [requeredValue]),
    }

    actions = {
      test() {
        l(this.profileForm)
      }
    }

    render() {
      return `
      <form [formGroup]="profileForm">
        <label>
          First Name:
          <input type="text" [formControlName]="firstName">
        </label>

        <label>
          Last Name:
          <input type="text" [formControlName]="lastName">
        </label>
        <p>{{ profileForm.invalid }}</p>
        <input type="submit" [disabled]="profileForm.invalid" value="submit" />
        </form>
        <button (click)="test()">test</button>
      `;
    }
  }

  class AppModule extends AjaModule {
    declarations = [AppHome];
    bootstrap = [AppHome];
  }

  Aja.bootstrapModule(AppModule);
</script>
```

## fb
```html
<style>
  [hidden] {
    display: none;
  }

  .aja-touched.aja-invalid {
    border-color: red;
  }

  .aja-valid {
    border-color: #33ff00;
  }
</style>

<app-home></app-home>
<script src="../dist/dist/aja.umd.js"></script>
<script>
  const l = console.log;
  const { AjaWidget, AjaModule, fb } = Aja;

  function requeredValue(control) {
    return control.value
      ? null
      : {
        requered: "不能为空"
      };
  }

  class AppHome extends AjaWidget {
    state = {
      profileForm: fb.group({
        firstName: ['asdasd'],
        lastName: [''],
        address: fb.group({
          street: [''],
          city: ['x'],
          state: fb.control('h'),
          zip: 's'
        }),
      })
    }

    actions = {
      asd() {
        l(this.profileForm)
      }
    }

    render() {
      return `
      <form [formGroup]="profileForm">
        <label>
          First Name:
          <input required type="text" [formControlName]="firstName">
        </label>

        <label>
          Last Name:
          <input type="text" [formControlName]="lastName">
        </label>

        <div [formGroupName]="address">
          <h3>Address</h3>

          <label>
            Street:
            <input type="text" [formControlName]="street">
          </label>

          <label>
            City:
            <input type="text" [formControlName]="city">
          </label>

          <label>
            State:
            <input type="text" [formControlName]="state">
          </label>

          <label>
            Zip Code:
            <input type="text" [formControlName]="zip">
          </label>
        </div>

        <input type="submit" [disabled]="profileForm.invalid" value="submit" />
        </form>
        <button (click)="asd()">change</button>
      `;
    }
  }

  class AppModule extends AjaModule {
    declarations = [AppHome];
    bootstrap = [AppHome];
  }

  Aja.bootstrapModule(AppModule);
</script>
```


## TODO
- 延迟解析[(model)]
- 响应式表单系列存在BUG