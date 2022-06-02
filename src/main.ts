import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'pgu-simulator',
        brokers: ['localhost:9092'],
      },
      consumer: {
        groupId: 'pgu-simulator-consumer',
      },
    },
  });
  app.listen();
}
bootstrap();
