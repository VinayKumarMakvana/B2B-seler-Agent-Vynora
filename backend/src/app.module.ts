import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CrmModule } from './modules/crm/crm.module';
import { AuthModule } from './modules/auth/auth.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { DiscoveryModule } from './modules/discovery/discovery.module';
import { ResponseModule } from './modules/response/response.module';
import { OutreachModule } from './modules/outreach/outreach.module';
import { FollowupModule } from './modules/followup/followup.module';
import { SalesModule } from './modules/sales/sales.module';
import { DeliveryModule } from './modules/delivery/delivery.module';
import { EmailModule } from './modules/integrations/email/email.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL')?.includes('localhost') && process.env.DB_HOST === 'db' 
          ? `postgres://${configService.get('DB_USER')}:${configService.get('DB_PASSWORD')}@${configService.get('DB_HOST')}:${configService.get('DB_PORT')}/${configService.get('DB_NAME')}`
          : configService.get<string>('DATABASE_URL') || `postgres://${configService.get('DB_USER')}:${configService.get('DB_PASSWORD')}@${configService.get('DB_HOST')}:${configService.get('DB_PORT')}/${configService.get('DB_NAME')}`,
        autoLoadEntities: true,
        synchronize: process.env.NODE_ENV !== 'production', // DANGEROUS IN PROD
      }),
    }),
    CrmModule,
    AuthModule,
    IntegrationsModule,
    JobsModule,
    DiscoveryModule,
    ResponseModule,
    OutreachModule,
    FollowupModule,
    SalesModule,
    DeliveryModule,
    EmailModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
