# Fast-membrane

Case study to optimize [observable-membrane](https://github.com/salesforce/observable-membrane) performance.

```sh
$ node performance/index.js
== Object get ==
Object get - Plain object x 375 ops/sec ±12.05% (19 runs sampled)
Object get - Simple proxy x 126 ops/sec ±1.14% (48 runs sampled)
Object get - Fast membrane x 129 ops/sec ±2.83% (43 runs sampled)
Object get - Observable membrane x 29.19 ops/sec ±6.57% (41 runs sampled)

== Object set ==
Object set - Plain object x 1,742 ops/sec ±3.66% (86 runs sampled)
Object set - Simple proxy x 163 ops/sec ±0.73% (80 runs sampled)
Object set - Fast membrane x 126 ops/sec ±1.64% (77 runs sampled)
Object set - Observable membrane x 29.15 ops/sec ±4.84% (48 runs sampled)
```

## Implementation Notes

* Assignment on Proxy are really expensive (10x slower than on standard objects)
* Usage of `Reflect.*` APIs is way slower than direct object manipulation.
* Usage of `WeakMap` and `WeakSet` has poor performance at runtime. Lookup is 5 to 10x slower than direct property access on the object, and also make GC pauses way longer. Because of this, all the `WeakMap`s replaced with `Symbol`s assigned to the objects.
* Dereferencing the standard object properties doesn't provide any runtime benefits once the function is optimized (eg. `const { getPrototypeOf, getOwnPropertyDescriptor } = Object`).
* `Object.getOwnPropertyDescriptor` is way 2x slower than direct property accessed.
* Frozen objects should not be considered observable, since they can't be changed by nature.

## Contributing

```sh
yarn test           # Run test suite
yarn build          # Build and bundle the library
yarn performance    # Run performance benchmark
```