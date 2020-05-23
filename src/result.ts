import { UnwrapException } from "./shared";

export interface Result<T, E> {
  match<U>(onOk: (ok: T) => U, onErr: (err: E) => U) : U;

  isOk() : boolean;
  isErr() : boolean

  ifOk(onOk: (ok: T) => void) : void;
  ifErr(onErr: (err: E) => void) : void;

  mapOk<U>(onOk: (ok: T) => U) : Result<U, E>;
  mapErr<U>(onErr: (err: E) => U) : Result<T, U>;
  map<U, W>(onOk: (ok: T) => U, onErr: (err: E) => W) : Result<U, W>;

  unwrap() : T | never;
  unwrapOr<U>(onErr: (err: E) => U) : T | U;
  unwrapErr() : E | never;

  andThen<U>(onOk: (ok: T) => Result<U, E>) : Result<U, E>;
  orThen<U>(onErr: (err: E) => Result<U, E>) : Result<T | U, E>;

  matchAsync<U>(onOk: (ok: T) => PromiseLike<U>, onErr: (err: E) => PromiseLike<U>) : PromiseLike<U>;
  ifOkAsync(onOk: (ok: T) => PromiseLike<void>) : PromiseLike<void>;
  ifErrAsync(onErr: (err: E) => PromiseLike<void>) : PromiseLike<void>;
  mapOkAsync<U>(onOk: (ok: T) => PromiseLike<U>) : AsyncResult<U, E>;
  mapErrAsync<U>(onErr: (err: E) => PromiseLike<U>) : AsyncResult<T, U>;
  mapAsync<U, W>(onOk: (ok: T) => PromiseLike<U>, onErr: (err: E) => PromiseLike<W>) : AsyncResult<U, W>;
  andThenAsync<U>(onOk: (ok: T) => PromiseLike<Result<U, E>>) : AsyncResult<U, E>;
  orThenAsync<U>(onErr: (err: E) => PromiseLike<Result<U, E>>) : AsyncResult<T | U, E>;
}

interface ResultMixin<T, E> extends Result<T, E> {}
class ResultMixin<T, E> {
  isOk() : boolean {
    return this.match(_ => true, _ => false);
  }
  isErr() : boolean {
    return this.match(_ => false, _ => true);
  }
  ifOk(onOk: (ok: T) => void) : void {
    this.match(onOk, _ => {});
  }
  ifErr(onErr: (err: E) => void) : void {
    this.match(_ => {}, onErr);
  }
  mapOk<U>(onOk: (ok: T) => U) : Result<U, E> {
    return this.match<Result<U, E>>(ok => Ok(onOk(ok)), err => Err(err));
  }
  mapErr<U>(onErr: (err: E) => U) : Result<T, U> {
    return this.match<Result<T, U>>(ok => Ok(ok), err => Err(onErr(err)));
  }
  map<U, W>(onOk: (ok: T) => U, onErr: (err: E) => W) : Result<U, W> {
    return this.match<Result<U, W>>(ok => Ok(onOk(ok)), err => Err(onErr(err)));
  }
  unwrap() : T | never {
    return this.match(s => s, _ => { throw UnwrapException });
  }
  unwrapOr<U>(onErr: (err: E) => U) : T | U {
    return this.match<T | U>(s => s, onErr);
  }
  unwrapErr() : E | never {
    return this.match(_ => { throw UnwrapException }, e => e);
  }
  andThen<U>(onOk: (ok: T) => Result<U, E>) : Result<U, E> {
    return this.match(onOk, err => Err(err));
  }
  orThen<U>(onErr: (err: E) => Result<U, E>) : Result<T | U, E> {
    return this.match<Result<T | U, E>>(ok => Ok(ok), onErr);
  }
  matchAsync<U>(onOk: (ok: T) => PromiseLike<U>, onErr: (err: E) => PromiseLike<U>) : PromiseLike<U> {
    return this.match(onOk, onErr);
  }
  ifOkAsync(onOk: (ok: T) => PromiseLike<void>) : PromiseLike<void> {
    return this.match(onOk, _ => Promise.resolve());
  }
  ifErrAsync(onErr: (err: E) => PromiseLike<void>) : PromiseLike<void> {
    return this.match(_ => Promise.resolve(), onErr);
  }
  mapOkAsync<U>(onOk: (ok: T) => PromiseLike<U>) : AsyncResult<U, E> {
    return AsyncResult(this.match<PromiseLike<Result<U, E>>>(ok => onOk(ok).then(Ok), err => Promise.resolve(Err(err))));
  }
  mapErrAsync<U>(onErr: (err: E) => PromiseLike<U>) : AsyncResult<T, U> {
    return AsyncResult(this.match(ok => Promise.resolve(Ok(ok)), err => onErr(err).then(Err)));
  }
  mapAsync<U, W>(onOk: (ok: T) => PromiseLike<U>, onErr: (err: E) => PromiseLike<W>) : AsyncResult<U, W> {
    return AsyncResult(this.match(ok => onOk(ok).then(Ok), err => onErr(err).then(Err)));
  }
  andThenAsync<U>(onOk: (ok: T) => PromiseLike<Result<U, E>>) : AsyncResult<U, E> {
    return AsyncResult(this.match(onOk, err => Promise.resolve(Err(err))));
  }
  orThenAsync<U>(onErr: (err: E) => PromiseLike<Result<U, E>>) : AsyncResult<T | U, E> {
    return AsyncResult(this.match<PromiseLike<Result<T | U, E>>>(ok => Promise.resolve(Ok(ok)), onErr));
  }
}

