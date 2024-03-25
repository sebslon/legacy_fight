import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ClientController } from './client.controller';
import { Client } from './client.entity';
import { ClientRepository } from './client.repository';
import { ClientService } from './client.service';

@Module({
  imports: [TypeOrmModule.forFeature([Client, ClientRepository])],
  controllers: [ClientController],
  providers: [ClientService],
  exports: [ClientService],
})
export class ClientModule {}
