const remote = require("electron").remote;

const win = remote.getCurrentWindow();

document.onreadystatechange = (event) => {
  if (document.readyState == "complete") {
    handleWindowControls();
  }
};

window.onbeforeunload = (event) => {
  win.removeAllListeners();
};

function handleWindowControls() {
  document.getElementById("tb-min-button").addEventListener("click", (event) => {
    win.minimize();
  });

  document.getElementById("tb-close-button").addEventListener("click", (event) => {
    win.close();
  });
}

// Custom Scrollbar
// To get rid of it, simply remove the next line,
// and remove the css (simplebar.css) and js (simblebar.min.js)
new SimpleBar(document.getElementById("main"));
