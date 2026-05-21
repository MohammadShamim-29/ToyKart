import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import logoUrl from "../assets/toykart-logo.svg?url";
import { formatBdt } from "./formatCurrency";
import { companyDetails } from "./companyDetails";
import {
  orderNumberDisplay,
  orderStatusLabel,
  paymentMethodLabel,
  paymentStatusLabel
} from "./orderDisplay";

const BRAND = {
  primary: [255, 107, 157],
  accent: [167, 139, 250],
  ink: [30, 41, 59],
  muted: [100, 116, 139],
  line: [255, 228, 236],
  success: [13, 148, 136],
  surface: [255, 248, 240]
};

async function svgToPngDataUrl(url, width, height) {
  const res = await fetch(url);
  const svgText = await res.text();
  const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
  const objectUrl = URL.createObjectURL(blob);
  try {
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = 3;
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext("2d");
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = reject;
      img.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

const formatDateTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-BD", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
};

/**
 * @param {Record<string, unknown>} order
 */
export async function generateReceipt(order) {
  if (!order) return;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 16;
  const orderId = orderNumberDisplay(order);
  const address = order.shippingAddress || {};
  const items = Array.isArray(order.orderItems) ? order.orderItems : [];

  let logoData = null;
  try {
    logoData = await svgToPngDataUrl(logoUrl, 220, 52);
  } catch {
    logoData = null;
  }

  doc.setFillColor(...BRAND.primary);
  doc.rect(0, 0, pageW, 42, "F");
  doc.setFillColor(...BRAND.accent);
  doc.rect(pageW - 70, 0, 70, 42, "F");

  if (logoData) {
    doc.addImage(logoData, "PNG", margin, 10, 48, 11);
  } else {
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("ToyKart", margin, 20);
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("TAX INVOICE", pageW - margin, 18, { align: "right" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(companyDetails.tagline, pageW - margin, 25, { align: "right" });

  let y = 52;

  doc.setFillColor(...BRAND.surface);
  doc.roundedRect(margin, y, pageW - margin * 2, 28, 3, 3, "F");
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.muted);
  doc.text("INVOICE NO.", margin + 6, y + 9);
  doc.text("ORDER DATE", margin + 58, y + 9);
  doc.text("PAYMENT", margin + 110, y + 9);
  doc.text("ORDER STATUS", margin + 152, y + 9);

  doc.setFontSize(11);
  doc.setTextColor(...BRAND.ink);
  doc.setFont("helvetica", "bold");
  doc.text(`#${orderId}`, margin + 6, y + 18);
  doc.setFont("helvetica", "normal");
  doc.text(formatDateTime(order.createdAt), margin + 58, y + 18);
  doc.text(paymentMethodLabel(order.paymentMethod), margin + 110, y + 18);
  doc.text(orderStatusLabel(order.status), margin + 152, y + 18);

  doc.setFontSize(9);
  doc.setTextColor(...BRAND.muted);
  doc.text(`Payment status: ${paymentStatusLabel(order)}`, margin + 110, y + 24);

  y += 38;

  const colMid = margin + (pageW - margin * 2) / 2 + 4;

  doc.setFontSize(8);
  doc.setTextColor(...BRAND.primary);
  doc.setFont("helvetica", "bold");
  doc.text("FROM", margin, y);
  doc.text("BILL TO", colMid, y);
  y += 5;

  doc.setFontSize(9);
  doc.setTextColor(...BRAND.ink);
  doc.setFont("helvetica", "bold");
  doc.text(companyDetails.name, margin, y + 5);
  doc.text(address.firstName || "Customer", colMid, y + 5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BRAND.muted);
  doc.text(companyDetails.address, margin, y + 10, { maxWidth: 78 });
  doc.text(address.email || order.user?.email || "—", colMid, y + 10, { maxWidth: 78 });
  doc.text(`Phone: ${companyDetails.phone}`, margin, y + 15);
  doc.text(`Phone: ${address.phone || "—"}`, colMid, y + 15);
  doc.text(companyDetails.email, margin, y + 20);
  doc.text(companyDetails.website, margin, y + 25);

  y += 34;

  doc.setFontSize(8);
  doc.setTextColor(...BRAND.primary);
  doc.setFont("helvetica", "bold");
  doc.text("DELIVERY ADDRESS", margin, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BRAND.ink);
  doc.setFontSize(9);
  const addrLines = doc.splitTextToSize(
    [address.address, `${address.city || ""}${address.postalCode ? ` ${address.postalCode}` : ""}`, address.country]
      .filter(Boolean)
      .join(", ") || "—",
    pageW - margin * 2 - 8
  );
  doc.text(addrLines, margin + 4, y + 4);
  if (address.orderNotes?.trim()) {
    y += 4 + addrLines.length * 4.5;
    doc.setTextColor(...BRAND.muted);
    doc.text(`Notes: ${address.orderNotes.trim()}`, margin + 4, y + 4, { maxWidth: pageW - margin * 2 - 8 });
    y += 8;
  } else {
    y += 4 + addrLines.length * 4.5;
  }

  y += 6;

  const tableBody = items.map((item) => [
    item.colorName ? `${item.name}\nColor: ${item.colorName}` : item.name,
    item.variantSku || item.sku || "—",
    String(item.qty ?? 0),
    formatBdt(item.price),
    formatBdt((Number(item.qty) || 0) * (Number(item.price) || 0))
  ]);

  autoTable(doc, {
    startY: y,
    head: [["Description", "SKU", "Qty", "Unit price", "Amount"]],
    body: tableBody.length ? tableBody : [["—", "—", "0", formatBdt(0), formatBdt(0)]],
    theme: "grid",
    headStyles: {
      fillColor: BRAND.primary,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      cellPadding: 3
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 3.5,
      textColor: BRAND.ink,
      lineColor: BRAND.line,
      lineWidth: 0.1
    },
    columnStyles: {
      0: { cellWidth: 72 },
      1: { cellWidth: 28 },
      2: { halign: "center", cellWidth: 14 },
      3: { halign: "right", cellWidth: 28 },
      4: { halign: "right", cellWidth: 32 }
    },
    margin: { left: margin, right: margin }
  });

  y = doc.lastAutoTable.finalY + 10;
  const summaryX = pageW - margin - 62;

  doc.setDrawColor(...BRAND.line);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(summaryX - 4, y, 66, 38, 2, 2, "FD");

  const row = (label, value, offset, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 11 : 9);
    doc.setTextColor(...(bold ? BRAND.ink : BRAND.muted));
    doc.text(label, summaryX, y + offset);
    doc.setTextColor(...BRAND.ink);
    doc.text(value, pageW - margin, y + offset, { align: "right" });
  };

  row("Subtotal", formatBdt(order.itemsPrice || 0), 6);
  row("Shipping", formatBdt(order.shippingPrice || 0), 12);
  row("Tax", formatBdt(order.taxPrice || 0), 18);
  doc.setDrawColor(...BRAND.line);
  doc.line(summaryX, y + 22, pageW - margin, y + 22);
  row("Total due", formatBdt(order.totalPrice || 0), 30, true);

  const footerY = 278;
  doc.setDrawColor(...BRAND.line);
  doc.line(margin, footerY - 8, pageW - margin, footerY - 8);
  doc.setFontSize(7.5);
  doc.setTextColor(...BRAND.muted);
  doc.text(
    "Thank you for shopping with ToyKart. This invoice was generated electronically and is valid without a physical signature.",
    margin,
    footerY,
    { maxWidth: pageW - margin * 2 }
  );
  doc.text(`Questions? ${companyDetails.email} · ${companyDetails.phone}`, margin, footerY + 8);
  doc.text(`Page 1 of 1 · ${formatDateTime(new Date())}`, pageW - margin, footerY + 8, { align: "right" });

  doc.save(`ToyKart-Invoice-${orderId}.pdf`);
}
