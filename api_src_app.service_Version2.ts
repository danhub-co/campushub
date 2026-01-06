import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  example() {
    return { message: 'Study Abroad API — example response' };
  }
}