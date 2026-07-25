import PDFDocument from "pdfkit";

export function buildWinnerCertificate({ winnerName, teamName }) {
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const chunks = [];
  doc.on("data", (chunk) => chunks.push(chunk));

  doc.fontSize(28).text("IEEE RAS x IEEE CS Hackathon", { align: "center" });
  doc.moveDown();
  doc.fontSize(22).text("Winner Certificate", { align: "center" });
  doc.moveDown(2);
  doc.fontSize(16).text(`Awarded to ${winnerName}`, { align: "center" });
  doc.moveDown();
  doc.text(`Team: ${teamName}`, { align: "center" });
  doc.moveDown();
  doc.text(`Date: ${new Date().toLocaleDateString("en-IN")}`, { align: "center" });
  doc.end();

  return new Promise((resolve) => {
    doc.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
  });
}
