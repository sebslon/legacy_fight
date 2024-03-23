import { Module } from '@nestjs/common';

import { ClientNotificationService } from './client-notification.service';
import { DriverNotificationService } from './driver-notification.service';

@Module({
  providers: [ClientNotificationService, DriverNotificationService],
  exports: [ClientNotificationService, DriverNotificationService],
})
export class NotificationModule {}
