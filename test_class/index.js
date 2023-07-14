
class TestClass {
  async start(a, b) {
    this.a = a;
    this.b = b;
    console.log(this.a);
    console.log(this.b);
    console.log('test1 started');
    return this
  }
}

class TestClass2 {
  constructor({a, b}) {
    this.a = a;
    this.b = b;
  }
  async start(a, b) {
    console.log(this.a);
    console.log(this.b);    
    this.a = a;
    this.b = b;
    console.log(this.a);
    console.log(this.b);
    console.log('teest2 started');
  }
}

module.exports = {
  TestClass,
  TestClass2
}