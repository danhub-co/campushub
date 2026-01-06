import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { AuthGuard } from '../auth/auth.guard';
import { Request } from 'express';

@Controller('api/documents')
export class DocumentsController {
  constructor(private readonly docs: DocumentsService) {}

  // Protected: creates a DB entry + returns S3 presigned PUT url
  @Post('presign')
  @UseGuards(AuthGuard)
  async presign(@Req() req: Request, @Body() body: { filename: string; contentType: string }) {
    const user = (req as any).user;
    const res = await this.docs.createPresignedUpload(user.id, body.filename, body.contentType);
    return res;
  }

  // Protected: get a signed GET url to download
  @Get(':id/url')
  @UseGuards(AuthGuard)
  async downloadUrl(@Param('id') id: string) {
    const res = await this.docs.getDownloadUrl(id);
    if (!res) return { error: 'not_found' };
    return res;
  }

  // Protected: delete object + DB record
  @Delete(':id')
  @UseGuards(AuthGuard)
  async delete(@Param('id') id: string) {
    const res = await this.docs.deleteDocument(id);
    if (!res) return { error: 'not_found' };
    return res;
  }
}