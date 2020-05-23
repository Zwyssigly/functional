import { UnwrapException } from "./shared";

export function Option<T>(value : T | undefined | null) : Option<T> {
  return value === undefined || value === null 
    ? None
    : Some(value);
}

export interface Option<T> {

  match<U>(onSome: (some: T) => U, onNone: () => U) : U;

  ifSome(onSome: (some: T) => void) : void;
  ifNone(onNone: () => void) : void;

  unwrap(): T | never;
  unwrapOr<U>(onNone: () => U): T | U;

  map<U>(onSome: (some: T) => U) : Option<U>;

  isSome() : boolean;
  isNone() : boolean;

  orThen<U>(onNone: () => Option<U>) : Option<T | U>;
  andThen<U>(onSome: (some: T) => Option<U>) : Option<U>;

  matchAsync<U>(onSome: (some: T) => PromiseLike<U>, onNone: () => PromiseLike<U>) : PromiseLike<U>;
  mapAsync<U>(onSome: (some: T) => PromiseLike<U>) : AsyncOption<U>
  andThenAsync<U>(onSome: (some: T) => PromiseLike<Option<U>>) : AsyncOption<U>;
  orThenAsync<U>(onNone: () => PromiseLike<Option<U>>) : AsyncOption<T | U>;
  ifSomeAsync(onSome: (some: T) => PromiseLike<void>) : PromiseLike<void>;
  ifNoneAsync(onNone: () => PromiseLike<void>) : PromiseLike<void>;
}


interface OptionMixin<T> extends Option<T> {}
class OptionMixin<T> {
  ifSome(onSome: (some: T) => void) {
    this.match(onSome, () => {});
  }
  ifNone(onNone: () => void) {
    this.match(_ => {}, onNone);
  }
  unwrap() : T {
    return this.match(v => v, () => { throw UnwrapException });
  }
  unwrapOr<U>(onNone: () => U): T | U {
    return this.match<T | U>(v => v, onNone);
  }
  map<U>(onSome: (some: T) => U) : Option<U> {
    return this.match(v => Some(onSome(v)), () => None);
  }
  isSome() : boolean {
    return this.match(_ => true, () => false);
  }
  isNone() : boolean {
    return this.match(_ => false, () => true);
  }
  orThen<U>(onNone: () => Option<U>) : Option<T | U> {
    return this.match(_ => this as Option<T | U>, onNone);
  }
  andThen<U>(onSome: (some: T) => Option<U>) : Option<U> {
    return this.match(onSome, () => None);
  }

  matchAsync<U>(onSome: (some: T) => PromiseLike<U>, onNone: () => PromiseLike<U>) : PromiseLike<U> {
    return this.match(onSome, onNone);
  }
  mapAsync<U>(onSome: (some: T) => PromiseLike<U>) : AsyncOption<U> {
    return AsyncOption(
      this.match(async s => Some(await onSome(s)), () => Promise.resolve(None))
    );
  }

  andThenAsync<U>(onSome: (some: T) => PromiseLike<Option<U>>) : AsyncOption<U> {
    return AsyncOption(
      this.match(onSome, () => Promise.resolve(None))
    );
  }

  orThenAsync<U>(onNone: () => PromiseLike<Option<U>>) : AsyncOption<T | U> {
    return AsyncOption(
      this.match<PromiseLike<Option<T | U>>>(_ => Promise.resolve(this), onNone)
    )
  }

  ifSomeAsync(onSome: (some: T) => PromiseLike<void>) : PromiseLike<void> {
    return this.match(onSome, () => Promise.resolve());
  }

  ifNoneAsync(onNone: () => PromiseLike<void>) : PromiseLike<void> {
    return this.match(_ => Promise.resolve(), onNone);
  }
}

interface OptionSome<T> extends OptionMixin<T> {}
class OptionSome<T> implements Option<T> {
  constructor(private readonly value: T) {}

  match<U>(onSome: (some: T) => U): U {
    return onSome(this.value);
  }
}
Object.defineProperties(OptionSome.prototype, Object.getOwnPropertyDescriptors(OptionMixin.prototype));

interface OptionNone<T = never> extends Option<T> {}
class OptionNone<T = never> implements Option<T> {
  match<U>(_: (some: T) => U, onNone: () => U): U {
    return onNone();
  }
}
Object.defineProperties(OptionNone.prototype, Object.getOwnPropertyDescriptors(OptionMixin.prototype));

export const None: Option<never> = new OptionNone();
export function Some<T>(value: T) : Option<T> { return new OptionSome<T>(value); }

