import { PartialType } from '@nestjs/mapped-types';
import { CreatePguDto } from './create-pgu.dto';

export class UpdatePguDto extends PartialType(CreatePguDto) {
  id: number;
}
