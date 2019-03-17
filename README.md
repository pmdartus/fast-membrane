# Fast-membrane

Case study to optimize [observable-membrane](https://github.com/salesforce/observable-membrane) performance.

```sh
$ node performance/get.js
Objects x 809 ops/sec ±1.06% (20 runs sampled)
Simple proxy x 131 ops/sec ±1.34% (50 runs sampled)
Fast membrane x 105 ops/sec ±2.58% (47 runs sampled)
Observable membrane x 32.22 ops/sec ±2.96% (44 runs sampled)

$ node performance/set.js
Objects x 1,861 ops/sec ±0.66% (88 runs sampled)
Simple proxy x 175 ops/sec ±0.43% (77 runs sampled)
Fast membrane x 87.90 ops/sec ±5.60% (59 runs sampled)
Observable membrane x 25.60 ops/sec ±13.80% (44 runs sampled)
```