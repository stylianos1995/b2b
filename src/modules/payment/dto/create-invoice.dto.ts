import { IsUUID } from 'class-validator';

export class CreateInvoiceDto {
  @IsUUID()
  order_id: string;
}
