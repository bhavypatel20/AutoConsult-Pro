import prisma from "@/lib/prisma";

export async function getAnalyticsData() {
  const cars = await prisma.car.findMany({ include: { expenses: true, deals: true } });
  const customers = await prisma.customer.findMany({ include: { deals: true } });
  const allExpenses = await prisma.expense.findMany();
  const deals = await prisma.deal.findMany();

  // 1. Profit Analytics
  let totalProfit = 0;
  let closedCars = 0;
  const monthlyProfitData = Array(12).fill(0);
  const monthlySalesData = Array(12).fill(0);

  cars.forEach(car => {
    if (car.status === "Sold" && car.finalSellPrice) {
      const carExpenses = car.expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const profit = car.finalSellPrice - (car.purchasePrice + carExpenses);
      totalProfit += profit;
      closedCars++;
      
      const dealDate = car.deals[0]?.dealDate || car.updatedAt;
      const month = new Date(dealDate).getMonth();
      monthlyProfitData[month] += profit;
      monthlySalesData[month] += 1;
    }
  });

  const profitPerCar = closedCars > 0 ? totalProfit / closedCars : 0;
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const profitTrend = monthlyProfitData.map((val, i) => ({ name: monthNames[i], profit: val }));
  const salesTrend = monthlySalesData.map((val, i) => ({ name: monthNames[i], sales: val }));

  // 2. Sales / Deals Analytics
  const totalInquiries = customers.length;
  const conversionRate = totalInquiries > 0 ? (deals.length / totalInquiries) * 100 : 0;

  // 3. Expense Analytics
  const totalExpenses = allExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const expenseCategoriesMap: Record<string, number> = {};
  allExpenses.forEach(exp => {
    expenseCategoriesMap[exp.expenseType] = (expenseCategoriesMap[exp.expenseType] || 0) + exp.amount;
  });
  const expensesByCategory = Object.keys(expenseCategoriesMap).map(k => ({ name: k, value: expenseCategoriesMap[k] }));

  // 4. Partner Analytics
  const partnerMap: Record<string, number> = {};
  allExpenses.forEach(exp => {
    partnerMap[exp.paidBy] = (partnerMap[exp.paidBy] || 0) + exp.amount;
  });
  const partnerExpenses = Object.keys(partnerMap).map(k => ({ name: k, value: partnerMap[k] }));

  // 5. Smart Insights (Warnings)
  const warnings: string[] = [];
  
  if (totalProfit < 0) warnings.push("CRITICAL: Overall business profit is currently negative.");
  
  cars.forEach(car => {
    if (car.status === "Available") {
      const daysOnLot = Math.floor((Date.now() - new Date(car.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      if (daysOnLot > 30) warnings.push(`Inventory Alert: ${car.year} ${car.brand} ${car.model} has been unsold for ${daysOnLot} days.`);
    }
    if (car.status === "Sold" && car.finalSellPrice) {
      const carExp = car.expenses.reduce((s, e) => s + e.amount, 0);
      if (carExp > (car.finalSellPrice * 0.3)) {
         warnings.push(`Expense Alert: ${car.year} ${car.brand} ${car.model} required extreme repairs (>30% of sell price).`);
      }
    }
  });

  return {
    profit: {
      total: totalProfit,
      perCar: profitPerCar,
      trend: profitTrend,
    },
    sales: {
      totalCarsSold: closedCars,
      trend: salesTrend,
      conversionRate,
    },
    expenses: {
      total: totalExpenses,
      byCategory: expensesByCategory,
    },
    inventory: {
      available: cars.filter(c => c.status === "Available").length,
      sold: closedCars,
    },
    customers: {
      total: totalInquiries,
    },
    partners: {
      expensesByPartner: partnerExpenses,
    },
    warnings,
  };
}
