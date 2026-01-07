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

  // Protected: confirm upload completion (runs HEAD on S3 and updates DB)
  @Post(':id/complete')
  @UseGuards(AuthGuard)
  async complete(@Req() req: Request, @Param('id') id: string) {
    const user = (req as any).user;
    const doc = await (await import('@prisma/client')).PrismaClient.prototype.document?.findUnique?.call
      ? undefined
      : undefined;
    // Ensure document exists and belongs to user (security check)
    const prisma = (await import('@prisma/client')).PrismaClient;
    // Using a fresh Prisma instance here to avoid circular import complexities in some setups
    const p = new prisma();
    const existing = await p.document.findUnique({ where: { id } });
    if (!existing) {
      return { error: 'not_found' };
    }
    if (existing.userId !== user.id) {
      return { error: 'forbidden' };
    }

    const updated = await this.docs.confirmUpload(id);
    if (!updated) return { error: 'confirm_failed' };
    return { document: updated };
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
