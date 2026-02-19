import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Res,
  Header,
} from '@nestjs/common';
import { ParseUUIDPipe } from '@nestjs/common/pipes';
import { Response } from 'express';
import { InvoiceService } from './invoice.service';
import { InvoicePdfService } from './invoice-pdf.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { RequestContext } from '../../common/interfaces/request-context.interface';

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoiceController {
  constructor(
    private invoiceService: InvoiceService,
    private invoicePdfService: InvoicePdfService,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('provider_owner', 'provider_manager', 'provider_staff')
  async create(@CurrentUser() user: RequestContext, @Body() dto: CreateInvoiceDto) {
    return this.invoiceService.create(user, dto);
  }

  @Get(':id/pdf')
  @Header('Content-Type', 'application/pdf')
  async getPdf(
    @CurrentUser() user: RequestContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const { buffer, invoiceNumber } = await this.invoicePdfService.getPdf(user, id);
    const filename = `invoice-${invoiceNumber}.pdf`.replace(/[^a-zA-Z0-9._-]/g, '_');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get(':id')
  async findOne(@CurrentUser() user: RequestContext, @Param('id', ParseUUIDPipe) id: string) {
    return this.invoiceService.findOne(user, id);
  }
}
