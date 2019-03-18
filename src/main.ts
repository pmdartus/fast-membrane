import ReactiveProxy from './reactive-proxy';
import { isObservable } from './observability';
import {
    OBJECT_TO_REACTIVE_PROXY,
    REACTIVE_PROXY_TO_OBJECT,
} from './known-symbols';

import { MembraneOptions, MembraneCallback } from './types';

export default class Membrane {
    private reactiveProxy: ReactiveProxy;
    private getProxyfiedValue: (target: object) => object;

    constructor(options?: MembraneOptions) {
        let valueMutated: null | MembraneCallback = null;
        let valueObserved: null | MembraneCallback = null;

        if (options !== undefined) {
            if (options.valueMutated !== undefined) {
                valueMutated = options.valueMutated;
            }

            if (options.valueObserved !== undefined) {
                valueObserved = options.valueObserved;
            }
        }

        const getProxyfiedValue = (this.getProxyfiedValue = (object: any) => {
            // There is no need to wrap the object if it is not observable.
            if (!isObservable(object)) {
                return object;
            }

            // Extract the ReactiveProxy out of the passed object
            let proxyfiedValue = object[OBJECT_TO_REACTIVE_PROXY];

            // Let's create a new Reactive Proxy is the object doesn't one associated with.
            if (proxyfiedValue === undefined) {
                proxyfiedValue = new Proxy(object, this.reactiveProxy);
                object[OBJECT_TO_REACTIVE_PROXY] = proxyfiedValue;
            }

            return proxyfiedValue;
        });

        this.reactiveProxy = new ReactiveProxy({
            valueMutated,
            valueObserved,
            getProxyfiedValue,
        });
    }

    getProxy(obj: object): object {
        return this.getProxyfiedValue(obj);
    }

    getReadOnlyProxy(obj: object): object {
        return this.getProxyfiedValue(obj);
    }

    unwrapProxy(reactiveProxy: any): object | undefined {
        return reactiveProxy[REACTIVE_PROXY_TO_OBJECT];
    }
}
