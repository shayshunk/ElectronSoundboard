// Node and electron requirements
const { ipcRenderer } = require("electron");
var fs = require('fs');

// Grabbing HTML elements
const addSoundBtn = document.getElementById("AddSound");
const soundDiv = document.getElementById("sound-buttons");
const resetBtn = document.getElementById("Reset");
const alphabetizeBtn = document.getElementById("Alphabetize")
const masterVolumeSlider = document.getElementById("MainVolume");
const columnInput = document.getElementById("Columns");

// Setting up add sound button
addSoundBtn.addEventListener("click", () => addSound());

// Setting up reset button
resetBtn.addEventListener("click", () => resetAll());

// Setting up alphabetize button
alphabetizeBtn.addEventListener("click", () => alphabetize());

// Variables
let buttonName;
var buttonList = [], userData = [];

// Updating master volume
masterVolumeSlider.addEventListener("input", () => {
  const volume = masterVolumeSlider.value / 100;

  // Updating all sound volumes
  for (let i = 0; i < buttonList.length; i++) {
    const sound = buttonList[i].audioFile;
    const localVolume = buttonList[i].volumeSlider.value / 100;

    console.log("Local volume of ", i, localVolume);

    sound.volume = localVolume * volume;
  }

  // Updating options file
  saveFile();
});

// Updating number of columns
columnInput.addEventListener("input", () => {
  const columns = columnInput.value;

  // Changing grid layout
  soundDiv.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;

  // Updating options file
  saveFile();
})

// Checking if data file exists and loading sounds
if (fs.existsSync("ButtonData.txt")) {
  // Converting text back to JSON
  fs.readFile("ButtonData.txt", 'utf8', (err, jsonData) => {
    if (err) {
      console.log(err);
      return;
    }

    const loadedSounds = JSON.parse(jsonData);

    // Iterating through loaded sounds
    for (let i = 0; i < loadedSounds.length; i++) {
      addSound(loadedSounds[i].path, loadedSounds[i].name, loadedSounds[i].vol, loadedSounds[i].loopOn);
    }
  })
}

// Checking if options file exists
if (fs.existsSync("UserData.txt")) {
  // Converting back to JSOn
  fs.readFile("UserData.txt", 'utf8', (err, userOptions) => {
    if (err) {
      console.log(err);
      return;
    }

    // Grabbing data
    const options = JSON.parse(userOptions);
    const columns = options.columns;
    const mainVolume = options.mainVolume;

    // Updating
    columnInput.value = columns;
    soundDiv.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    masterVolumeSlider.value = mainVolume;
  })
}

// Function to add sound button group
async function addSound(path = null, name = null, vol = null, loopOn = false) {
  // Checking if passing in loaded sound
  if (path === null) {
    soundInformation = await openDialog();
    filePath = soundInformation[0];
  }
  else {
    filePath = path;
  }

  // Makes sure name dialog isn't loaded if no file path
  if (filePath == undefined) {
    return;
  }

  // Adding button once path is set
  await addButton(name, vol, loopOn);
}

// Prompting file dialog
async function openDialog() {
  const soundInformation = await ipcRenderer.invoke("open-dialog");
  return soundInformation;
}

// Opening modal window
async function openNewWindow() {
  return new Promise(function (resolve, reject) {
    let childWindow = window.open("html/input.html", "width=100,height=100,modal");
    childWindow.onload = () => {
      resolve(childWindow);
    };
  });
}

// Getting button name from modal window
async function getFormValue() {
  let childWindow = await openNewWindow();
  childWindow.resizeTo(500, 300);
  let childDocument = childWindow.document;

  return new Promise(function (resolve, reject) {
    let form = childDocument.getElementById("submitForm");
    let inputForm = childDocument.getElementById("inputForm");

    form.addEventListener("submit", function () {
      buttonName = inputForm.value;
      childWindow.close();
      resolve(buttonName);
    });
  });
}

async function addButton(name, vol, loopOn) {

  // Checking if preloaded sounds exist
  if (name === null) {
    buttonName = await getFormValue();
  }
  else {
    buttonName = name;
  }

  // Creating elements

  // Creating div container
  const container = document.createElement("div");
  container.classList.add("sound-container");
  container.id = `${buttonList.length}`;
  container.order = buttonList.length;
  soundDiv.appendChild(container);

  // Creating sound button
  const newButton = document.createElement("button");
  newButton.classList.add("sound-button");
  newButton.textContent = `${buttonName}`;
  newButton.addEventListener("click", (e) => playSound(e));
  container.appendChild(newButton);

  // Associating audio object with each sound
  const audio = new Audio(filePath);

  // Creating loop button
  const loopButton = document.createElement("button");
  if (loopOn) {
    loopButton.classList.add("loop-clicked");
  }
  else {
    loopButton.classList.add("loop-button");
  }
  loopButton.innerHTML = '<img src="assets/loop.png" width="25" height="25">';
  loopButton.addEventListener("click", (e) => setLoop(e));
  container.appendChild(loopButton);

  // Adding rename button
  const pencilButton = document.createElement("button");
  pencilButton.classList.add("pen-button");
  pencilButton.innerHTML =
    '<img src="assets/pencil.png" width="25" height="25">';
  pencilButton.addEventListener("click", (e) => renameButton(e));
  container.appendChild(pencilButton);

  // Adding delete button
  const deleteButton = document.createElement("button");
  deleteButton.classList.add("delete-button");
  deleteButton.innerHTML =
    '<img src="assets/delete.png" width="25" height="25">';
  deleteButton.addEventListener("click", (e) => deleteFunc(e));
  container.appendChild(deleteButton);

  // Adding volume slider
  const volumeSlider = document.createElement("input");
  volumeSlider.type = "range";
  volumeSlider.min = 0;
  volumeSlider.max = 100;
  // Checking if loaded value is being passed
  if (vol === null) {
    volumeSlider.value = 100;
  }
  else {
    volumeSlider.value = vol;
    const masterVolume = masterVolumeSlider.value / 100;
    audio.volume = vol * masterVolume / 100;
  }
  volumeSlider.classList.add("volume-slider");
  volumeSlider.addEventListener("input", (e) => setVolume(e));
  container.appendChild(volumeSlider);

  // Tracking button data
  buttonList.push({
    soundButton: newButton,
    loopButton: loopButton,
    audioFile: audio,
    volumeSlider: volumeSlider,
    name: buttonName,
  });

  // Keeping track of data to save
  userData.push({
    path: filePath,
    name: buttonName,
    vol: volumeSlider.value,
    loopOn: loopButton.className == "loop-clicked",
  });

  // Saving only if not iterating through loaded sounds
  if (name === null) {
    saveFile();
  }
}

