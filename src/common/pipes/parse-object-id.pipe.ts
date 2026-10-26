import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ObjectId } from 'mongodb';

/** Validates that a route parameter is a well-formed MongoDB ObjectId. */
@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!ObjectId.isValid(value)) {
      throw new BadRequestException(`Invalid id: ${value}`);
    }
    return value;
  }
}