interface ResultOk<T, E> extends Result<T, E> {}
class ResultOk<T, E = never> implements Result<T, E> {

  constructor(private readonly ok: T) {}

  match<U>(onOk: (ok: T) => U, _: (err: E) => U): U {
    return onOk(this.ok);
  }
}
Object.defineProperties(ResultOk.prototype, Object.getOwnPropertyDescriptors(ResultMixin.prototype));

interface ResultErr<T, E> extends Result<T, E> {}
class ResultErr<T, E> implements Result<T, E> {

  constructor(private readonly err: E) {}

  match<U>(_: (ok: T) => U, onErr: (err: E) => U): U {
    return onErr(this.err);
  }
}
Object.defineProperties(ResultErr.prototype, Object.getOwnPropertyDescriptors(ResultMixin.prototype));

export function Ok<T>(ok: T) : Result<T, never> { return new ResultOk(ok); }
export function Err<E>(err: E) : Result<never, E> { return new ResultErr(err); }

export interface AsyncResult<T, E> extends PromiseLike<Result<T, E>> {
  match<U>(onOk: (ok: T) => U, onErr: (err: E) => U): PromiseLike<U>;
  isOk(): PromiseLike<boolean>;
  isErr(): PromiseLike<boolean>;
  ifOk(onOk: (ok: T) => void): PromiseLike<void>;
  ifErr(onErr: (err: E) => void): PromiseLike<void>;
  mapOk<U>(onOk: (ok: T) => U): AsyncResult<U, E>;
  mapErr<U>(onErr: (err: E) => U): AsyncResult<T, U>;
  map<U, W>(onOk: (ok: T) => U, onErr: (err: E) => W): AsyncResult<U, W>;
  unwrap(): PromiseLike<T>;
  unwrapOr<U>(onErr: (err: E) => U): PromiseLike<T | U>;
  unwrapErr() : PromiseLike<E>;
  andThen<U>(onOk: (ok: T) => Result<U, E>): AsyncResult<U, E>;
  orThen<U>(onErr: (err: E) => Result<U, E>): AsyncResult<T | U, E>;
  matchAsync<U>(onOk: (ok: T) => PromiseLike<U>, onErr: (err: E) => PromiseLike<U>): PromiseLike<U>;
  ifOkAsync(onOk: (ok: T) => PromiseLike<void>): PromiseLike<void>;
  ifErrAsync(onErr: (err: E) => PromiseLike<void>): PromiseLike<void>;
  mapOkAsync<U>(onOk: (ok: T) => PromiseLike<U>): AsyncResult<U, E>;
  mapErrAsync<U>(onErr: (err: E) => PromiseLike<U>): AsyncResult<T, U>;
  mapAsync<U, W>(onOk: (ok: T) => PromiseLike<U>, onErr: (err: E) => PromiseLike<W>): AsyncResult<U, W>;
  andThenAsync<U>(onOk: (ok: T) => PromiseLike<Result<U, E>>): AsyncResult<U, E>;
  orThenAsync<U>(onErr: (err: E) => PromiseLike<Result<U, E>>): AsyncResult<T | U, E>;
}

class AsyncResultImpl<T, E> implements AsyncResult<T, E> {

  constructor (
    private readonly promise: PromiseLike<Result<T, E>>
  ) {}

