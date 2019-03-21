const { Suite } = require('benchmark');

const ObservableMembrane = require('observable-membrane/dist/umd/observable-membrane.min.js');
const SymbolMembrane = require('../dist/umd/symbol/fast-membrane.min.js');
const WeakMapMembrane = require('../dist/umd/weakmap/fast-membrane.min.js');

function random(max) {
    return Math.round(Math.random() * 1000) % max;
}

const A = [
    'pretty',
    'large',
    'big',
    'small',
    'tall',
    'short',
    'long',
    'handsome',
    'plain',
    'quaint',
    'clean',
    'elegant',
    'easy',
    'angry',
    'crazy',
    'helpful',
    'mushy',
    'odd',
    'unsightly',
    'adorable',
    'important',
    'inexpensive',
    'cheap',
    'expensive',
    'fancy',
];
const C = [
    'red',
    'yellow',
    'blue',
    'green',
    'pink',
    'brown',
    'purple',
    'brown',
    'white',
    'black',
    'orange',
];
const N = [
    'table',
    'chair',
    'house',
    'bbq',
    'desk',
    'car',
    'pony',
    'cookie',
    'sandwich',
    'burger',
    'pizza',
    'mouse',
    'keyboard',
];

let nextId = 1;

global.buildData = function buildData(count) {
    const data = new Array(count);
    for (let i = 0; i < count; i++) {
        data[i] = {
            id: nextId++,
            label: `${A[random(A.length)]} ${C[random(C.length)]} ${
                N[random(N.length)]
            }`,
            className: `${A[random(A.length)]} ${C[random(C.length)]} ${
                N[random(N.length)]
            }`,
        };
    }
    return data;
}

const SimpleProxyHandler = {
    get(target, prop, receiver) {
        return Reflect.get(target, prop, receiver);
    },
};

global.buildSimpleProxyData = function buildSimpleProxyData(count) {
    const data = new Array(count);

    for (let i = 0; i < count; i++) {
        data[i] = new Proxy(
            {
                id: nextId++,
                label: `${A[random(A.length)]} ${C[random(C.length)]} ${
                    N[random(N.length)]
                }`,
                className: `${A[random(A.length)]} ${C[random(C.length)]} ${
                    N[random(N.length)]
                }`,
            },
            SimpleProxyHandler,
        );
    }

    return new Proxy(data, SimpleProxyHandler);
}

global.observableMembrane = new ObservableMembrane();
global.symbolMembrane = new SymbolMembrane();
global.weakmapMembrane = new WeakMapMembrane();

global.run = function run(data) {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
        const entry = data[i];
        sum += entry.id;
        sum += entry.label;
        sum += entry.className;
    }
    return sum;
}

module.exports = new Suite('Object get')
    .add('Plain object', function() {
        run(data.pop());
    }, {
        setup() {
            let data = [];
            for (let i = 0; i < this.count; i++) {
                data[i] = buildData(10000);
            }
        }
    })
    .add('Simple proxy', function() {
        run(data.pop());
    }, {
        setup() {
            let data = [];
            for (let i = 0; i < this.count; i++) {
                data[i] = buildSimpleProxyData(10000);
            }
        }
    })
    .add('Fast membrane (Symbol)', function() {
        proxy = symbolMembrane.getProxy(data.pop());
        run(proxy); 
    }, {
        setup() {
            let data = [];
            for (let i = 0; i < this.count; i++) {
                data[i] = buildData(10000);
            }
        }
    })
    .add('Fast membrane (WeakMap)', function() {
        proxy = weakmapMembrane.getProxy(data.pop());
        run(proxy); 
    }, {
        setup() {
            let data = [];
            for (let i = 0; i < this.count; i++) {
                data[i] = buildData(10000);
            }
        }
    })
    .add('Observable membrane', function() {
        proxy = observableMembrane.getProxy(data.pop());
        run(proxy); 
    }, {
        setup() {
            let data = [];
            for (let i = 0; i < this.count; i++) {
                data[i] = buildData(10000);
            }
        }
    });