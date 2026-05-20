import { useState, useEffect } from "react";
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Button, 
  CircularProgress,
  Stack,
  Divider
} from "@mui/material";
import { 
  TrendingUp, 
  ShoppingBag, 
  Layers, 
  FileDown,
  BarChart as BarChartIcon
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import api from "../api";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

import { Link as RouterLink } from "react-router-dom";

const DashboardStat = ({ title, value, icon: Icon, color = "primary.main", to }) => (
  <Card 
    component={to ? RouterLink : "div"}
    to={to}
    sx={{ 
      height: '100%', 
      borderRadius: 3, 
      boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
      textDecoration: 'none',
      color: 'inherit',
      transition: 'transform 0.2s',
      '&:hover': to ? { transform: 'translateY(-4px)', cursor: 'pointer' } : {}
    }}
  >
    <CardContent>
      <Stack direction="row" spacing={2} alignItems="center">
        <Box sx={{ 
          p: 1.5, 
          borderRadius: 2, 
          bgcolor: `${color}15`, 
          color: color,
          display: 'flex'
        }}>
          <Icon size={24} />
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            {title}
          </Typography>
          <Typography variant="h5" fontWeight={700}>
            ৳{typeof value === 'number' ? value.toLocaleString() : value}
          </Typography>
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

export const AdminDashboardRa = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("admin/orders/analytics");
        setData(data);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch analytics", err);
        setError(err.message || "Could not load dashboard statistics.");
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const downloadPDFReport = () => {
    if (!data) return;

    const doc = jsPDF();
    const now = new Date();

    // Title
    doc.setFontSize(20);
    doc.text("ToyKart Sales Report", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${now.toLocaleString()}`, 14, 30);

    // Summary
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Sales Summary", 14, 45);
    
    doc.autoTable({
      startY: 50,
      head: [["Metric", "Value"]],
      body: [
        ["Total Sales", `৳${data.totalSales.toLocaleString()}`],
        ["Today's Sales", `৳${data.todaySales.toLocaleString()}`],
        ["Total Categories", data.salesByCategory.length.toString()],
      ],
      theme: 'striped',
    });

    // Category Table
    doc.text("Sales by Category", 14, doc.lastAutoTable.finalY + 15);
    
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 20,
      head: [["Category", "Total Sales", "Order Count"]],
      body: data.salesByCategory.map(item => [
        item._id, 
        `৳${item.totalAmount.toLocaleString()}`,
        item.orderCount.toString()
      ]),
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] }
    });

    doc.save(`ToyKart_Report_${now.toISOString().split('T')[0]}.pdf`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
        <Button onClick={() => window.location.reload()} sx={{ mt: 2 }}>Retry</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 1 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ mb: 0.5 }}>
            Executive Dashboard
          </Typography>
          <Typography color="text.secondary">
            Real-time insights and business analytics for ToyKart.
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<FileDown size={18} />}
          onClick={downloadPDFReport}
          sx={{ borderRadius: 2, px: 3 }}
        >
          Export PDF Report
        </Button>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <DashboardStat 
            title="Today's Sales" 
            value={data.todaySales} 
            icon={TrendingUp} 
            color="#0d9488" 
            to="/admin/orders"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <DashboardStat 
            title="Total Revenue" 
            value={data.totalSales} 
            icon={ShoppingBag} 
            color="#2563eb" 
            to="/admin/orders"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <DashboardStat 
            title="Categories Performance" 
            value={data.salesByCategory.length} 
            icon={Layers} 
            color="#7c3aed" 
            to="/admin/categories"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3, px: 1 }}>
              <BarChartIcon size={20} color="#64748b" />
              <Typography variant="h6" fontWeight={700}>Sales by Product Category</Typography>
            </Stack>
            <Box sx={{ height: 400, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.salesByCategory} margin={{ top: 10, right: 30, left: 10, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="_id" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickFormatter={(val) => `৳${val}`}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="totalAmount" radius={[6, 6, 0, 0]} name="Sales (BDT)">
                    {data.salesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Card>
        </Grid>
        
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', p: 1 }}>
            <Typography variant="h6" fontWeight={700} sx={{ p: 2 }}>Top Performing Categories</Typography>
            <Divider />
            <Box sx={{ mt: 1 }}>
              {data.salesByCategory.slice(0, 5).map((cat, idx) => (
                <Box key={cat._id} sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: COLORS[idx % COLORS.length] }} />
                    <Typography variant="body2" fontWeight={600}>{cat._id}</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {cat.orderCount} Orders
                  </Typography>
                </Box>
              ))}
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
