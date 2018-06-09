// @flow
type Observer<T> = {
  next: T => void,
  complete: () => void,
  error: (e: Error) => void
};

type Initializer<T> = (Observer<T>) => T => void;

interface UnaryFunction<T, R> {
  (source: T): R;
}

const noop = () => {};

class Observable<T> {
  initializer: Initializer<T>;

  constructor(initializer: Initializer<T>) {
    this.initializer = initializer;
  }

  static fromEvent(target: HTMLElement | Document, event: string) {
    return new Observable(observer => {
      const handler = e => observer.next(e);

      target.addEventListener(event, handler);

      return () => {
        target.removeEventListener(event, handler);
      };
    });
  }

  subscribe(observer: Observer<T>) {
    return this.initializer(observer) || noop;
  }

  map<A, R>(fn: A => R) {
    return new Observable(observer => {
      return this.subscribe({
        next(val: T) {
          observer.next(fn(val));
        },
        complete() {
          observer.complete();
        },
        error(e: Error) {
          observer.error(e);
        }
      });
    });
  }

  pipe<T, R>(...fns: Array<UnaryFunction<T, R>>) {
    return new Observable(observer => {
      return this.subscribe({
        next(val: T) {
          observer.next(fns.reduce((state, fn) => fn(state), val));
        },
        complete() {
          observer.complete();
        },
        error(e) {
          observer.error(e);
        }
      });
    });
  }
}

const unsubMouseObserver = Observable.fromEvent(document, 'mousemove')
  .map(({ clientX }) => clientX)
  .subscribe({
    next: console.log,
    complete: console.log,
    error: console.log
  });
