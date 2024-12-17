const { PDFDocument } = require('pdf-lib');
const fs = require('fs');


const compressPDF = async (inputPath, outputPath) => {
  const existingPdfBytes = fs.readFileSync(inputPath);

  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const pdfBytes = await pdfDoc.save({ useObjectStreams: false });

  fs.writeFileSync(outputPath, pdfBytes);
  console.log('PDF compressed');
};


const inputPdfPath = 'uploads/input-file.pdf';
const outputPdfPath = 'uploads/output-file.pdf';
compressPDF(inputPdfPath, outputPdfPath);