function deleteFunc(event) {
  // Grabbing button group
  const parentContainer = event.target.parentElement;
  const parentId = parentContainer.id;

  // Remove entire button group
  parentContainer.remove();

  // Making sure sound stops playing if deleted
  sound = buttonList[parentId].audioFile;
  sound.pause();

  // Updating arrays
  buttonList.pop(parentId);
  userData.pop(parentId);

  // Updating HTML IDs
  for (let i = buttonList.length; i > parentId; i--) {
    let soundContainer = document.getElementById(`${i}`);
    soundContainer.id = `${i - 1}`;
  }

  // Updating saved file
  saveFile();
}

function setLoop(event) {
  // Grabbing button group
  const parentId = event.target.parentElement.id;
  const loopButton = buttonList[parentId].loopButton;

  // Checking if button is clicked
  loopButton.className =
    loopButton.className == "loop-clicked" ? "loop-button" : "loop-clicked";

  // Resetting sound if loop is unclicked
  if (loopButton.className == "loop-button") {
    const sound = buttonList[parentId].audioFile;
    sound.pause();
    sound.currentTime = 0;
  }

  // Updating saved file
  userData[parentId].loopOn = loopButton.className == "loop-clicked";
  saveFile();
}

function setVolume(event) {
  // Grabbing button group
  const parentId = event.target.parentElement.id;
  const volumeSlider = buttonList[parentId].volumeSlider;

  // Grabbing master and local volume
  const volume = volumeSlider.value / 100;
  const sound = buttonList[parentId].audioFile;
  const masterVolume = masterVolumeSlider.value / 100;

  // Setting volume
  sound.volume = volume * masterVolume;

  // Updating saved file
  userData[parentId].vol = volume * 100;
  saveFile();
}

function playSound(event) {
  // Grabbing button group
  const parentId = event.target.parentElement.id;
  const sound = buttonList[parentId].audioFile;

  // Checking if loop button is toggled
  const isLoop = buttonList[parentId].loopButton.className == "loop-clicked";

  // Sets sound to loop if button is checked
  if (isLoop) {
    sound.loop = true;
  }

  // Restarts sound if it's already playing
  if (isSoundPlaying(sound)) {
    sound.pause();
    sound.currentTime = 0;
  }
  sound.play();
}

// Function to check if sound is already playing
function isSoundPlaying(audio) {
  return !audio.paused && !audio.muted && audio.currentTime > 0 && audio.readyState >= 2;
}

// Function to save data to file
function saveFile() {
  // Button data
  const jsonData = JSON.stringify(userData);
  fs.writeFile("ButtonData.txt", jsonData, function (err) {
    if (err) {
      console.log(err);
    }
  })

  // User options
  const options = { "mainVolume": masterVolumeSlider.value, "columns": columnInput.value };
  const userJSON = JSON.stringify(options);
  fs.writeFile("UserData.txt", userJSON, function (err) {
    if (err) {
      console.log(err);
    }
  })
}

async function renameButton(event) {
  // Grabbing button group
  const parentId = event.target.parentElement.id;

  // Opening modal window
  let name = await getFormValue();

  // Renaming button in arrays and on screen
  buttonList[parentId].soundButton.textContent = name;
  buttonList[parentId].name = name;
  userData[parentId].name = name;

  // Updating saved file
  saveFile();
}

// Function to reset all volumes and loop buttons
function resetAll() {
  for (let i = 0; i < buttonList.length; i++) {
    buttonList[i].loopButton.className = "loop-button";
    buttonList[i].volumeSlider.value = 100;

    userData[i].loopOn = false;
    userData[i].vol = 100;
  }

  masterVolumeSlider.value = 100;

  // Updating saved file
  saveFile();
}

// Function to alphabetize all buttons
function alphabetize() {
  // Sorting button and user data lists
  buttonList = buttonList.sort((a, b) => {
    if (a.name < b.name) {
      return -1;
    }
  });

  userData = userData.sort((a, b) => {
    if (a.name < b.name) {
      return -1;
    }
  });

  const totalButtons = userData.length;

  // Resetting IDs
  for (let i = 0; i < totalButtons; i++) {
    buttonList[i].soundButton.parentElement.id = (`${i}`);
  }

  // Redoing grid positions
  for (let i = 0; i < totalButtons; i++) {
    let soundContainer = document.getElementById(`${i}`);
    console.log(soundContainer);

    const gridColumn = totalButtons % 3;
    const gridRow = Math.floor(totalButtons / 3);

    soundContainer.style.order = i;
  }

  // Updating saved file
  saveFile();
}
