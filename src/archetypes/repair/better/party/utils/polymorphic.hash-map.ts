// TODO: FINISH
export class PolymorphicHashMap<
  K extends new (...args: unknown[]) => unknown,
  V,
> extends Map<K, V> {
  constructor(entries?: readonly (readonly [K, V])[] | null) {
    super(entries);
  }

  public containsKey(key: unknown): boolean {
    return this.findEntry(key) !== undefined;
  }

  public get(key: unknown): V | undefined {
    const entry = this.findEntry(key);
    return entry ? entry[1] : undefined;
  }

  private findEntry(key: unknown): [K, V] | undefined {
    for (const entry of this.entries()) {
      if (key instanceof entry[0]) {
        return entry;
      }
    }
    return undefined;
  }
}
