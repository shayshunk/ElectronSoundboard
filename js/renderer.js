const { ipcRenderer } = require("electron");

var fs = require('fs');

const AddSoundBtn = document.getElementById("AddSound");
const soundDiv = document.getElementById("sound-buttons");

AddSoundBtn.addEventListener("click", () => addSound());

const masterVolumeSlider = document.getElementById("MainVolume");

let buttonName;

const buttonList = [], userData = [];

masterVolumeSlider.addEventListener("input", () => {
  const volume = masterVolumeSlider.value / 100;

  console.log(volume);

  let i = 0;

  while (i < buttonList.length) {
    const sound = buttonList[i].audioFile;
    const localVolume = buttonList[i].volumeSlider.value / 100;

    sound.volume = localVolume * volume;

    i++;
  }
});

// Checking if data file exists and loading sounds
if (fs.existsSync("UserData.txt")) {
  // Converting text back to JSON
  fs.readFile('UserData.txt', 'utf8', (err, jsonData) => {
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

async function addSound(path = null, name = null, vol = null, loopOn = false) {
  console.log(path);

  if (path === null) {
    soundInformation = await openDialog();
    filePath = soundInformation[0];
  }
  else {
    filePath = path;
  }
  await addButton(name, vol, loopOn);
}

function deleteFunc(event) {
  const parentContainer = event.target.parentElement;
  const parentId = parentContainer.id;

  parentContainer.remove();
  buttonList.pop(parentId);

  for (let i = buttonList.length; i > parentId; i--) {
    soundContainer = document.getElementById(`${i}`);
    soundContainer.id = `${i - 1}`;
  }
}

async function openDialog() {
  const soundInformation = await ipcRenderer.invoke("open-dialog");
  return soundInformation;
}

async function openNewWindow() {
  return new Promise(function (resolve, reject) {
    let childWindow = window.open("html/input.html", "modal");
    childWindow.onload = () => {
      resolve(childWindow);
    };
  });
}

async function getFormValue() {
  let childWindow = await openNewWindow();
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

  const pencilButton = document.createElement("button");
  pencilButton.classList.add("pen-button");
  pencilButton.innerHTML =
    '<img src="assets/pencil.png" width="25" height="25">';
  container.appendChild(pencilButton);

  const deleteButton = document.createElement("button");
  deleteButton.classList.add("delete-button");
  deleteButton.innerHTML =
    '<img src="assets/delete.png" width="25" height="25">';
  deleteButton.addEventListener("click", (e) => deleteFunc(e));
  container.appendChild(deleteButton);

  const volumeSlider = document.createElement("input");
  volumeSlider.type = "range";
  volumeSlider.min = 0;
  volumeSlider.max = 100;
  if (vol === null) {
    volumeSlider.value = 100;
  }
  else {
    volumeSlider.value = vol;
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
  const parentContainer = event.target.parentElement;
  const parentId = parentContainer.id;

  parentContainer.remove();

  sound = buttonList[parentId].audioFile;
  sound.pause();

  buttonList.pop(parentId);

  for (let i = buttonList.length; i > parentId; i--) {
    soundContainer = document.getElementById(`${i}`);
    soundContainer.id = `${i - 1}`;
  }
}

function setLoop(event) {
  const parentId = event.target.parentElement.id;
  const loopButton = buttonList[parentId].loopButton;

  loopButton.className =
    loopButton.className == "loop-clicked" ? "loop-button" : "loop-clicked";

  if (loopButton.className == "loop-button") {
    const sound = buttonList[parentId].audioFile;
    sound.pause();
  }
}

function setVolume(event) {
  const parentId = event.target.parentElement.id;
  const volumeSlider = buttonList[parentId].volumeSlider;
  const volume = volumeSlider.value / 100;
  const sound = buttonList[parentId].audioFile;

  sound.volume = volume;
}

function playSound(event) {
  const parentId = event.target.parentElement.id;
  const sound = buttonList[parentId].audioFile;

  const isLoop = buttonList[parentId].loopButton.className == "loop-clicked";

  if (isLoop) {
    sound.loop = true;
  }
  sound.play();
}

function saveFile() {
  const jsonData = JSON.stringify(userData);
  fs.writeFile("UserData.txt", jsonData, function (err) {
    if (err) {
      console.log(err);
    }
  })
}
