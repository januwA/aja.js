import { observable } from "./";
import { autorun } from "./autorun";

class Ajanuw {
  name = "ajanuw";
  change() {
    this.name = "suot";
  }

  get hello() {
    return "hello " + this.name;
  }

  set hello(v) {
    this.name = v;
  }
}

const obj = observable.cls(Ajanuw);

autorun(() => {
  console.log(obj.hello);
  console.log(obj.hello);
});

setTimeout(() => {
  obj.change();
}, 1000);
