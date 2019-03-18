# Fast-membrane

Case study to optimize [observable-membrane](https://github.com/salesforce/observable-membrane) performance.

```sh
$ node performance/index.js
== Object get ==
Object get - Plain object x 373 ops/sec ±5.28% (20 runs sampled)
Object get - Simple proxy x 135 ops/sec ±0.76% (51 runs sampled)
Object get - Fast membrane x 106 ops/sec ±2.04% (49 runs sampled)
Object get - Observable membrane x 31.37 ops/sec ±6.12% (42 runs sampled)

== Object set ==
Object set - Plain object x 1,484 ops/sec ±1.21% (88 runs sampled)
Object set - Simple proxy x 169 ops/sec ±1.19% (80 runs sampled)
Object set - Fast membrane x 79.58 ops/sec ±7.64% (54 runs sampled)
Object set - Observable membrane x 26.78 ops/sec ±10.60% (46 runs sampled)
```

## Contributing

```sh
yarn test           # Run test suite
yarn build          # Build and bundle the library
yarn performance    # Run performance benchmark
```