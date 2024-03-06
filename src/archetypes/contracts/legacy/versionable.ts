export interface Versionable {
  recreateTo(version: string): void;
  getLastVersion(): string;
}
