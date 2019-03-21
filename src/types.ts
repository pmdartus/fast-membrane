export type MembraneCallback = (target: object, propertyKey: PropertyKey) => void;

export interface MembraneOptions {
    valueMutated?: MembraneCallback;
    valueObserved?: MembraneCallback;
}

export interface Membrane {
    getProxy<T extends object>(obj: T): T;
    getReadOnlyProxy<T extends object>(obj: T): T;
    unwrapProxy<T extends object>(reactiveProxy: T): T;
}