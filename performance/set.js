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

global.SimpleProxyHandler = {
    set(target, prop, value) {
        return target[prop] = value;
    },
};

global.observableMembrane = new ObservableMembrane();
global.symbolMembrane = new SymbolMembrane();
global.weakmapMembrane = new WeakMapMembrane();

module.exports = new Suite('Object set')
    .add(
        'Plain object',
        function() {
            const data = new Array(10000);

            for (let i = 0; i < 10000; i++) {
                data[i] = {};
                const item = data[i];
                
                item.id = i;
                item.label = A[random(A.length)];
                item.className = C[random(C.length)];
            }
        },
    )
    .add(
        'Simple proxy',
        function() {
            const data = new Proxy(new Array(10000), SimpleProxyHandler);

            for (let i = 0; i < 10000; i++) {
                data[i] = new Proxy({}, SimpleProxyHandler);
                const item = data[i];

                item.id = i;
                item.label = A[random(A.length)];
                item.className = C[random(C.length)];
            }
        })
    .add(
        'Fast membrane (Symbol)',
        function() {
            const data = symbolMembrane.getProxy([]);
            
            for (let i = 0; i < 10000; i++) {
                data[i] = {};
                const item = data[i];
                
                item.id = i;
                item.label = A[random(A.length)];
                item.className = C[random(C.length)];
            }
        },
    )
    .add(
        'Fast membrane (Weakmap)',
        function() {
            const data = weakmapMembrane.getProxy([]);
            
            for (let i = 0; i < 10000; i++) {
                data[i] = {};
                const item = data[i];
                
                item.id = i;
                item.label = A[random(A.length)];
                item.className = C[random(C.length)];
            }
        },
    )
    .add(
        'Observable membrane',
        function() {
            const data = observableMembrane.getProxy([]);
            
            for (let i = 0; i < 10000; i++) {
                data[i] = {};
                const item = data[i];
                
                item.id = i;
                item.label = A[random(A.length)];
                item.className = C[random(C.length)];
            }
        },
    );
