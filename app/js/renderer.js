const Chart = require("chart.js");
const { ipcRenderer } = require("electron");

// Variables //
const section1 = document.getElementById("section1");
const section1Btn = document.getElementById("section1-btn");
const section2 = document.getElementById("section2");
const section2Btn = document.getElementById("section2-btn");
const ctx = document.getElementById("active-chart");
const stopWatchEle = document.getElementById("stopwatch");
const hoursEle = document.getElementById("hours");
const minutesEle = document.getElementById("minutes");
// Variables //

// Tabs //
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
// Tabs //

// Stopwatch //
let seconds = 0;
let minutes = 0;
let hours = 0;

const lastStopWatch = localStorage.getItem("stopwatch");
if (lastStopWatch) {
  const split = lastStopWatch.split(":");
  seconds = parseInt(split[2]);
  minutes = parseInt(split[1]);
  hours = parseInt(split[0]);
}

let displaySeconds = 0;
let displayMinutes = 0;
let displayHours = 0;

function stopwatch() {
  seconds++;

  if (seconds / 60 === 1) {
    seconds = 0;
    minutes++;

    if (minutes / 60 === 1) {
      minutes = 0;
      hours++;
    }
  }

  if (seconds < 10) {
    displaySeconds = "0" + seconds.toString();
  } else {
    displaySeconds = seconds;
  }

  if (minutes < 10) {
    displayMinutes = "0" + minutes.toString();
  } else {
    displayMinutes = minutes;
  }

  if (hours < 10) {
    displayHours = "0" + hours.toString();
  } else {
    displayHours = hours;
  }

  const res = displayHours + ":" + displayMinutes + ":" + displaySeconds;
  // stopWatchEle.innerText = res;
  hoursEle.innerText = hours;
  minutesEle.innerText = minutes;
  localStorage.setItem("stopwatch", res);
}

function resume(isActive) {
  let interval;
  if (isActive) {
    interval = setInterval(stopwatch, 1000);
  } else {
    clearInterval(interval);
  }
}

ipcRenderer.on("isActive", (e, _isActive) => {
  resume(_isActive);
});
// Stopwatch //

// Chart //
let doughnutChart = new Chart(ctx, {
  type: "doughnut",
  data: {
    labels: ["Active (min)", "Inactive (min)"],
    datasets: [
      {
        backgroundColor: ["#ef4565", "#90b4ce"],
        data: [minutes, 1440 - minutes],
      },
    ],
  },
  options: {
    responsive: false,
  },
});

function updateChart() {
  let chartInterval;
  chartInterval = setInterval(() => {
    doughnutChart.data.datasets[0].data[0] = minutes;
    doughnutChart.data.datasets[0].data[1] = 1440 - minutes;
    doughnutChart.update();
  }, 60000);
}
// Chart //

resume(true);
updateChart();
