const Membrane = require('../dist/umd/symbol/fast-membrane');

const membrane = new Membrane({
    valueObserved(target, property) {
        console.log(`observed | ${property}`);
    },
    valueMutated(target, property) {
        console.log(`mutated | ${property}`);
    }
});

const obj = membrane.getProxy({
    x: 1,
    y: {
        z: 2
    }
});

obj.x; // observed | x
obj.x = 1; // mutated | x

const y = obj.y; // observed | y
y.z; // observed | z
y.z = 3; // mutated | z