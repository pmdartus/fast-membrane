export type MembraneCallback = (target: object, propertyKey: PropertyKey) => void;

export interface MembraneOptions {
    valueMutated?: MembraneCallback;
    valueObserved?: MembraneCallback;
}