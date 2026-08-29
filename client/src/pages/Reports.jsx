import "./Reports.css";
import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { API_URL } from "../api";

function Reports() {
  const currentDate = new Date();

  const [reportType, setReportType] = useState("monthly");
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [transactions, setTransactions] = useState([]);

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) return;

        const response = await fetch(`${API_URL}/api/transactions`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (response.ok) {
          setTransactions(data);
        }
      } catch (error) {
        console.error("Error fetching report data:", error);
      }
    };

    fetchTransactions();
  }, []);

  const reportTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const date = new Date(transaction.date);

      if (reportType === "monthly") {
        return (
          date.getMonth() === selectedMonth &&
          date.getFullYear() === selectedYear
        );
      }

      return date.getFullYear() === selectedYear;
    });
  }, [transactions, reportType, selectedMonth, selectedYear]);

  const income = reportTransactions
    .filter((transaction) => transaction.type === "Income")
    .reduce((total, transaction) => total + Number(transaction.amount), 0);

  const expenses = reportTransactions
    .filter((transaction) => transaction.type === "Expense")
    .reduce((total, transaction) => total + Number(transaction.amount), 0);

  const savings = income - expenses;

  const savingsRate = income > 0 ? (savings / income) * 100 : 0;

  const expenseBreakdown = useMemo(() => {
    const categoryTotals = {};

    reportTransactions
      .filter((transaction) => transaction.type === "Expense")
      .forEach((transaction) => {
        const category = transaction.category || "Others";

        categoryTotals[category] =
          (categoryTotals[category] || 0) + Number(transaction.amount);
      });

    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: expenses > 0 ? (amount / expenses) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [reportTransactions, expenses]);

  const monthlyOverview = useMemo(() => {
    return months.map((month, index) => {
      const amount = transactions
        .filter((transaction) => {
          const date = new Date(transaction.date);

          return (
            date.getMonth() === index &&
            date.getFullYear() === selectedYear &&
            transaction.type === "Expense"
          );
        })
        .reduce((total, transaction) => total + Number(transaction.amount), 0);

      return {
        month,
        amount,
      };
    });
  }, [transactions, selectedYear]);

  const maxMonthlyExpense = Math.max(
    ...monthlyOverview.map((item) => item.amount),
    1,
  );

  const reportTitle =
    reportType === "monthly"
      ? "Monthly Financial Report"
      : "Yearly Financial Report";

  const reportPeriod =
    reportType === "monthly"
      ? `${months[selectedMonth]} ${selectedYear}`
      : selectedYear;

  const formatAmount = (amount) => `₹${Number(amount).toLocaleString("en-IN")}`;

  // PDF me ₹ nahi rakhenge
  const formatPDFNumber = (amount) => Number(amount).toLocaleString("en-IN");

  const downloadPDF = () => {
    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();

      const margin = 14;

      // =========================
      // HEADER
      // =========================

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(21);
      pdf.setTextColor(27, 35, 55);

      pdf.text(reportTitle, pageWidth / 2, 19, {
        align: "center",
      });

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.setTextColor(105, 100, 125);

      pdf.text(String(reportPeriod), pageWidth / 2, 27, {
        align: "center",
      });

      // =========================
      // FINANCIAL SUMMARY
      // =========================

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.setTextColor(78, 55, 190);

      pdf.text("Financial Summary", margin, 40);

      autoTable(pdf, {
        startY: 44,

        margin: {
          left: margin,
          right: margin,
        },

        head: [["Income", "Expenses", "Savings"]],

        // IMPORTANT:
        // PDF me ₹ use nahi karna
        body: [
          [
            formatPDFNumber(income),
            formatPDFNumber(expenses),
            formatPDFNumber(savings),
          ],
        ],

        theme: "grid",

        styles: {
          font: "helvetica",
          fontSize: 11,
          cellPadding: 5,

          // Center horizontally
          halign: "center",

          // Center vertically
          valign: "middle",

          lineColor: [215, 216, 225],
        },

        headStyles: {
          fillColor: [91, 72, 220],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 11,

          halign: "center",
          valign: "middle",
        },

        bodyStyles: {
          fontStyle: "bold",
          fontSize: 12,
          cellPadding: 6,

          halign: "center",
          valign: "middle",
        },
      });

      // =========================
      // EXPENSE BREAKDOWN
      // =========================

      const startY = pdf.lastAutoTable.finalY + 11;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.setTextColor(78, 55, 190);

      pdf.text("Expense Breakdown", margin, startY);

      const expenseRows =
        expenseBreakdown.length > 0
          ? expenseBreakdown.map((item) => [
              item.category,
              formatPDFNumber(item.amount),
              `${item.percentage.toFixed(1)}%`,
            ])
          : [["No expense data", "0", "0%"]];

      autoTable(pdf, {
        startY: startY + 5,

        margin: {
          left: margin,
          right: margin,
        },

        head: [["Category", "Amount", "Percentage"]],

        body: expenseRows,

        foot: [["Total", formatPDFNumber(expenses), "100%"]],

        theme: "grid",

        styles: {
          font: "helvetica",
          fontSize: 9,
          cellPadding: 3.5,

          lineColor: [215, 216, 225],
          textColor: [35, 40, 55],

          // ALL CELLS CENTER
          halign: "center",
          valign: "middle",
        },

        headStyles: {
          fillColor: [91, 72, 220],
          textColor: [255, 255, 255],
          fontStyle: "bold",

          halign: "center",
          valign: "middle",
        },

        bodyStyles: {
          halign: "center",
          valign: "middle",
        },

        footStyles: {
          fillColor: [245, 243, 255],
          textColor: [52, 42, 130],
          fontStyle: "bold",

          halign: "center",
          valign: "middle",
        },

        columnStyles: {
          0: {
            cellWidth: 86,
            halign: "center",
          },

          1: {
            cellWidth: 54,
            halign: "center",
          },

          2: {
            cellWidth: 36,
            halign: "center",
          },
        },

        pageBreak: "avoid",
        rowPageBreak: "avoid",
      });

      // =========================
      // SAVINGS RATE
      // =========================

      const savingsY = pdf.lastAutoTable.finalY + 10;

      pdf.setDrawColor(157, 139, 255);
      pdf.setLineWidth(0.35);

      pdf.roundedRect(margin, savingsY, pageWidth - margin * 2, 18, 2, 2);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.setTextColor(35, 40, 55);

      pdf.text("Savings Rate", margin + 8, savingsY + 11);

      pdf.setFontSize(16);
      pdf.setTextColor(35, 174, 92);

      pdf.text(
        `${Math.max(savingsRate, 0).toFixed(1)}%`,
        pageWidth - margin - 8,
        savingsY + 11,
        {
          align: "right",
        },
      );

      // =========================
      // SAVE PDF
      // =========================

      const fileName =
        reportType === "monthly"
          ? `${months[selectedMonth]}-${selectedYear}-Report.pdf`
          : `${selectedYear}-Yearly-Report.pdf`;

      pdf.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);

      alert("Unable to generate PDF. Please try again.");
    }
  };

  return (
    <div className="reports-page">
      {/* Header */}
      <div className="reports-header">
        <div>
          <h2>Reports</h2>

          <p>View and download your financial reports.</p>
        </div>

        <button className="download-report-btn" onClick={downloadPDF}>
          ↓ Download PDF
        </button>
      </div>

      <div className="report-container">
        {/* Report Period */}
        <div className="report-period">
          <span>Report Period</span>

          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
          >
            <option value="monthly">Monthly Reports</option>

            <option value="yearly">Yearly Reports</option>
          </select>

          {reportType === "monthly" ? (
            <select
              value={`${selectedMonth}-${selectedYear}`}
              onChange={(e) => {
                const [month, year] = e.target.value.split("-");

                setSelectedMonth(Number(month));
                setSelectedYear(Number(year));
              }}
            >
              {months.map((month, index) => (
                <option key={index} value={`${index}-${selectedYear}`}>
                  {month} {selectedYear}
                </option>
              ))}
            </select>
          ) : (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {Array.from({ length: 7 }, (_, index) => {
                const year = currentDate.getFullYear() - index;

                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
          )}
        </div>

        {/* Report Heading */}
        <div className="report-heading">
          <h1>{reportTitle}</h1>

          <span>{reportPeriod}</span>
        </div>

        {/* Summary */}
        <div className="report-summary">
          <div className="report-summary-card income">
            <div className="summary-icon">↗</div>

            <div>
              <span>Income</span>

              <strong>{formatAmount(income)}</strong>
            </div>
          </div>

          <div className="report-summary-card expenses">
            <div className="summary-icon">↘</div>

            <div>
              <span>Expenses</span>

              <strong>{formatAmount(expenses)}</strong>
            </div>
          </div>

          <div className="report-summary-card savings">
            <div className="summary-icon">◈</div>

            <div>
              <span>Savings</span>

              <strong>{formatAmount(savings)}</strong>
            </div>
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="expense-breakdown">
          <div className="section-title">
            <h3>Expense Breakdown</h3>

            <strong>Total Expenses {formatAmount(expenses)}</strong>
          </div>

          {expenseBreakdown.length > 0 ? (
            expenseBreakdown.map((item) => (
              <div className="expense-breakdown-row" key={item.category}>
                <div className="expense-category">
                  <div className="category-icon">
                    {item.category.charAt(0).toUpperCase()}
                  </div>

                  <span>{item.category}</span>
                </div>

                <div className="expense-progress">
                  <div
                    className="expense-progress-fill"
                    style={{
                      width: `${item.percentage}%`,
                    }}
                  ></div>
                </div>

                <strong>{formatAmount(item.amount)}</strong>

                <span className="expense-percentage">
                  {item.percentage.toFixed(0)}%
                </span>
              </div>
            ))
          ) : (
            <p className="no-report-data">
              No expense data available for this period.
            </p>
          )}
        </div>

        {/* Savings Rate */}
        <div className="savings-rate">
          <div>
            <h3>Savings Rate</h3>

            <strong>{Math.max(savingsRate, 0).toFixed(1)}%</strong>
          </div>

          <div className="savings-progress">
            <div
              className="savings-progress-fill"
              style={{
                width: `${Math.min(Math.max(savingsRate, 0), 100)}%`,
              }}
            ></div>
          </div>

          <p>
            {savingsRate >= 40
              ? "Great! You are maintaining a healthy savings rate."
              : savingsRate > 0
                ? "Keep tracking your expenses and try to save more."
                : "Add income and expense transactions to see your savings rate."}
          </p>
        </div>

        {/* Monthly Overview */}
        <div className="monthly-overview">
          <div className="section-title">
            <div>
              <h3>Monthly Overview</h3>

              <p>Your total expenses for {selectedYear}</p>
            </div>
          </div>

          <div className="monthly-chart">
            {monthlyOverview.map((item) => (
              <div className="monthly-chart-item" key={item.month}>
                <span>
                  {item.amount > 0 ? formatAmount(item.amount) : "₹0"}
                </span>

                <div className="chart-bar-container">
                  <div
                    className={`chart-bar ${
                      reportType === "monthly" &&
                      item.month === months[selectedMonth]
                        ? "active"
                        : ""
                    }`}
                    style={{
                      height: `${(item.amount / maxMonthlyExpense) * 100}%`,
                    }}
                  ></div>
                </div>

                <small>{item.month.slice(0, 3)}</small>
              </div>
            ))}
          </div>
        </div>

        {/* Tip */}
        <div className="report-tip">
          <span>💡</span>

          <p>
            Keep tracking your expenses regularly to understand your spending
            habits and stay within your budget.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Reports;
