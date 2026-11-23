import PDFDocument from "pdfkit";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class InvoiceService {
  /**
   * Generates a genuine PDF invoice and streams it to a writable stream (e.g. res).
   * @param {Object} invoice
   * @param {Object} order
   * @param {WritableStream} outputStream
   */
  generatePdfStream(invoice, order, outputStream) {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    doc.pipe(outputStream);

    // Header Branding
    doc
      .fillColor("#0f172a")
      .fontSize(24)
      .font("Helvetica-Bold")
      .text("EventSphere", 50, 50);

    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#64748b")
      .text("Premier Expo & Trade Show Management", 50, 78)
      .text("Islamabad / Karachi / Lahore, Pakistan", 50, 92)
      .text("support@eventsphere.io · www.eventsphere.io", 50, 106);

    // Invoice Status Badge
    const statusText = invoice.paymentStatus || "PAID";
    const statusColor = statusText === "PAID" ? "#059669" : "#d97706";
    doc
      .rect(420, 50, 125, 30)
      .fillAndStroke(statusColor === "#059669" ? "#ecfdf5" : "#fef3c7", statusColor);

    doc
      .fillColor(statusColor)
      .fontSize(12)
      .font("Helvetica-Bold")
      .text(statusText, 420, 59, { width: 125, align: "center" });

    // Details Grid
    doc.moveTo(50, 135).lineTo(545, 135).strokeColor("#e2e8f0").stroke();

    const topDetailsY = 150;
    doc
      .fillColor("#64748b")
      .fontSize(9)
      .font("Helvetica-Bold")
      .text("INVOICE TO:", 50, topDetailsY)
      .text("INVOICE DETAILS:", 350, topDetailsY);

    const b = invoice.billingDetails || {};
    doc
      .fillColor("#0f172a")
      .fontSize(10)
      .font("Helvetica-Bold")
      .text(b.name || "Customer", 50, topDetailsY + 15)
      .font("Helvetica")
      .fillColor("#475569")
      .text(b.company || "", 50, topDetailsY + 30)
      .text(b.email || "", 50, topDetailsY + 44)
      .text(b.phone || "", 50, topDetailsY + 58)
      .text(`${b.city || "Karachi"}, ${b.country || "Pakistan"}`, 50, topDetailsY + 72);

    doc
      .fillColor("#475569")
      .fontSize(10)
      .font("Helvetica")
      .text(`Invoice No: ${invoice.invoiceNumber}`, 350, topDetailsY + 15)
      .text(`Order No: ${order?.orderNumber || "N/A"}`, 350, topDetailsY + 30)
      .text(`Issue Date: ${new Date(invoice.issuedAt).toLocaleDateString("en-PK", { dateStyle: "medium" })}`, 350, topDetailsY + 44)
      .text(`Currency: ${invoice.currency || "PKR"}`, 350, topDetailsY + 58)
      .text(`Booking Ref: ${order?.boothId || order?.registrationId || order?._id || "CONFIRMED"}`, 350, topDetailsY + 72);

    // Items Table Header
    const tableTop = 260;
    doc
      .rect(50, tableTop, 495, 24)
      .fill("#f8fafc");

    doc
      .fillColor("#475569")
      .fontSize(9)
      .font("Helvetica-Bold")
      .text("DESCRIPTION", 60, tableTop + 7)
      .text("QTY", 320, tableTop + 7, { width: 40, align: "center" })
      .text("UNIT PRICE", 370, tableTop + 7, { width: 80, align: "right" })
      .text("AMOUNT", 460, tableTop + 7, { width: 75, align: "right" });

    // Table rows
    let currentY = tableTop + 30;
    const items = invoice.items || [];

    items.forEach((item, index) => {
      doc
        .fillColor("#0f172a")
        .fontSize(9)
        .font("Helvetica")
        .text(item.description, 60, currentY, { width: 250 })
        .text(String(item.quantity || 1), 320, currentY, { width: 40, align: "center" })
        .text(`${invoice.currency} ${(item.unitPrice || 0).toLocaleString()}`, 370, currentY, { width: 80, align: "right" })
        .text(`${invoice.currency} ${(item.amount || 0).toLocaleString()}`, 460, currentY, { width: 75, align: "right" });

      currentY += 24;
      doc.moveTo(50, currentY).lineTo(545, currentY).strokeColor("#f1f5f9").stroke();
      currentY += 6;
    });

    // Summary Box
    currentY += 10;
    const summaryX = 330;
    doc
      .fillColor("#64748b")
      .fontSize(10)
      .font("Helvetica")
      .text("Subtotal:", summaryX, currentY)
      .text(`${invoice.currency} ${(invoice.subtotal || 0).toLocaleString()}`, 450, currentY, { width: 85, align: "right" });

    currentY += 18;
    if (invoice.discount > 0) {
      doc
        .text("Discount:", summaryX, currentY)
        .text(`- ${invoice.currency} ${(invoice.discount || 0).toLocaleString()}`, 450, currentY, { width: 85, align: "right" });
      currentY += 18;
    }

    if (invoice.tax > 0) {
      doc
        .text("Tax (5%):", summaryX, currentY)
        .text(`${invoice.currency} ${(invoice.tax || 0).toLocaleString()}`, 450, currentY, { width: 85, align: "right" });
      currentY += 18;
    }

    doc.moveTo(summaryX, currentY).lineTo(545, currentY).strokeColor("#e2e8f0").stroke();
    currentY += 8;

    doc
      .fillColor("#0f172a")
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Total Paid:", summaryX, currentY)
      .text(`${invoice.currency} ${(invoice.total || 0).toLocaleString()}`, 430, currentY, { width: 105, align: "right" });

    // Footer & Legal Notes
    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor("#94a3b8")
      .text(
        "This is an official system-generated invoice from EventSphere Management. All transactions are securely audited and verified under industry compliance standards. For inquiries, email billing@eventsphere.io.",
        50,
        720,
        { width: 495, align: "center" }
      );

    doc.end();
  }
}

export default new InvoiceService();
