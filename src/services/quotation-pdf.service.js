import PDFDocument from "pdfkit";

export const generateQuotationPdf = (quote, res) => {
  const doc = new PDFDocument({
    size: "A4",
    margin: 50,
  });

  res.setHeader("Content-Type", "application/pdf");

  res.setHeader(
    "Content-Disposition",
    `attachment; filename=${quote.quote_no}.pdf`
  );

  doc.pipe(res);

  // Title
  doc
    .fontSize(22)
    .font("Helvetica-Bold")
    .text("INDUSTRIAL ALL RISK QUOTATION", {
      align: "center",
    });

  doc.moveDown(2);

  // Customer Details
  doc
    .fontSize(14)
    .font("Helvetica-Bold")
    .text("Customer Details");

  doc.moveDown(0.5);

  doc
    .font("Helvetica")
    .fontSize(11)
    .text(`Quote No : ${quote.quote_no}`)
    .text(`Customer : ${quote.customer_name}`)
    .text(`Address : ${quote.address}`)
    .text(`Pin Code : ${quote.pin_code}`)
    .text(`Risk Code : ${quote.risk_code}`)
    .text(`Occupancy : ${quote.occupancy}`);

  doc.moveDown(2);

  // Sum Insured
  doc
    .fontSize(14)
    .font("Helvetica-Bold")
    .text("Sum Insured");

  doc.moveDown();

  row(doc, "Building", quote.building_si);
  row(doc, "Plant & Machinery", quote.plant_machinery_si);
  row(doc, "Stock", quote.stock_si);
  row(doc, "FFF", quote.fff_si);
  row(doc, "Other Contents", quote.other_contents_si);

  line(doc);

  row(doc, "TOTAL SI", quote.total_si, true);

  doc.moveDown(2);

  // Premium
  doc
    .fontSize(14)
    .font("Helvetica-Bold")
    .text("Premium Breakdown");

  doc.moveDown();

  row(doc, "Fire Premium", quote.fire_premium);
  row(doc, "BI Premium", quote.bi_premium);
  row(doc, "MB Premium", quote.mb_premium);
  row(doc, "MLOP Premium", quote.mlop_premium);

  line(doc);

  row(doc, "Net Premium", quote.net_premium);
  row(doc, "GST", quote.gst);

  line(doc);

  row(doc, "Gross Premium", quote.gross_premium, true);

  doc.end();
};

function money(value) {
  return Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function row(doc, label, value, bold = false) {
  const y = doc.y;

  doc.font(
    bold ? "Helvetica-Bold" : "Helvetica"
  );

  doc.text(label, 50, y);

  doc.text(`₹ ${money(value)}`, 350, y, {
    width: 150,
    align: "right",
  });

  doc.moveDown();
}

function line(doc) {
  const y = doc.y;

  doc
    .moveTo(50, y)
    .lineTo(550, y)
    .stroke();

  doc.moveDown();
}