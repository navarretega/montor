const { app, BrowserWindow, powerMonitor } = require("electron");
const AppTray = require("./AppTray");

app.setAppUserModelId("brisai.montor");

let mainWindow;
let tray;

// PowerMonitor Events
function powerEvents() {
  powerMonitor.on("lock-screen", () => {
    console.log("The system is about to lock the screen");
    mainWindow.webContents.send("isActive", false);
  });
  powerMonitor.on("unlock-screen", () => {
    console.log("The systems screen is unlocked");
    mainWindow.webContents.send("isActive", true);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 500,
    height: 600,
    frame: false,
    resizable: false,
    icon: `${__dirname}/app/assets/logo.png`,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
    },
  });

  mainWindow.loadFile(`${__dirname}/app/index.html`);

  // mainWindow.webContents.openDevTools();

  mainWindow.on("close", (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
    return true;
  });

  // Tray
  const icon = `${__dirname}/app/assets/tray_logo.png`;
  tray = new AppTray(icon, mainWindow);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.on("ready", () => {
  createWindow();
  powerEvents();
});

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", function () {
  if (mainWindow === null) {
    createWindow();
  }
});
