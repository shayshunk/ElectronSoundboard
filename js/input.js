const { ipcRenderer } = require("electron");

const formButton = document.getElementById("submitButton");
const form = document.getElementById("submitForm");
const inputForm = document.getElementById("inputForm");

form.addEventListener("submit", function () {
  buttonName = inputForm.value;
  console.log(buttonName);
  ipcRenderer.invoke("submit-form", buttonName);
});
