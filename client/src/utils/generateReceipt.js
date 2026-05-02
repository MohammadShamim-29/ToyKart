import { formatBdt } from "./formatCurrency";
import { companyDetails } from "./companyDetails";

export const generateReceipt = (order) => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const orderId = order.orderNumber || String(order._id || order.id || "").slice(-8).toUpperCase();
  const black = [0, 0, 0];
  const darkGrey = [40, 40, 40];
  const grey = [120, 120, 120];
  const lightGrey = [240, 240, 240];

  // Helper for right aligned text
  const textRight = (text, y, fontSize = 10, fontStyle = "normal", color = black) => {
    doc.setFontSize(fontSize);
    doc.setFont("helvetica", fontStyle);
    doc.setTextColor(...color);
    const textWidth = doc.getTextWidth(String(text));
    doc.text(String(text), 190 - textWidth, y);
  };

  // --- TOP BAR (Subtle line) ---
  doc.setDrawColor(...lightGrey);
  doc.setLineWidth(0.1);
  doc.line(20, 15, 190, 15);

  // --- HEADER SECTION ---
  doc.setFontSize(24);
  doc.setTextColor(...black);
  doc.setFont("helvetica", "bold");
  doc.text("ToyKart", 20, 30);

  doc.setFontSize(10);
  doc.setTextColor(...grey);
  doc.setFont("helvetica", "normal");
  doc.text("OFFICIAL INVOICE", 20, 36);

  // Company Details (Dynamic)
  doc.setFontSize(9);
  doc.setTextColor(...darkGrey);
  textRight(companyDetails.name, 30, 10, "bold", black);
  textRight(companyDetails.address, 36, 9, "normal", darkGrey);
  textRight(`Phone: ${companyDetails.phone}`, 41, 9, "normal", darkGrey);
  textRight(`Email: ${companyDetails.email}`, 46, 9, "normal", darkGrey);

  // --- INFO GRID ---
  doc.setDrawColor(...lightGrey);
  doc.setFillColor(...lightGrey);
  doc.rect(20, 60, 170, 1, "F"); // Subtle divider

  let currentY = 75;
  
  // Column 1: Order Meta
  doc.setFontSize(8);
  doc.setTextColor(...grey);
  doc.text("INVOICE DETAILS", 20, currentY);
  
  doc.setFontSize(10);
  doc.setTextColor(...black);
  doc.setFont("helvetica", "bold");
  doc.text(`ID: #${orderId}`, 20, currentY + 7);
  doc.setFont("helvetica", "normal");
  doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString("en-GB")}`, 20, currentY + 12);
  doc.text(`Status: ${String(order.status || "Pending").toUpperCase()}`, 20, currentY + 17);

  // Column 2: Customer Intro
  doc.setFontSize(8);
  doc.setTextColor(...grey);
  doc.text("BILL TO / SHIP TO", 80, currentY);

  const address = order.shippingAddress || {};
  doc.setFontSize(10);
  doc.setTextColor(...black);
  doc.setFont("helvetica", "bold");
  doc.text(address.firstName || order.user?.name || "Customer", 80, currentY + 7);
  doc.setFont("helvetica", "normal");
  doc.text(address.email || order.user?.email || "—", 80, currentY + 12);
  doc.text(address.phone || "—", 80, currentY + 17);

  // Column 3: Address Details
  doc.setFontSize(8);
  doc.setTextColor(...grey);
  doc.text("DELIVERY ADDRESS", 140, currentY);
  
  doc.setFontSize(9);
  doc.setTextColor(...black);
  const splitAddress = doc.splitTextToSize(address.address || "—", 50);
  doc.text(splitAddress, 140, currentY + 7);
  doc.text(`${address.city || ""}, ${address.country || ""}`, 140, currentY + 7 + (splitAddress.length * 4));

  currentY += 40;

  // --- ITEMS TABLE ---
  const tableRows = (order.orderItems || []).map((item) => [
    item.name,
    item.qty,
    formatBdt(item.price),
    formatBdt(item.qty * item.price)
  ]);

  doc.autoTable({
    startY: currentY,
    head: [["Item Description", "Qty", "Price", "Amount"]],
    body: tableRows,
    theme: "plain",
    headStyles: { 
      textColor: black, 
      fontStyle: "bold",
      halign: 'left',
      fontSize: 8,
      lineWidth: { bottom: 0.2 },
      lineColor: lightGrey
    },
    styles: { 
      fontSize: 9,
      cellPadding: 4,
      textColor: darkGrey,
      valign: 'middle'
    },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { halign: "center" },
      2: { halign: "right" },
      3: { halign: "right" }
    },
    margin: { left: 20, right: 20 }
  });

  // --- SUMMARY SECTION ---
  currentY = doc.lastAutoTable.finalY + 15;
  
  const drawRow = (label, value, y, isTotal = false) => {
    doc.setFontSize(isTotal ? 12 : 9);
    doc.setFont("helvetica", isTotal ? "bold" : "normal");
    doc.setTextColor(...(isTotal ? black : grey));
    doc.text(label, 130, y);
    textRight(value, y, isTotal ? 12 : 9, isTotal ? "bold" : "normal", black);
  };

  drawRow("Subtotal", formatBdt(order.itemsPrice || 0), currentY);
  drawRow("Shipping Fee", formatBdt(order.shippingPrice || 0), currentY + 6);
  
  doc.setDrawColor(...lightGrey);
  doc.line(130, currentY + 10, 190, currentY + 10);
  
  drawRow("TOTAL", formatBdt(order.totalPrice || 0), currentY + 18, true);

  // --- FOOTER ---
  const footerY = 280;
  doc.setFontSize(8);
  doc.setTextColor(...grey);
  doc.text(`Thank you for your order. Visit us at ${companyDetails.website}`, 20, footerY);
  textRight("Page 1 of 1", footerY);

  doc.save(`Invoice_${orderId}.pdf`);
};
