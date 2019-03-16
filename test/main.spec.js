const { default: Membrane } = require('../src/main');

describe('getProxy', () => {
    it('should wrap the original object into a proxy', () => {
        const membrane = new Membrane();

        const original = {};
        const proxified = membrane.getProxy(original);

        expect(original).not.toBe(proxified);
    });

    it('should return the same proxy if already part of the object graph', () => {
        const membrane = new Membrane();

        const original = {};
        const proxified1 = membrane.getProxy(original);
        const proxified2 = membrane.getProxy(original);

        expect(proxified1).toBe(proxified2);
    });

    it('should not rewrap an existing ReactiveProxy', () => {
        const membrane = new Membrane();

        const original = {};
        const proxified1 = membrane.getProxy(original);
        const proxified2 = membrane.getProxy(proxified1);

        expect(proxified1).toBe(proxified2);
    });

    it('should handle frozen object', () => {
        const membrane = new Membrane();

        const original = Object.freeze({ x: 1 });
        const proxified = membrane.getProxy(original);

        expect(proxified.x).toBe(1);
    });

    it('should handle freezing reactive proxy', () => {
        const membrane = new Membrane();

        const original = { x: 1 };
        const proxified = membrane.getProxy(original);
        Object.freeze(proxified);

        expect(proxified.x).toBe(1);
    });

    it('should handle circular object reference', () => {
        const membrane = new Membrane();

        const a = { name: 'a' };
        const b = { name: 'b' };
        a.ref = b;
        b.ref = a;

        const proxifiedA = membrane.getProxy(a);
        const proxifiedB = proxifiedA.ref;

        expect(proxifiedB.ref).toBe(proxifiedA);
        expect(proxifiedB.ref.ref).toBe(proxifiedB);
    });
});

describe('valueObserved', () => {
    it('it should notify when accessed object properties', () => {
        let valueObserved = jest.fn();
        const membrane = new Membrane({
            valueObserved,
        });

        const original = {
            x: 1,
            y: 2,
        };
        const proxified = membrane.getProxy(original);

        proxified.x;
        proxified.y;

        expect(valueObserved).toHaveBeenCalledTimes(2);
        expect(valueObserved).toHaveBeenCalledWith(original, 'x');
        expect(valueObserved).toHaveBeenCalledWith(original, 'y');
    });

    it('it should notify when accessed nested object properties', () => {
        let valueObserved = jest.fn();
        const membrane = new Membrane({
            valueObserved,
        });

        const inner = {
            z: 2,
        };
        const outer = {
            x: 1,
            y: inner,
        };
        const proxified = membrane.getProxy(outer);

        proxified.x;
        proxified.y.z;

        expect(valueObserved).toHaveBeenCalledTimes(3);
        expect(valueObserved).toHaveBeenCalledWith(outer, 'x');
        expect(valueObserved).toHaveBeenCalledWith(outer, 'y');
        expect(valueObserved).toHaveBeenCalledWith(inner, 'z');
    });
});

describe('unwrapProxy', () => {
    it('returns the original value passed to getProxy', () => {
        const membrane = new Membrane();

        const original = {};
        const proxified = membrane.getProxy(original);

        expect(membrane.unwrapProxy(proxified)).toBe(original);
    });

    it('returns the original value from a nested object', () => {
        const membrane = new Membrane();

        const inner = {};
        const outer = { inner };
        const proxified = membrane.getProxy(outer);

        expect(membrane.unwrapProxy(proxified.inner)).toBe(inner);
    });
});
