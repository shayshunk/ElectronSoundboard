const { app, BrowserWindow, ipcMain, dialog, Menu } = require("electron");

// include the Node.js 'path' module at the top of your file
const path = require("node:path");
const { text } = require("node:stream/consumers");

let win, textWindow;
let name = "";

// Checking if mac
const isMac = process.platform === "darwin";

// Enabling dev options
const isDev = process.env.NODE_EV === "development";

// modify your existing createWindow() function
const createWindow = () => {
  console.log("Loaded!");
  win = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, "js/preload.js"),
    },
  });

  if (!isDev) {
    win.webContents.openDevTools();
  }

  win.loadFile("index.html");
};
// ...

Menu.setApplicationMenu(null);

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (!isMac) {
    app.quit();
  }
});

ipcMain.handle("open-dialog", async (event) => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    title: "Select a sound!",
    filters: [
      {
        name: "Sounds",
        extensions: ["mp3", "wav"],
      },
    ], // Don't allow multiple file selection
  });

  return result.filePaths; // Return the selected file path
});
