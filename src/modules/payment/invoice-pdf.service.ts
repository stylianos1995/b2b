import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from '../../entities/invoice.entity';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit');
import { Order } from '../../entities/order.entity';
import { RequestContext } from '../../common/interfaces/request-context.interface';
import { InvoiceService } from './invoice.service';

@Injectable()
export class InvoicePdfService {
  constructor(
    @InjectRepository(Invoice) private invoiceRepo: Repository<Invoice>,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    private invoiceService: InvoiceService,
  ) {}

  async getPdf(user: RequestContext, invoiceId: string): Promise<{ buffer: Buffer; invoiceNumber: string }> {
    const invoice = await this.invoiceRepo.findOne({
      where: { id: invoiceId },
      relations: ['business', 'provider', 'invoiceLines'],
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    this.invoiceService.assertCanAccessInvoice(user, invoice);

    const orderId = invoice.invoiceLines?.[0]?.order_id ?? null;
    let orderNumber: string | null = null;
    if (orderId) {
      const order = await this.orderRepo.findOne({
        where: { id: orderId },
        select: ['order_number'],
      });
      orderNumber = order?.order_number ?? null;
    }

    const providerName = invoice.provider
      ? (invoice.provider as { trading_name?: string }).trading_name ||
        (invoice.provider as { legal_name?: string }).legal_name ||
        'Provider'
      : 'Provider';
    const businessName = invoice.business
      ? (invoice.business as { trading_name?: string }).trading_name ||
        (invoice.business as { legal_name?: string }).legal_name ||
        'Customer'
      : 'Customer';

    const lines = invoice.invoiceLines ?? [];
    const subtotal = Number(invoice.subtotal) || 0;
    const taxTotal = Number(invoice.tax_total) || 0;
    const total = Number(invoice.total) || 0;
    const currency = (invoice.currency ?? 'GBP').toUpperCase();
    const issuedAt = invoice.issued_at
      ? new Date(invoice.issued_at).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : '—';
    const dueDate = new Date(invoice.due_date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const status = (invoice.status ?? '').toUpperCase();

    const invoiceNumber = invoice.invoice_number ?? invoiceId;
    const PDF = typeof PDFDocument === 'function' ? PDFDocument : (PDFDocument as { default?: typeof PDFDocument }).default;
    if (!PDF) throw new Error('PDFDocument is not available');
    return new Promise((resolve, reject) => {
      const doc = new PDF({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve({ buffer: Buffer.concat(chunks), invoiceNumber }));
      doc.on('error', reject);

      doc.fontSize(22).text('INVOICE', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Invoice number: ${invoice.invoice_number}`, { align: 'right' });
      if (orderNumber) doc.text(`Order: ${orderNumber}`, { align: 'right' });
      doc.text(`Status: ${status}`, { align: 'right' });
      doc.text(`Issued: ${issuedAt}`, { align: 'right' });
      doc.text(`Due date: ${dueDate}`, { align: 'right' });
      doc.moveDown(1.5);

      doc.fontSize(11).text('From (Seller)', { continued: false });
      doc.fontSize(10).text(providerName);
      doc.moveDown(0.5);
      doc.text('To (Buyer)', { continued: false });
      doc.fontSize(10).text(businessName);
      doc.moveDown(1.5);

      const tableTop = doc.y;
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Description', 50, tableTop, { width: 220 });
      doc.text('Qty', 280, tableTop, { width: 50 });
      doc.text('Unit price', 340, tableTop, { width: 80 });
      doc.text('Total', 430, tableTop, { width: 90 });
      doc.moveDown(0.4);
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.3);

      doc.font('Helvetica');
      const rowHeight = 18;
      for (const line of lines) {
        const rowY = doc.y;
        const desc = String(line.description ?? '').slice(0, 45);
        const qty = Number(line.quantity);
        const unitPrice = Number(line.unit_price);
        const lineTotal = Number(line.line_total);
        doc.text(desc, 50, rowY, { width: 220 });
        doc.text(String(qty), 280, rowY, { width: 50 });
        doc.text(`${unitPrice.toFixed(2)} ${currency}`, 340, rowY, { width: 80 });
        doc.text(`${lineTotal.toFixed(2)} ${currency}`, 430, rowY, { width: 90 });
        doc.y = rowY + rowHeight;
      }
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);

      const summaryX = 350;
      const summaryY = doc.y;
      doc.text(`Subtotal:`, summaryX, summaryY, { width: 100 });
      doc.text(`${subtotal.toFixed(2)} ${currency}`, 430, summaryY, { width: 90 });
      doc.text(`Tax:`, summaryX, summaryY + 18, { width: 100 });
      doc.text(`${taxTotal.toFixed(2)} ${currency}`, 430, summaryY + 18, { width: 90 });
      doc.font('Helvetica-Bold');
      doc.text(`Total:`, summaryX, summaryY + 36, { width: 100 });
      doc.text(`${total.toFixed(2)} ${currency}`, 430, summaryY + 36, { width: 90 });

      doc.end();
    });
  }
}
