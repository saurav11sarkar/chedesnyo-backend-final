import catchAsync from '../../utils/catchAsycn';
import { invoiceService } from './invoice.service';

const downloadInvoice = catchAsync(async (req, res) => {
  const buffer = await invoiceService.generateInvoicePdf(req.params.paymentId, req.user.id);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=invoice-${req.params.paymentId}.pdf`);
  res.send(buffer);
});

const getMyInvoices = catchAsync(async (req, res) => {
  const result = await invoiceService.getMyInvoices(req.user.id);
  res.status(200).json({ success: true, message: 'Invoices fetched', data: result });
});

export const invoiceController = {
  downloadInvoice,
  getMyInvoices,
};
