import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatBdt } from "./dashboardUtils";

function table(doc, options) {
  autoTable(doc, options);
  return doc.lastAutoTable?.finalY ?? 40;
}

/**
 * @param {Record<string, unknown> | null | undefined} data
 * @returns {string} filename written
 */
export function exportDashboardPdf(data) {
  if (!data?.kpis) {
    throw new Error("Dashboard data is not loaded yet. Refresh and try again.");
  }

  const doc = new jsPDF();
  const k = data.kpis;
  const now = new Date();
  const margin = 14;

  doc.setFontSize(20);
  doc.text("ToyKart Executive Report", margin, 20);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated: ${now.toLocaleString()}`, margin, 28);
  if (data.generatedAt) {
    doc.text(`Dashboard data: ${new Date(data.generatedAt).toLocaleString()}`, margin, 34);
  }

  doc.setTextColor(0);
  doc.setFontSize(14);
  doc.text("Revenue & orders", margin, 44);

  let y = table(doc, {
    startY: 48,
    head: [["Metric", "Value"]],
    body: [
      ["Revenue today", formatBdt(k.revenueToday)],
      ["Revenue this week", formatBdt(k.revenueWeek)],
      ["Revenue this month", formatBdt(k.revenueMonth)],
      ["Total revenue", formatBdt(k.revenueTotal)],
      ["Orders today", String(k.ordersToday ?? 0)],
      ["Pending orders", String(k.pendingOrders ?? 0)],
      ["Awaiting shipment", String(k.awaitingShipment ?? 0)],
      ["Returns awaiting", String(k.returnsAwaiting ?? 0)],
      ["Avg order value (month)", formatBdt(k.aovMonth ?? 0)]
    ],
    theme: "striped",
    headStyles: { fillColor: [37, 99, 235] },
    margin: { left: margin, right: margin }
  });

  const alerts = data.alerts || [];
  if (alerts.length > 0) {
    y = addSection(doc, "Operational alerts", y + 10, margin);
    y = table(doc, {
      startY: y + 4,
      head: [["Alert", "Count"]],
      body: alerts.map((a) => [a.label, String(a.count)]),
      theme: "grid",
      margin: { left: margin, right: margin }
    });
  }

  const categories = (data.revenue?.salesByCategory || []).slice(0, 12);
  if (categories.length > 0) {
    y = addSection(doc, "Sales by category", y + 10, margin);
    y = table(doc, {
      startY: y + 4,
      head: [["Category", "Sales", "Orders"]],
      body: categories.map((c) => [c.category, formatBdt(c.totalAmount), String(c.orderCount)]),
      margin: { left: margin, right: margin }
    });
  }

  const topSold = data.inventory?.topSoldProducts || [];
  if (topSold.length > 0) {
    y = ensureSpace(doc, y + 10, 50, margin);
    y = addSection(doc, "Top sold products (delivered)", y, margin);
    y = table(doc, {
      startY: y + 4,
      head: [["Product", "Units sold", "Revenue"]],
      body: topSold.map((p) => [p.name, String(p.unitsSold), formatBdt(p.revenue)]),
      margin: { left: margin, right: margin }
    });
  }

  const byCat = data.inventory?.topSoldByCategory || [];
  if (byCat.length > 0) {
    y = ensureSpace(doc, y + 10, 50, margin);
    y = addSection(doc, "Top sold by category", y, margin);
    table(doc, {
      startY: y + 4,
      head: [["Category", "Product", "Units sold"]],
      body: byCat.map((row) => [
        row.categoryName,
        row.product?.name || "—",
        String(row.product?.unitsSold ?? 0)
      ]),
      margin: { left: margin, right: margin }
    });
  }

  const reports = data.reports;
  if (reports) {
    const monthly = reports.monthlySales || [];
    if (monthly.length > 0) {
      y = ensureSpace(doc, doc.lastAutoTable?.finalY + 10 || y + 10, 60, margin);
      y = addSection(doc, "Monthly sales (12 months)", y, margin);
      y = table(doc, {
        startY: y + 4,
        head: [["Month", "Revenue", "Orders"]],
        body: monthly.map((r) => [r.month, formatBdt(r.revenue), String(r.orders)]),
        margin: { left: margin, right: margin }
      });
    }

    const weeklyCat = reports.weeklyCategorySales || [];
    if (weeklyCat.length > 0) {
      y = ensureSpace(doc, doc.lastAutoTable?.finalY + 10 || y + 10, 60, margin);
      y = addSection(doc, "Weekly sales by category (8 weeks)", y, margin);
      const weeks = [...new Set(weeklyCat.map((r) => r.week))].sort();
      const categories = [...new Set(weeklyCat.map((r) => r.category))];
      const body = weeks.map((week) => {
        const row = [week];
        categories.forEach((cat) => {
          const item = weeklyCat.find((r) => r.week === week && r.category === cat);
          row.push(item ? formatBdt(item.revenue) : "—");
        });
        return row;
      });
      y = table(doc, {
        startY: y + 4,
        head: ["Week", ...categories],
        body,
        margin: { left: margin, right: margin }
      });
    }

    const weeklyProd = reports.weeklyProductSales || [];
    if (weeklyProd.length > 0) {
      y = ensureSpace(doc, doc.lastAutoTable?.finalY + 10 || y + 10, 60, margin);
      y = addSection(doc, "Weekly sales by product - top 15 (8 weeks)", y, margin);
      const weeks = [...new Set(weeklyProd.map((r) => r.week))].sort();
      const products = [...new Set(weeklyProd.map((r) => r.product))].slice(0, 15);
      const body = products.map((product) => {
        const prodRows = weeklyProd.filter((r) => r.product === product);
        const total = prodRows.reduce((s, r) => s + r.revenue, 0);
        const row = [product];
        weeks.forEach((week) => {
          const item = prodRows.find((r) => r.week === week);
          row.push(item ? formatBdt(item.revenue) : "—");
        });
        row.push(formatBdt(total));
        return row;
      });
      table(doc, {
        startY: y + 4,
        head: ["Product", ...weeks, "Total"],
        body,
        margin: { left: margin, right: margin }
      });
    }
  }

  const customers = data.customers;
  if (customers) {
    y = ensureSpace(doc, doc.lastAutoTable?.finalY + 10 || y + 10, 40, margin);
    y = addSection(doc, "Customers", y, margin);
    table(doc, {
      startY: y + 4,
      head: [["Metric", "Value"]],
      body: [
        ["Total customers", String(customers.total ?? 0)],
        ["New this week", String(customers.newThisWeek ?? 0)],
        ["Repeat customers", String(customers.repeatCustomers ?? 0)]
      ],
      margin: { left: margin, right: margin }
    });
  }

  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text("ToyKart — confidential internal report", margin, doc.internal.pageSize.getHeight() - 10);

  const filename = `ToyKart_Executive_${now.toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
  return filename;
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

function ensureSpace(doc, y, needed, margin) {
  if (y + needed > doc.internal.pageSize.getHeight() - 20) {
    doc.addPage();
    return margin;
  }
  return y;
}
