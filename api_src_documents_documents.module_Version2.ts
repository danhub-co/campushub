import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { AuthService } from '../auth/auth.service';

@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService, AuthService],
})
export class DocumentsModule {}