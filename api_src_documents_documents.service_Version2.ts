import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  private s3Client: S3Client;
  private bucket: string;
  private region: string;
  private uploadExpiresSeconds = 900; // 15 minutes
  private downloadExpiresSeconds = 900; // 15 minutes

  constructor() {
    this.bucket = process.env.S3_BUCKET || '';
    this.region = process.env.S3_REGION || 'us-east-1';
    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }

  // Creates a DB record and returns a presigned PUT URL for uploading the file directly from the browser
  async createPresignedUpload(userId: string, filename: string, contentType: string) {
    const unique = uuidv4();
    const safeName = filename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const key = `uploads/${userId}/${unique}_${safeName}`;

    const doc = await prisma.document.create({
      data: {
        userId,
        key,
        filename,
        contentType,
      },
    });

    const putCommand = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
      ACL: 'private',
    });

    const uploadUrl = await getSignedUrl(this.s3Client, putCommand, {
      expiresIn: this.uploadExpiresSeconds,
    });

    return {
      document: doc,
      uploadUrl,
      key,
      expiresIn: this.uploadExpiresSeconds,
    };
  }

  async getDownloadUrl(documentId: string) {
    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) return null;

    const getCommand = new GetObjectCommand({
      Bucket: this.bucket,
      Key: doc.key,
    });

    const url = await getSignedUrl(this.s3Client, getCommand, {
      expiresIn: this.downloadExpiresSeconds,
    });

    return { url, doc };
  }

  async deleteDocument(documentId: string) {
    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) return null;

    const del = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: doc.key,
    });

    await this.s3Client.send(del);

    await prisma.document.delete({ where: { id: documentId } });
    return { ok: true };
  }

  // New: Confirm upload by running HEAD against the S3 object, then updating DB record with size/contentType/verified/uploadedAt
  async confirmUpload(documentId: string) {
    const doc = await prisma.document.findUnique({ where: { id: documentId } });
    if (!doc) return null;

    try {
      const headCommand = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: doc.key,
      });

      const headResult = await this.s3Client.send(headCommand);

      const contentLength = headResult.ContentLength ?? null;
      const contentType = headResult.ContentType ?? null;

      const updated = await prisma.document.update({
        where: { id: documentId },
        data: {
          size: contentLength ? Number(contentLength) : undefined,
          contentType: contentType ?? undefined,
          verified: true,
          uploadedAt: new Date(),
        },
      });

      return updated;
    } catch (err) {
      this.logger.warn(`confirmUpload failed for ${documentId}: ${err}`);
      return null;
    }
  }
}
