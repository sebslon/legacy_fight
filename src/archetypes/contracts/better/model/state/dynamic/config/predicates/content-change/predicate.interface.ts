export interface Predicate<T> {
  test(state: T): boolean;
}
