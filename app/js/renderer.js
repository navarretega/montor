const Chart = require("chart.js");

const ctx = document.getElementById("active-chart");

const doughnutChart = new Chart(ctx, {
  type: "doughnut",
  data: {
    labels: ["Active", "Inactive"],
    datasets: [
      {
        label: "Population (millions)",
        backgroundColor: ["#ef4565", "#90b4ce"],
        data: [4, 20],
      },
    ],
  },
  options: {
    responsive: false,
  },
});
