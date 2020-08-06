const Chart = require("chart.js");

const section1 = document.getElementById("section1");
const section1Btn = document.getElementById("section1-btn");
const section2 = document.getElementById("section2");
const section2Btn = document.getElementById("section2-btn");
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

function onClickS1() {
  section1.classList.remove("active");
  section2.classList.add("active");
}

function onClickS2() {
  section2.classList.remove("active");
  section1.classList.add("active");
}

section1Btn.addEventListener("click", onClickS1);
section2Btn.addEventListener("click", onClickS2);
