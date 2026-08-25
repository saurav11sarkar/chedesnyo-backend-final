import PDFDocument from 'pdfkit';
import Payment from '../payment/payment.model';
import Promotion from '../promotion/promotion.model';
import AppError from '../../error/appError';

const generateInvoicePdf = async (paymentId: string, userId: string): Promise<Buffer> => {
  const payment = await Payment.findById(paymentId)
    .populate('user', 'firstName lastName email businessName companyAddress kvkVatNumber vatNumber')
    .populate({ path: 'assigment', select: 'title budget' })
    .populate({ path: 'course', select: 'title price discount' });

  if (!payment) throw new AppError(404, 'Payment not found');

  const pUser = payment.user as any;
  if (pUser._id.toString() !== userId && payment.user.toString() !== userId) {
    const assigmentOwner = (payment.assigment as any)?.user?.toString();
    const courseOwner = (payment.course as any)?.createdBy?.toString();
    if (assigmentOwner !== userId && courseOwner !== userId) {
      throw new AppError(403, 'Not authorized');
    }
  }

  const doc = new PDFDocument({ margin: 50 });
  const buffers: Buffer[] = [];

  return new Promise((resolve, reject) => {
    doc.on('data', (chunk: Buffer) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    doc.fontSize(20).text('INVOICE', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text('DealClosedPartner.nl', { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(10);
    doc.text(`Invoice Date: ${payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : new Date(payment.createdAt as any).toLocaleDateString()}`);
    doc.text(`Invoice #: INV-${payment._id.toString().slice(-8).toUpperCase()}`);
    doc.text(`Transaction ID: ${payment.transactionId || payment.stripePaymentIntentId || 'N/A'}`);
    doc.moveDown();

    doc.text(`Bill To: ${pUser.firstName} ${pUser.lastName || ''}`);
    doc.text(`Email: ${pUser.email}`);
    if (pUser.businessName) doc.text(`Company: ${pUser.businessName}`);
    if (pUser.companyAddress) doc.text(`Address: ${pUser.companyAddress}`);
    if (pUser.kvkVatNumber) doc.text(`KvK/VAT: ${pUser.kvkVatNumber}`);
    doc.moveDown(2);

    doc.fontSize(11).text('Description', 50, doc.y, { continued: true });
    doc.text('Amount', 400, doc.y, { align: 'right' });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    if (payment.assigment) {
      const a = payment.assigment as any;
      doc.fontSize(10).text(`Assignment: ${a.title}`, 50, doc.y, { continued: true });
      doc.text(`€${payment.amount.toFixed(2)}`, 400, doc.y, { align: 'right' });
    } else if (payment.course) {
      const c = payment.course as any;
      doc.fontSize(10).text(`Course: ${c.title}`, 50, doc.y, { continued: true });
      doc.text(`€${payment.amount.toFixed(2)}`, 400, doc.y, { align: 'right' });
    }

    doc.moveDown(2);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Total: €${payment.amount.toFixed(2)}`, { align: 'right' });
    doc.moveDown();
    doc.fontSize(10).text(`Status: ${payment.status.toUpperCase()}`, { align: 'right' });
    doc.moveDown(3);

    doc.fontSize(8).text('This invoice was generated automatically by DealClosedPartner.nl', { align: 'center' });

    doc.end();
  });
};

const getMyInvoices = async (userId: string) => {
  const payments = await Payment.find({
    $or: [{ user: userId }, { status: 'approved' }]
  })
    .populate({ path: 'assigment', select: 'title user' })
    .populate({ path: 'course', select: 'title createdBy' })
    .sort({ createdAt: -1 })
    .lean();

  const filtered = payments.filter((p: any) => {
    return (
      p.user?.toString() === userId ||
      p.assigment?.user?.toString() === userId ||
      p.course?.createdBy?.toString() === userId
    );
  });

  return filtered.map((p: any) => ({
    _id: p._id,
    type: p.assigment ? 'assignment' : p.course ? 'course' : 'other',
    title: p.assigment?.title || p.course?.title || 'Payment',
    amount: p.amount,
    status: p.status,
    date: p.paymentDate || p.createdAt,
    invoiceNumber: `INV-${p._id.toString().slice(-8).toUpperCase()}`,
  }));
};

export const invoiceService = {
  generateInvoicePdf,
  getMyInvoices,
};
