export default () => ({
  type: 'postgres',
  host: 'localhost',
  port: process.env.DATABASE_PORT
    ? parseInt(process.env.DATABASE_PORT, 10)
    : 3456,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  autoLoadEntities: true,
  synchronize: process.env.DATABASE_SYNCHRONIZE === 'true',
});
