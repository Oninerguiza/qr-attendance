// Import attendees from a CSV file (saved online in Firestore)

import { validateAttendee, addAttendee, renderTable } from "./attendees.js";

// Split CSV text into rows and columns (handles "quoted, values")
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  text = text.replace(/^\uFEFF/, ""); // remove the invisible BOM Excel adds

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  // ignore completely empty rows
  return rows.filter(function (r) {
    return r.some(function (cell) { return cell.trim() !== ""; });
  });
}

// Find a value in a dropdown (case-insensitive). Returns "" if not found.
// This reuses the options already in your form, so the lists never go out of sync.
function findOption(selectId, value) {
  const wanted = value.trim().toLowerCase();
  const options = document.querySelectorAll("#" + selectId + " option");
  for (let i = 0; i < options.length; i++) {
    if (options[i].value && options[i].value.toLowerCase() === wanted) {
      return options[i].value;
    }
  }
  return "";
}

// Accept "1", "1st", or "1st Year" and turn it into "1st Year"
function normalizeYear(value) {
  const match = value.trim().match(/^([1-9])/);
  if (!match) return "";
  const names = { 1: "1st Year", 2: "2nd Year", 3: "3rd Year", 4: "4th Year", 5: "5th Year" };
  return findOption("yearLevel", names[match[1]] || "");
}

// Validate and save each row. Row 1 is the header, so we start at 2.
async function importRows(rows) {
  const errors = [];
  let added = 0;

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i].map(function (cell) { return cell.trim(); });
    const rowNumber = i + 1;

    const idNumber = r[0] || "";
    const name = r[1] && r[2] ? r[1] + ", " + r[2] : "";
    const program = findOption("section", r[3] || "");
    const year = normalizeYear(r[4] || "");

    if (r[3] && !program) {
      errors.push("Row " + rowNumber + ": program '" + r[3] + "' is not in the list.");
      continue;
    }
    if (r[4] && !year) {
      errors.push("Row " + rowNumber + ": year level '" + r[4] + "' is not valid.");
      continue;
    }

    // Same rules as the form (from attendees.js)
    const error = validateAttendee(idNumber, name, program, year, null);
    if (error) {
      errors.push("Row " + rowNumber + ": " + error);
      continue;
    }

    try {
      await addAttendee(idNumber, name, program, year);
      added++;
    } catch (err) {
      errors.push("Row " + rowNumber + ": could not save (" + err.message + ").");
    }
  }

  return { added: added, errors: errors };
}

// When the Import button is clicked
async function handleImport() {
  const file = document.getElementById("importFile").files[0];
  const message = document.getElementById("importMessage");
  const errorList = document.getElementById("importErrors");
  const importBtn = document.getElementById("importBtn");
  errorList.innerHTML = "";

  if (!file) {
    message.textContent = "Choose a CSV file first.";
    message.className = "message error";
    return;
  }
  if (!/\.csv$/i.test(file.name)) {
    message.textContent = "Only .csv files are supported.";
    message.className = "message error";
    return;
  }

  const reader = new FileReader();
  reader.onload = async function () {
    const rows = parseCsv(reader.result);

    if (rows.length < 2) {
      message.textContent = "The file has no data rows.";
      message.className = "message error";
      return;
    }

    importBtn.disabled = true;
    message.textContent = "Importing...";
    message.className = "message";

    const result = await importRows(rows);

    importBtn.disabled = false;
    message.textContent = "Imported " + result.added + " attendee(s). Skipped " + result.errors.length + " row(s).";
    message.className = result.errors.length === 0 ? "message success" : "message error";

    // Show up to 20 problems
    result.errors.slice(0, 20).forEach(function (text) {
      const li = document.createElement("li");
      li.textContent = text;
      errorList.appendChild(li);
    });

    document.getElementById("importFile").value = "";
    renderTable();
  };
  reader.readAsText(file);
}

// Download an example file
function downloadTemplate() {
  const csv =
    "IDNumber,LastName,FirstName,Program,YearLevel\r\n" +
    "20240001,Dela Cruz,Juan M.,BSIT,1st Year\r\n" +
    "20240002,Santos,Maria,BSCpE,2nd Year\r\n";

  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "attendees-template.csv";
  link.click();
  URL.revokeObjectURL(link.href);
}

document.getElementById("importBtn").addEventListener("click", handleImport);
document.getElementById("templateBtn").addEventListener("click", downloadTemplate);