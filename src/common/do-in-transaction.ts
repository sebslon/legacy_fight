import { getConnection } from 'typeorm';

export async function doInTransaction<T>(cb: () => Promise<T>): Promise<T> {
  const queryRunner = getConnection().createQueryRunner();
  await queryRunner.startTransaction();

  try {
    const result = await cb();

    await queryRunner.commitTransaction();

    return result;
  } catch (e) {
    await queryRunner.rollbackTransaction();

    throw e;
  } finally {
    await queryRunner.release();
  }
}
