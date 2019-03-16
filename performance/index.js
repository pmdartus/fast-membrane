process.env.NODE_ENV = 'production';

const ObservableMembrane = require('observable-membrane');
const FastMembrane = require('../dist/fast-observable-membrane');

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

function buildData(count) {
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

function buildSimpleProxyData(count) {
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

const observableMembrane = new ObservableMembrane();
const fastMembrane = new FastMembrane();

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

let before, after, data, proxy;


// ================================================================================================
data = [];
for (let i = 0; i < 100; i++) {
    data[i] = buildData(10000);
}

before = Date.now();
for (let i = 0; i < 100; i++) {
    run(data[i]);
}
after = Date.now();
console.log(`Standard Javascript object (different): ${after - before}`);


before = Date.now();
for (let i = 0; i < 100; i++) {
    run(data[0]);
}
after = Date.now();
console.log(`Standard Javascript object (same): ${after - before}`);

// ================================================================================================
data = [];
for (let i = 0; i < 100; i++) {
    data[i] = buildSimpleProxyData(10000);
}

before = Date.now();
for (let i = 0; i < 100; i++) {
    run(data[i]);
}
after = Date.now();
console.log(`Simple proxy (different): ${after - before}`);

before = Date.now();
for (let i = 0; i < 100; i++) {
    run(data[0]);
}
after = Date.now();
console.log(`Simple proxy (same): ${after - before}`);

// ================================================================================================
data = [];
for (let i = 0; i < 100; i++) {
    data[i] = buildData(10000);
}

before = Date.now();
for (let i = 0; i < 100; i++) {
    proxy = fastMembrane.getProxy(data[i]);
    run(proxy);
}
after = Date.now();
console.log(`Fast membrane (different): ${after - before}`);


before = Date.now();
for (let i = 0; i < 100; i++) {
    proxy = fastMembrane.getProxy(data[0]);
    run(proxy);
}
after = Date.now();
console.log(`Fast membrane (same): ${after - before}`);

// ================================================================================================
data = [];
for (let i = 0; i < 100; i++) {
    data[i] = buildData(10000);
}

before = Date.now();
for (let i = 0; i < 100; i++) {
    proxy = observableMembrane.getProxy(data[i]);
    run(proxy);
}
after = Date.now();
console.log(`Observable membrane (different): ${after - before}`);


before = Date.now();
for (let i = 0; i < 100; i++) {
    proxy = observableMembrane.getProxy(data[0]);
    run(proxy);
}
after = Date.now();
console.log(`Observable membrane (same): ${after - before}`);