  then<TResult1 = Result<T, E>, TResult2 = never>(onfulfilled?: ((value: Result<T, E>) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined): PromiseLike<TResult1 | TResult2> {
    return this.promise.then(onfulfilled, onrejected);
  }

  match<U>(onOk: (ok: T) => U, onErr: (err: E) => U) : PromiseLike<U> {
    return this.then(o => o.match(onOk, onErr));
  }
  isOk() : PromiseLike<boolean> {
    return this.then(o => o.isOk());
  }
  isErr() : PromiseLike<boolean> {
    return this.then(o => o.isErr());
  }
  ifOk(onOk: (ok: T) => void) : PromiseLike<void> {
    return this.then(o => o.ifOk(onOk));
  }
  ifErr(onErr: (err: E) => void) : PromiseLike<void> {
    return this.then(o => o.ifErr(onErr));
  }
  mapOk<U>(onOk: (ok: T) => U) : AsyncResult<U, E> {
    return AsyncResult(this.then(o => o.mapOk(onOk)));
  }
  mapErr<U>(onErr: (err: E) => U) : AsyncResult<T, U> {
    return AsyncResult(this.then(o => o.mapErr(onErr)));
  }
  map<U, W>(onOk: (ok: T) => U, onErr: (err: E) => W) : AsyncResult<U, W> {
    return AsyncResult(this.then(o => o.map(onOk, onErr)));
  }
  unwrap() : PromiseLike<T> {
    return this.then(o => o.unwrap());
  }
  unwrapOr<U>(onErr: (err: E) => U) : PromiseLike<T | U> {
    return this.then(o => o.unwrapOr(onErr));
  }
  unwrapErr() : PromiseLike<E> {
    return this.then(o => o.unwrapErr());
  }
  andThen<U>(onOk: (ok: T) => Result<U, E>) : AsyncResult<U, E> {
    return AsyncResult(this.then(o => o.andThen(onOk)));
  }
  orThen<U>(onErr: (err: E) => Result<U, E>) : AsyncResult<T | U, E> {
    return AsyncResult(this.then(o => o.orThen(onErr)));
  }
  matchAsync<U>(onOk: (ok: T) => PromiseLike<U>, onErr: (err: E) => PromiseLike<U>) : PromiseLike<U> {
    return this.then(o => o.matchAsync(onOk, onErr));
  }
  ifOkAsync(onOk: (ok: T) => PromiseLike<void>) : PromiseLike<void> {
    return this.then(o => o.ifOkAsync(onOk));
  }
  ifErrAsync(onErr: (err: E) => PromiseLike<void>) : PromiseLike<void> {
    return this.then(o => o.ifErrAsync(onErr));
  }
  mapOkAsync<U>(onOk: (ok: T) => PromiseLike<U>) : AsyncResult<U, E> {
    return AsyncResult(this.then(o => o.mapOkAsync(onOk)));
  }
  mapErrAsync<U>(onErr: (err: E) => PromiseLike<U>) : AsyncResult<T, U> {
    return AsyncResult(this.then(o => o.mapErrAsync(onErr)));
  }
  mapAsync<U, W>(onOk: (ok: T) => PromiseLike<U>, onErr: (err: E) => PromiseLike<W>) : AsyncResult<U, W> {
    return AsyncResult(this.then(o => o.mapAsync(onOk, onErr)));
  }
  andThenAsync<U>(onOk: (ok: T) => PromiseLike<Result<U, E>>) : AsyncResult<U, E> {
    return AsyncResult(this.then(o => o.andThenAsync(onOk)));
  }
  orThenAsync<U>(onErr: (err: E) => PromiseLike<Result<U, E>>) : AsyncResult<T | U, E> {
    return AsyncResult(this.then(o => o.orThenAsync(onErr)));
  }
}

export function AsyncResult<T, E>(promise: PromiseLike<Result<T, E>>) : AsyncResult<T, E> {
  return promise instanceof AsyncResultImpl
    ? promise : new AsyncResultImpl(promise);
}

export type RailwayObject<T, E> = {
  [P in keyof T]: () => Result<T[P], E>;
}

export function railwayObject<T, E>(validator : RailwayObject<T, E>): Result<T, E> {
  let obj: Partial<T> = {};
  for (let key in validator) {
    var result = validator[key]();
    if (result.isErr()) 
      return Err(result.unwrapErr());
    obj[key] = result.unwrap();
  }
  return Ok(obj as T);
}