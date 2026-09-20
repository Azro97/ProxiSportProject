// src/services/withTimeout.ts
// Supabase's client has no built-in request timeout — a flaky connection can hang
// indefinitely rather than reject, which leaves screens stuck on "loading" forever
// instead of surfacing the ErrorState/retry UI. Every service call wraps its
// Supabase query in this so a stalled connection fails fast and predictably.

export class TimeoutError extends Error {
  constructor(ms: number) {
    super(`Requête expirée après ${ms}ms`);
    this.name = 'TimeoutError';
  }
}

export function withTimeout<T>(query: PromiseLike<T>, ms = 10000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError(ms)), ms);
    Promise.resolve(query).then(
      value => { clearTimeout(timer); resolve(value); },
      err => { clearTimeout(timer); reject(err); },
    );
  });
}
