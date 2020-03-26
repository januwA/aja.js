`v0.0.14` 此版本已经不能直接在浏览器上跑了，需要[aja-cli](https://github.com/januwA/aja-cli)，下面的文档待更新。

## 模块
```ts
@AjaModule({
  declarations: [AppRoottt],
  imports: [SharedModule],
  bootstrap: [AppRoottt]
})
export class AppModule {}
```

## 组件
```ts
import { Widget, Input } from "@aja";

@Widget({
  selector: "app-root",
  template: require("./app.html")
})
export class AppRoottt {
  @Input()
  name: any = { name: "ajanuw" };

  show() {
    this.name = "xxx";
  }
}
```

## 管道
```ts
@Pipe({
  name: "hello"
})
class HelloPipe implements PipeTransform {
  transform(value: any) {
    return `hello ${value}`;
  }
}
```
```html
<h1>{{ name | json }}</h1>
```

## 组件输入和输出

使用`$event`来获取emit出来的值

```ts
import { Widget, Input, Output, EventEmitter } from "@aja";

@Widget({
  selector: "app-root",
  template: require("./app.html")
})
export class AppRoottt {
  @Input()
  name: string = "<default name>";

  @Output() emit = new EventEmitter<string>();
}
```
```html
<app-root [name]="name" (emit)="emit($event, 'other arg')"></app-root>
```

## 组件属性双向绑定
```ts
import { Widget, Input, Output, EventEmitter } from "@aja";

@Widget({
  selector: "app-root",
  template: require("./app.html")
})
export class AppRoottt {
  @Input() name = "";
  @Output() nameChange = new EventEmitter<string>();
}
```
```html
<app-root [(name)]="name"></app-root>
```

## 属性绑定
```ts
import { Widget } from "@aja";

@Widget({
  selector: "app-root",
  template: require("./app.html")
})
export class AppRoottt {
  name = "Ajanuw";
}
```
```html
<h1>{{ name }}</h1>
```

## constructor依赖注入

创建一个服务`FinderService`
```ts
// finder.service.ts

import { Injectable } from "@aja";

@Injectable()
export class FinderService {
  name = "Ajanuw";

  setName(name: string) {
    this.name = name;
  }
}
```

在`app-tile`中使用
```ts
// app-tile.ts

import { Widget } from "@aja";
import { FinderService } from "../../finder.service";

@Widget({
  selector: "app-tile",
  template: require("./app-tile.html")
})
export class AppTile {
  constructor(public readonly finder: FinderService) {}
}
```
```html
<input
  #el_name
  type="text"
  [value]="finder.name"
  (input)="finder.setName(el_name.value)"
  [title]="finder.name"
/>
```

同时在`app-root`中使用
```ts
import { Widget } from "@aja";
import { FinderService } from "./finder.service";

@Widget({
  selector: "app-root",
  template: require("./app.html")
})
export class AppRoot {
  constructor(public readonly finder: FinderService) {}
}
```
```html
<p>{{ finder.name }}</p>
<button (click)="finder.setName('suou')">setName</button>

<hr />
<app-tile></app-tile>
```

## 绑定class
```html
<!-- [text-red] -->
<p class="a" [class]="'text-red'">x</p>

<!-- [a text-red p-2] -->
<p class="a" [class.text-red]="true" [class.p-2]="true">x</p>

<!-- a text-red p-2 -->
<p class="a" [class]="classes">x</p>
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
```ts
import { Widget } from "@aja";

@Widget({
  selector: "app-root",
  template: require("./app.html")
})
export class AppRoot {
  name = "Ajanuw";
  nameChange(v: string) {
    console.log(v);
  }
}
```
```html
<input [(model)]="name" (modelChange)="nameChange($event)" />
<p>{{ name }}</p>
```

## pipe
```html
<p>{{ name | uppercase }}</p>
<p>{{ name | lowercase }}</p>
<p>{{ name | slice:1:3 }}</p>
<hr />
<ul>
  <li :for="of 4">{{ name | slice:0:$_+1 }}</li>
</ul>
```

## ajaModel [创建出色的表单](https://developers.google.cn/web/fundamentals/design-and-ux/input/forms/)

| 状态             | 为真时的 CSS 类 | 为假时的 CSS 类 |
| ---------------- | --------------- | --------------- |
| 控件被访问过。   | aja-touched     | aja-untouched   |
| 控件的值变化了。 | aja-dirty       | aja-pristine    |
| 控件的值有效。   | aja-valid       | aja-invalid     |

```ts
import { Widget } from "@aja";

@Widget({
  selector: "app-root",
  template: require("./app.html")
})
export class AppRoot {
  name = "Ajanuw";
  submit(m: any) {
    console.log(m);
  }
}
```
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

<input type="text" [(model)]="name" #name_model="ajaModel" required />
<div [hidden]="name_model.valid || name_model.pristine">Name is required</div>
<button (click)="submit(name_model)" [disabled]="name_model.invalid">
  submit
</button>
```

## [formControl]属性
> FormControl 实例用于追踪单个表单控件的值和验证状态。
- 可以看看angular的[文档](https://angular.cn/guide/forms-overview)
- [更多属性和方法可以看这里](https://github.com/januwA/aja.js/blob/master/src/classes/forms.ts)

```ts
import { Widget, FormControl, ValidationErrors, AbstractControl } from "@aja";

function includeHttp(control: AbstractControl) {
  return /^http/.test(control.value)
    ? null
    : {
        validatorFn: "必须包含 http"
      };
}

function requered(control: AbstractControl) {
  return !!control.value
    ? null
    : {
        validatorFn: "必填字段"
      };
}

function asyncValidatorFn(
  control: AbstractControl
): Promise<ValidationErrors | null> {
  return new Promise(res => {
    setTimeout(() => {
      if (control.value.length > 10) {
        res(null);
      } else {
        res({
          asyncValidatorFn: "length须>10"
        });
      }
    }, 1500);
  });
}

@Widget({
  selector: "app-root",
  template: require("./app.html")
})
export class AppRoot {
  name = new FormControl("", [requered, includeHttp], asyncValidatorFn);

  change() {
    this.name.setValue("http://www.example.com");
  }

  submit() {
    console.log(this.name.value);
  }
}
```
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

<input type="text" [formControl]="name" />
<p [hidden]="!name.pending">等待验证...</p>
<p :if="name.touched && name.errors">{{ name.errors | json }}</p>
<button (click)="change()">change</button>
<button (click)="submit()" [disabled]="name.pending || name.invalid">
  submit 
</button>
```

## FormGroup
```ts
import { Widget, FormControl, FormGroup, AbstractControl } from "@aja";

function requeredValue(control: AbstractControl) {
  return control.value
    ? null
    : {
        requered: "不能为空"
      };
}

@Widget({
  selector: "app-root",
  template: require("./app.html")
})
export class AppRoot {
  profileForm = new FormGroup({
    firstName: new FormControl("a", requeredValue),
    lastName: new FormControl("b", requeredValue)
  });

  test() {
    console.log(this.profileForm.errors);
  }
}
```
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

<form [formGroup]="profileForm">
  <div>
    <label>
      First Name:
      <input type="text" [formControlName]="firstName" />
    </label>
  </div>
  <div>
    <label>
      Last Name:
      <input type="text" [formControlName]="lastName" />
    </label>
  </div>
  <p>{{ profileForm.errors }}</p>
  <input type="submit" [disabled]="profileForm.invalid" value="submit" />
</form>
<button (click)="test()">test</button>
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
- 响应式表单系列存在BUG