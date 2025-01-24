const { ipcRenderer } = require("electron");

const AddSoundBtn = document.getElementById("AddSound");
const soundDiv = document.getElementById("sound-buttons");

AddSoundBtn.onclick = addSound;

let buttonName;

const buttonList = [];

async function addSound() {
  soundInformation = await openDialog();

  filePath = soundInformation[0];

  await addButton();
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

async function addButton() {
  buttonName = await getFormValue();

  const container = document.createElement("div");
  container.classList.add("sound-container");
  container.id = `${buttonList.length}`;
  soundDiv.appendChild(container);

  const newButton = document.createElement("button");
  newButton.classList.add("sound-button");
  newButton.textContent = `${buttonName}`;
  newButton.addEventListener("click", (e) => playSound(e));
  container.appendChild(newButton);

  const audio = new Audio(filePath);

  const loopButton = document.createElement("button");
  loopButton.classList.add("loop-button");
  loopButton.innerHTML = '<img src="assets/loop.png" width="25" height="25">';
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
  volumeSlider.value = 100;
  volumeSlider.classList.add("volume-slider");
  container.appendChild(volumeSlider);

  buttonList.push({
    soundButton: newButton,
    loopButton: loopButton,
    audioFile: audio,
  });
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

function playSound(event) {
  const parentId = event.target.parentElement.id;
  sound = buttonList[parentId].audioFile;

  // Debugging
  console.log(buttonList);
  console.log(parentId);
  console.log(sound);

  sound.play();
}
