// ID cards: show a QR code card for each attendee

const SCHOOL_NAME = "Philippine College of Science and Technology";

// Draw a QR code inside a container. The QR text is the ID number.
function makeQr(container, text) {
  new QRCode(container, {
    text: text,
    width: 160,
    height: 160,
    colorDark: "#3b0764",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H
  });
}

// Save the QR code as a PNG image
function downloadQr(qrBox, idNumber) {
  const canvas = qrBox.querySelector("canvas");
  const img = qrBox.querySelector("img");
  let dataUrl = "";

  if (canvas) {
    dataUrl = canvas.toDataURL("image/png");
  } else if (img) {
    dataUrl = img.src;
  }
  if (!dataUrl) return;

  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = "QR-" + idNumber + ".png";
  link.click();
}

// Print only one card
function printOne(card) {
  card.classList.add("print-this");
  document.body.classList.add("printing-one");
  window.print(); // the browser waits here until the print window closes
  document.body.classList.remove("printing-one");
  card.classList.remove("print-this");
}

// Make a div with safe text
function makeDiv(className, text) {
  const div = document.createElement("div");
  div.className = className;
  div.textContent = text;
  return div;
}

// Build one ID card
function createCard(person) {
  const card = document.createElement("div");
  card.className = "id-card";

  card.appendChild(makeDiv("id-card-header", SCHOOL_NAME));

  const qrBox = document.createElement("div");
  qrBox.className = "id-card-qr";
  card.appendChild(qrBox);
  makeQr(qrBox, person.idNumber);

  card.appendChild(makeDiv("id-card-name", person.name));
  card.appendChild(makeDiv("id-card-id", person.idNumber));

  const programYear = person.yearLevel
    ? person.section + " - " + person.yearLevel
    : person.section;
  card.appendChild(makeDiv("id-card-program", programYear));

  // Buttons (hidden when printing)
  const actions = document.createElement("div");
  actions.className = "id-card-actions no-print";

  const downloadBtn = document.createElement("button");
  downloadBtn.textContent = "Download QR";
  downloadBtn.className = "small";
  downloadBtn.addEventListener("click", function () {
    downloadQr(qrBox, person.idNumber);
  });

  const printBtn = document.createElement("button");
  printBtn.textContent = "Print";
  printBtn.className = "small secondary";
  printBtn.addEventListener("click", function () {
    printOne(card);
  });

  actions.appendChild(downloadBtn);
  actions.appendChild(printBtn);
  card.appendChild(actions);

  return card;
}

// Show all cards
function renderCards() {
  const attendees = getData("attendees");
  const grid = document.getElementById("cardGrid");
  grid.innerHTML = "";

  document.getElementById("count").textContent = "Total cards: " + attendees.length;

  if (attendees.length === 0) {
    grid.textContent = "No attendees yet. Add attendees first.";
    return;
  }

  attendees.forEach(function (person) {
    grid.appendChild(createCard(person));
  });
}