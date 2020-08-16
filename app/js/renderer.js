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
const currentHoursEle = document.getElementById("c-hours");
const currentMinutesEle = document.getElementById("c-minutes");
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
  // console.log("File does not exist. Initializing...");
  const today = moment().format("YYYY-MM-DD");
  const obj = {};
  obj[today] = "00:00";
  fs.writeFileSync(filePath, JSON.stringify(obj));
}

// Stopwatch
let minutes = 0;
let hours = 0;

function stopwatch() {
  minutes++;
  if (minutes / 60 === 1) {
    minutes = 0;
    hours++;
  }
}

let currentMinutes = 0;
let currentHours = 0;

function currentStopwatch() {
  currentMinutes++;
  if (currentMinutes / 60 === 1) {
    currentMinutes = 0;
    currentHours++;
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

// Current Active Time
function current(_isActive) {
  if (_isActive) {
    currentStopwatch();
  } else {
    currentMinutes = 0;
    currentHours = 0;
  }
  currentHoursEle.innerText = currentHours;
  currentMinutesEle.innerText = currentMinutes;
  // Check if we need to send a notification
  const currentTime = currentHours * 60 + currentMinutes;
  const lastDateNotification = getLastDateNotification();
  const currentDate = moment();
  if (currentTime >= 60) {
    if (!lastDateNotification) {
      notify("Take a break!", `You've been active non-stop for ${currentTime} minutes.`);
      setLastDateNotification(currentDate.format());
    } else {
      const diff = currentDate.diff(lastDateNotification, "minutes");
      if (diff >= 30) {
        notify("Take a break!", `You've been active non-stop for ${currentTime} minutes.`);
        setLastDateNotification(currentDate.format());
      } else {
        // console.log("Waiting at least X minutes before sending another notification", diff);
      }
    }
  } else {
    // console.log("Haven't reached threshold. Avoiding sending notification");
  }
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
  const updMinutes = hours * 60 + minutes;
  doughnutChart.data.datasets[0].data[0] = updMinutes;
  doughnutChart.data.datasets[0].data[1] = 1440 - updMinutes;
  doughnutChart.update();
  // Update File
  const currentTime = moment(`${hours}:${minutes}`, "H:m");
  dataJson[today] = currentTime.format("HH:mm");
  updateFile(dataJson);
}

// Send desktops notifications
function notify(title, body) {
  new Notification(title, {
    body: body,
    icon: `${__dirname}/assets/logo.png`,
  });
}

// Chart
const updMinutes = hours * 60 + minutes;
let doughnutChart = new Chart(ctx, {
  type: "doughnut",
  data: {
    labels: ["Total Active (m)", "Total Inactive (m)"],
    datasets: [
      {
        backgroundColor: ["#ef4565", "#90b4ce"],
        data: [updMinutes, 1440 - updMinutes],
      },
    ],
  },
  options: {
    responsive: false,
  },
});

// Get Last Recorded Notification from Local Storage
function getLastDateNotification() {
  let lastNotification = localStorage.getItem("last-notification");
  if (lastNotification) {
    return moment(lastNotification);
  }
}

// Set Last Recorded Notification on Local Storage
function setLastDateNotification(val) {
  localStorage.setItem("last-notification", val);
}

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
let currentInterval;
let ms = 60000;

// Listen for Power Events
ipcRenderer.on("isActive", (e, _isActive) => {
  clearInterval(interval);
  clearInterval(currentInterval);

  if (_isActive) {
    interval = setInterval(main, ms, true);
    currentInterval = setInterval(current, ms, true);
  } else {
    current(false);
  }
});

// Startup
main(false); // First time run
interval = setInterval(main, ms, true); // First time interval
currentInterval = setInterval(current, ms, true); // First time current interval
getHistorical(); // Second page
