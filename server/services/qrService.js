import QRCode from "qrcode";

export function generateQrDataUrl(payload) {
  return QRCode.toDataURL(payload, { margin: 1, width: 300 });
}
