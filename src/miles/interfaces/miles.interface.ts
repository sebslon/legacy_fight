export interface MilesInterface {
  getAmountFor(moment: Date): number;

  subtract(amount: number, moment: Date): MilesInterface;

  expiresAt(): Date | null;
}
