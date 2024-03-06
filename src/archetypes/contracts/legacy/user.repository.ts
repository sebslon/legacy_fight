import { Repository } from 'typeorm';

import { User } from './user';

export class UserRepository extends Repository<User> {}
