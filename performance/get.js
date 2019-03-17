const Benchmark = require('benchmark');

const ObservableMembrane = require('observable-membrane/dist/umd/observable-membrane.min.js');
const FastMembrane = require('../dist/umd/fast-membrane.min.js');

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
global.fastMembrane = new FastMembrane();

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

const suite = new Benchmark.Suite();
suite
    .add('Objects', function() {
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
    .add('Fast membrane', function() {
        proxy = fastMembrane.getProxy(data.pop());
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
    })
    .on('cycle', function(event) {
        console.log(String(event.target));
    })
    .on('error', function (error) {
        console.error(error);
    })
    .run({ async: true });