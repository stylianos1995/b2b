import { IsString, IsIn } from 'class-validator';

export class UpdateProviderStatusDto {
  @IsString()
  @IsIn(['active', 'suspended', 'pending_verification'])
  status: string;
}
