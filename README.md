# Fast-membrane

Case study to optimize [observable-membrane](https://github.com/salesforce/observable-membrane) performance.

```sh
$ node --expose-gc performance/index.js
Objects x 812 ops/sec ±1.56% (20 runs sampled)
Simple proxy x 132 ops/sec ±0.90% (50 runs sampled)
Fast membrane x 88.98 ops/sec ±2.54% (47 runs sampled)
Observable membrane x 29.14 ops/sec ±9.93% (42 runs sampled)
```