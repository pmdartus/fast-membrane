# Fast-membrane

Case study to optimize [observable-membrane](https://github.com/salesforce/observable-membrane) performance.

## Getting started

```js
import Membrane from 'fast-membrane';

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
```

## Performance Results

This repository contains 2 different implementations of the Membrane one using `Symbol`s and another one using `WeakMap`s to keep track of the mapping between the Object and Reactive Proxy.

```sh
$ node performance/index.js
== Object get ==
Object get - Plain object x 458 ops/sec ±5.67% (18 runs sampled)
Object get - Simple proxy x 121 ops/sec ±3.47% (46 runs sampled)
Object get - Fast membrane (Symbol) x 146 ops/sec ±2.80% (48 runs sampled)
Object get - Fast membrane (WeakMap) x 75.41 ops/sec ±11.85% (36 runs sampled)
Object get - Observable membrane x 31.11 ops/sec ±8.60% (40 runs sampled)

== Object set ==
Object set - Plain object x 1,764 ops/sec ±0.54% (89 runs sampled)
Object set - Simple proxy x 159 ops/sec ±1.16% (77 runs sampled)
Object set - Fast membrane (Symbol) x 129 ops/sec ±0.51% (78 runs sampled)
Object set - Fast membrane (Weakmap) x 65.19 ops/sec ±8.11% (55 runs sampled)
Object set - Observable membrane x 28.13 ops/sec ±9.16% (46 runs sampled)
```

## Implementation Notes

* Assignment on Proxy are really expensive (10x slower than on standard objects)
* Usage of `Reflect.*` APIs is way slower than direct object manipulation.
* Usage of `WeakMap` and `WeakSet` has poor performance at runtime. Lookup is 5 to 10x slower than direct property access on the object, and also make GC pauses way longer. Because of this, all the `WeakMap`s replaced with `Symbol`s assigned to the objects.
* Dereferencing the standard object properties doesn't provide any runtime benefits once the function is optimized (eg. `const { getPrototypeOf, getOwnPropertyDescriptor } = Object`).
* `Object.getOwnPropertyDescriptor` is way 2x slower than direct property accessed.

## Contributing

```sh
yarn test           # Run test suite
yarn build          # Build and bundle the library
yarn performance    # Run performance benchmark
```