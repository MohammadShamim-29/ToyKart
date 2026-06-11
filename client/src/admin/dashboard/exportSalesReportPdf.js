import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatBdt } from "./dashboardUtils";

function table(doc, options) {
  autoTable(doc, options);
  return doc.lastAutoTable?.finalY ?? 40;
}

function addSection(doc, title, y, margin) {
  if (y > doc.internal.pageSize.getHeight() - 40) {
    doc.addPage();
    y = margin;
  }
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text(title, margin, y);
  return y;
}

export function exportSalesReportPdf(data) {
  if (!data?.reports) {
    throw new Error("Sales report data is not loaded yet. Refresh and try again.");
  }

  const doc = new jsPDF();
  const now = new Date();
  const margin = 14;

  doc.setFontSize(20);
  doc.text("ToyKart Sales Report", margin, 20);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated: ${now.toLocaleString()}`, margin, 28);
  if (data.generatedAt) {
    doc.text(`Data: ${new Date(data.generatedAt).toLocaleString()}`, margin, 34);
  }

  doc.setTextColor(0);
  const reports = data.reports || {};
  const k = data.kpis || {};
  const revenue = data.revenue || {};
  const inventory = data.inventory || {};
  let y = margin + 8;

  y = addSection(doc, "Summary", y + 6, margin);
  const totalOrders = (reports.monthlySales || []).reduce((s, r) => s + (r.orders || 0), 0);
  y = table(doc, {
    startY: y + 4,
    head: [["Metric", "Value"]],
    body: [
      ["Total revenue", formatBdt(k.revenueTotal ?? 0)],
      ["Revenue this month", formatBdt(k.revenueMonth ?? 0)],
      ["Revenue today", formatBdt(k.revenueToday ?? 0)],
      ["Total paid orders", String(totalOrders)],
      ["Orders today", String(k.ordersToday ?? 0)],
      ["Avg order value (month)", formatBdt(k.aovMonth ?? 0)]
    ],
    theme: "striped",
    headStyles: { fillColor: [37, 99, 235] },
    margin: { left: margin, right: margin }
  });

  const categories = revenue.salesByCategory || [];
  if (categories.length > 0) {
    y = addSection(doc, "Sales by category (all time)", y + 8, margin);
    y = table(doc, {
      startY: y + 4,
      head: [["Category", "Sales", "Orders"]],
      body: categories.map((c) => [c.category || "Unknown", formatBdt(c.totalAmount || 0), String(c.orderCount || 0)]),
      theme: "striped",
      headStyles: { fillColor: [37, 99, 235] },
      margin: { left: margin, right: margin }
    });
  }

  const topSold = inventory.topSoldProducts || [];
  if (topSold.length > 0) {
    y = addSection(doc, "Top sold products (delivered)", y + 8, margin);
    y = table(doc, {
      startY: y + 4,
      head: [["Product", "Units sold", "Revenue"]],
      body: topSold.slice(0, 15).map((p) => [p.name || "Unknown", String(p.unitsSold || 0), formatBdt(p.revenue || 0)]),
      theme: "striped",
      headStyles: { fillColor: [37, 99, 235] },
      margin: { left: margin, right: margin }
    });
  }

  const monthly = reports.monthlySales || [];
  if (monthly.length > 0) {
    y = addSection(doc, "Monthly sales (12 months)", y + 8, margin);
    y = table(doc, {
      startY: y + 4,
      head: [["Month", "Revenue", "Orders"]],
      body: monthly.map((r) => [r.month || "", formatBdt(r.revenue || 0), String(r.orders || 0)]),
      theme: "striped",
      headStyles: { fillColor: [37, 99, 235] },
      margin: { left: margin, right: margin }
    });
  }

  const weeklyCat = reports.weeklyCategorySales || [];
  if (weeklyCat.length > 0) {
    y = addSection(doc, "Weekly sales by category (8 weeks)", y + 8, margin);
    const weeks = [...new Set(weeklyCat.map((r) => r.week))].sort();
    const catNames = [...new Set(weeklyCat.map((r) => r.category))];
    const body = weeks.map((week) => {
      const row = [week];
      catNames.forEach((cat) => {
        const item = weeklyCat.find((r) => r.week === week && r.category === cat);
        row.push(item ? formatBdt(item.revenue || 0) : "—");
      });
      return row;
    });
    y = table(doc, {
      startY: y + 4,
      head: ["Week", ...catNames],
      body,
      theme: "striped",
      headStyles: { fillColor: [37, 99, 235] },
      margin: { left: margin, right: margin }
    });
  }

  const weeklyProd = reports.weeklyProductSales || [];
  if (weeklyProd.length > 0) {
    y = addSection(doc, "Weekly sales by product - top 15 (8 weeks)", y + 8, margin);
    const weeks = [...new Set(weeklyProd.map((r) => r.week))].sort();
    const products = [...new Set(weeklyProd.map((r) => r.product))].slice(0, 15);
    const body = products.map((product) => {
      const prodRows = weeklyProd.filter((r) => r.product === product);
      const total = prodRows.reduce((s, r) => s + (r.revenue || 0), 0);
      const row = [product];
      weeks.forEach((week) => {
        const item = prodRows.find((r) => r.week === week);
        row.push(item ? formatBdt(item.revenue || 0) : "—");
      });
      row.push(formatBdt(total));
      return row;
    });
    table(doc, {
      startY: y + 4,
      head: ["Product", ...weeks, "Total"],
      body,
      theme: "striped",
      headStyles: { fillColor: [37, 99, 235] },
      margin: { left: margin, right: margin }
    });
  }

  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text("ToyKart — confidential sales report", margin, doc.internal.pageSize.getHeight() - 10);

  const filename = `ToyKart_Sales_Report_${now.toISOString().slice(0, 10)}.pdf`;
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return filename;
}
