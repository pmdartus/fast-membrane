import SymbolMembrane from '../src/symbol/main'
import WeakMapMembrane from '../src/weakmap/main';

function run(data) {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
        const entry = data[i];
        sum += entry.id;
        sum += entry.label;
        sum += entry.className;
    }
    return sum;
}

const SimpleProxyHandler = {
    get(target, prop, receiver) {
        return Reflect.get(target, prop, receiver);
    },
};

const COUNT = 1000;

const symbolMembrane = new SymbolMembrane();
const weakmapMembrane = new WeakMapMembrane();

const data = [];
const simpleProxyData = new Proxy([], SimpleProxyHandler);

for (let i = 0; i < COUNT; i++) {
    const entry = [];
    const simpleProxyEntry = [];

    for (let i = 0; i < 1000; i++) {
        const item = {
            id: i,
            label: `label${i}`,
            className: `className${i}`,
        };

        entry.push(item);
        simpleProxyEntry.push(new Proxy(item, SimpleProxyHandler));
    }

    data.push(entry);
    simpleProxyData.push(simpleProxyData);
}

const TESTS = [
    function testPlainObject() {
      for (let i = 0; i < COUNT; ++i) {
        run(data[i]);
      }
    },
    function testSimpleProxy() {
      for (let i = 0; i < COUNT; i++) {
        run(simpleProxyData[i]);
      }
    },
    function testSymbolMembrane() {
      for (let i = 0; i < COUNT; i++) {
        const p = symbolMembrane.getProxy(data[i]);
        run(p);
      }
    },
    function testWeakmapMembrane() {
      for (let i = 0; i < COUNT; i++) {
        const p = weakmapMembrane.getProxy(data[i]);
        run(p);
      }
    }
];

// Warmup.
for (let i = 0; i < 3; ++i) {
  console.log(`Warm up run ${i+1}/3...`);
  TESTS.forEach(fn => fn());
}

// Measure
console.log('Running tests...');
TESTS.forEach(fn => {
  console.time(fn.name);
  fn();
  console.timeEnd(fn.name);
});