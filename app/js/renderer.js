const electron = require("electron");
const { ipcRenderer } = require("electron");
const path = require("path");
const moment = require("moment");
const fs = require("fs");
const Chart = require("chart.js");

const section1 = document.getElementById("section1");
const section1Btn = document.getElementById("section1-btn");
const section2 = document.getElementById("section2");
const section2Btn = document.getElementById("section2-btn");
const todayEle = document.getElementById("today");
const hoursEle = document.getElementById("hours");
const minutesEle = document.getElementById("minutes");
const boxesEle = document.getElementById("boxes");
const ctx = document.getElementById("active-chart");

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

// Construct file path | All the datetimes will be stored here
const userDataPath = (electron.app || electron.remote.app).getPath("userData");
const filePath = path.join(userDataPath, "montor.json");

// If the file to keep track of the datetimes does not exist, initialize it
if (!fs.existsSync(filePath)) {
  console.log("File does not exist. Initializing...");
  const today = moment().format("YYYY-MM-DD");
  const obj = {};
  obj[today] = "00:00";
  fs.writeFileSync(filePath, JSON.stringify(obj));
}

// Stopwatch
let minutes = 0;
let hours = 0;

function stopwatch() {
  console.log("minutes", minutes);
  minutes++;
  if (minutes / 60 === 1) {
    minutes = 0;
    hours++;
  }
}

function readFile() {
  const data = fs.readFileSync(filePath);
  return JSON.parse(data);
}

function updateFile(dataJson) {
  fs.writeFileSync(filePath, JSON.stringify(dataJson));
}

function getCurrentDay() {
  return moment().format("YYYY-MM-DD");
}

// Main
function main(byInterval) {
  todayEle.innerText = moment().format("dddd, MMMM Do, YYYY");

  // Get contents from file
  const dataJson = readFile();
  const today = getCurrentDay();

  // Get last active time for current day
  const lastActiveTime = dataJson[today];
  // If it exists continue the stopwatch from the last active time, otherwise start fresh
  if (lastActiveTime) {
    const momentTime = moment(lastActiveTime, "HH:mm");
    minutes = momentTime.minute();
    hours = momentTime.hour();
  } else {
    minutes = 0;
    hours = 0;
  }
  // Start stopwatch only if it was called by the interval (i.e. don't start the first time it runs)
  if (byInterval) stopwatch();
  // Update Text
  hoursEle.innerText = hours;
  minutesEle.innerText = minutes;
  // Update Chart
  doughnutChart.data.datasets[0].data[0] = minutes;
  doughnutChart.data.datasets[0].data[1] = 1440 - minutes;
  doughnutChart.update();
  // Update File
  dataJson[today] = moment(`${hours}:${minutes}`, "H:m").format("HH:mm");
  updateFile(dataJson);
}

// Chart
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

// Get Historical Content for Second Page
function getHistorical() {
  const dataJson = readFile();
  let boxes = "";
  for (const [key, value] of Object.entries(dataJson)) {
    const momentObj = moment(value, "HH:mm:ss");
    const minutes = momentObj.minute();
    const hours = momentObj.hour();
    const box = `<div class="box"> <p class="box-title">${key}</p> <p class="box-subtitle">${hours} hours & ${minutes} minutes</p> </div>`;
    boxes += box;
  }
  boxesEle.innerHTML = boxes;
}

let interval;
let ms = 60000;

// Listen for Power Events
ipcRenderer.on("isActive", (e, _isActive) => {
  clearInterval(interval);
  if (_isActive) {
    interval = setInterval(main, ms, true);
  }
});

// Startup
main(false); // First time run
interval = setInterval(main, ms, true); // First time interval
getHistorical(); // Second page