export interface AsyncOption<T> extends PromiseLike<Option<T>> {
  andThenAsync<U>(onSome: (some: T) => PromiseLike<Option<U>>): AsyncOption<U>;
  orThenAsync<U>(onNone: () => PromiseLike<Option<U>>): AsyncOption<T | U>;
  mapAsync<U>(onSome: (some: T) => PromiseLike<U>): AsyncOption<U>;
  matchAsync<U>(onSome: (some: T) => PromiseLike<U>, onNone: () => PromiseLike<U>): PromiseLike<U>;
  ifSomeAsync(onSome: (some: T) => PromiseLike<void>): PromiseLike<void>;
  ifNoneAsync(onNone: () => PromiseLike<void>): PromiseLike<void>;
  map<U>(onSome: (some: T) => U): AsyncOption<U>;
  match<U>(onSome: (some: T) => U, onNone: () => U): PromiseLike<U>;
  andThen<U>(onSome: (some: T) => Option<U>): AsyncOption<U>;
  orThen<U>(onNone: () => Option<U>): AsyncOption<T | U>;
  ifSome(onSome: (some: T) => void): PromiseLike<void>;
  ifNone(onNone: () => void): PromiseLike<void>;
  isSome(): PromiseLike<boolean>;
  isNone(): PromiseLike<boolean>;
  unwrap(): PromiseLike<T | never>;
  unwrapOr<U>(onNone: () => U): PromiseLike<T | U>;
}

class AsyncOptionImpl<T> implements AsyncOption<T> {
  
  constructor (private readonly promiseLike: PromiseLike<Option<T>>) {}

  then<TResult1 = Option<T>, TResult2 = never>(onfulfilled?: ((value: Option<T>) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined): PromiseLike<TResult1 | TResult2> {
    return this.promiseLike.then(onfulfilled, onrejected);
  }

  andThenAsync<U>(onSome: (some: T) => PromiseLike<Option<U>>) : AsyncOption<U> {
    return this.then(o => o.andThenAsync(onSome)) as AsyncOption<U>;
  }
  orThenAsync<U>(onNone: () => PromiseLike<Option<U>>) : AsyncOption<T | U> {
    return this.then(o => o.orThenAsync(onNone)) as AsyncOption<T | U>;
  }
  mapAsync<U>(onSome: (some: T) => PromiseLike<U>) : AsyncOption<U> {
    return this.then(o => o.mapAsync(onSome)) as AsyncOption<U>;
  }
  matchAsync<U>(onSome: (some: T) => PromiseLike<U>, onNone: () => PromiseLike<U>) : PromiseLike<U> {
    return this.then(o => o.matchAsync(onSome, onNone));
  }
  ifSomeAsync(onSome: (some: T) => PromiseLike<void>) : PromiseLike<void> {
    return this.then(o => o.ifSomeAsync(onSome));
  }
  ifNoneAsync(onNone: () => PromiseLike<void>) : PromiseLike<void> {
    return this.then(o => o.ifNoneAsync(onNone));
  }
  map<U>(onSome: (some: T) => U) : AsyncOption<U> {
    return new AsyncOptionImpl<U>(this.then(o => o.map(onSome)));
  }
  match<U>(onSome: (some: T) => U, onNone: () => U) : PromiseLike<U> {
    return this.then(o => o.match(onSome, onNone));
  }
  andThen<U>(onSome: (some: T) => Option<U>) : AsyncOption<U> {
    return new AsyncOptionImpl<U>(this.then(o => o.andThen(onSome)));
  }
  orThen<U>(onNone: () => Option<U>) : AsyncOption<T | U> {
    return new AsyncOptionImpl<T | U>(this.then(o => o.orThen(onNone)));
  }
  ifSome(onSome: (some: T) => void) : PromiseLike<void> {
    return this.then(o => o.ifSome(onSome));
  }
  ifNone(onNone: () => void) : PromiseLike<void> {
    return this.then(o => o.ifNone(onNone));
  }
  isSome() : PromiseLike<boolean> {
    return this.then(o => o.isSome());
  }
  isNone() : PromiseLike<boolean> {
    return this.then(o => o.isNone());
  }
  unwrap() : PromiseLike<T | never> {
    return this.then(o => o.unwrap());
  }
  unwrapOr<U>(onNone: () => U) : PromiseLike<T | U> {
    return this.then(o => o.unwrapOr(onNone));
  }
}

export function AsyncOption<T>(promise: PromiseLike<Option<T>>) : AsyncOption<T> {
  return promise instanceof AsyncOptionImpl
    ? promise : new AsyncOptionImpl<T>(promise);
}
