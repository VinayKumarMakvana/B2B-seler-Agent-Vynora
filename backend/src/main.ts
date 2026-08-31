import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: [
      'https://vynora.com', 
      'https://api.vynora.com', 
      'https://b2-b-seler-agent-vynora.vercel.app',
      process.env.FRONTEND_URL
    ].filter(Boolean) as string[],
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3001, '0.0.0.0');
}
bootstrap();
