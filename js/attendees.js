// Attendee management: add, edit, delete, list (saved online in Firestore)
// The document ID of each attendee is their 8-digit ID number.
// The QR check-in page relies on this.

import {
  auth, db, onAuthStateChanged,
  collection, doc, setDoc, getDocs, deleteDoc
} from "./firebase-init.js";

let editingId = null;      // null = adding new, otherwise the ID number being edited
let attendeesCache = [];   // list of attendees loaded from Firestore

// Load every attendee from Firestore into attendeesCache
async function loadAttendees() {
  const snapshot = await getDocs(collection(db, "attendees"));
  attendeesCache = snapshot.docs.map(function (d) {
    const data = d.data();
    return {
      id: d.id,                       // same as the ID number
      idNumber: data.idNumber || d.id,
      name: data.name || "",
      section: data.section || "",
      yearLevel: data.yearLevel || ""
    };
  });
  attendeesCache.sort(function (a, b) { return a.name.localeCompare(b.name); });
}

// Check the input. Returns an error message, or "" if everything is OK.
function validateAttendee(idNumber, name, section, yearLevel, currentId) {
  if (!idNumber || !name || !section || !yearLevel) {
    return "Please fill in all fields.";
  }

  // ID number: exactly 8 digits
  if (!/^[0-9]{8}$/.test(idNumber)) {
    return "ID number must be exactly 8 digits (numbers only).";
  }

  // Name format: Family Name, First Name
  if (!/^[A-Za-zÀ-ÿñÑ.'\- ]+,\s*[A-Za-zÀ-ÿñÑ.'\- ]+$/.test(name)) {
    return "Enter the name as: Family Name, First Name (e.g. Dela Cruz, Juan M.)";
  }

  // No duplicate ID numbers
  const duplicate = attendeesCache.some(function (a) {
    return a.idNumber === idNumber && a.id !== currentId;
  });
  if (duplicate) {
    return "That ID number already exists.";
  }

  return "";
}

// Add a new attendee
async function addAttendee(idNumber, name, section, yearLevel) {
  await setDoc(doc(db, "attendees", idNumber), {
    idNumber: idNumber,
    name: name,
    section: section,
    yearLevel: yearLevel
  });
  attendeesCache.push({ id: idNumber, idNumber: idNumber, name: name, section: section, yearLevel: yearLevel });
  attendeesCache.sort(function (a, b) { return a.name.localeCompare(b.name); });
}

// Update an existing attendee
async function updateAttendee(oldId, idNumber, name, section, yearLevel) {
  await setDoc(doc(db, "attendees", idNumber), {
    idNumber: idNumber,
    name: name,
    section: section,
    yearLevel: yearLevel
  });

  // If the ID number changed, the document ID changes too, so remove the old one
  if (oldId !== idNumber) {
    await deleteDoc(doc(db, "attendees", oldId));
  }
  await loadAttendees();
}

// Delete an attendee
async function deleteAttendee(id) {
  await deleteDoc(doc(db, "attendees", id));
  attendeesCache = attendeesCache.filter(function (a) { return a.id !== id; });
}

// Show a message under the form
function showMessage(text, type) {
  const message = document.getElementById("message");
  message.textContent = text;
  message.className = "message " + type;
}

// Reset the form back to "add" mode
function resetForm() {
  editingId = null;
  document.getElementById("attendeeForm").reset();
  document.getElementById("saveBtn").textContent = "Add attendee";
  document.getElementById("cancelBtn").style.display = "none";
}

// Put an attendee's data into the form so it can be edited
function startEdit(person) {
  editingId = person.id;
  document.getElementById("idNumber").value = person.idNumber;
  document.getElementById("name").value = person.name;
  document.getElementById("section").value = person.section;
  document.getElementById("yearLevel").value = person.yearLevel || "";
  document.getElementById("saveBtn").textContent = "Update attendee";
  document.getElementById("cancelBtn").style.display = "inline-block";
  document.getElementById("idNumber").focus();
}

// Make a table cell with safe text
function makeCell(text) {
  const td = document.createElement("td");
  td.textContent = text;
  return td;
}

// Draw the attendee table
function renderTable() {
  const attendees = attendeesCache;
  const tbody = document.getElementById("attendeeBody");
  tbody.innerHTML = "";

  document.getElementById("count").textContent = "Total attendees: " + attendees.length;

  if (attendees.length === 0) {
    const row = document.createElement("tr");
    const cell = makeCell("No attendees yet. Add one above.");
    cell.colSpan = 4;
    row.appendChild(cell);
    tbody.appendChild(row);
    return;
  }

  attendees.forEach(function (person) {
    const row = document.createElement("tr");
    row.appendChild(makeCell(person.idNumber));
    row.appendChild(makeCell(person.name));

    // Program and year level together, e.g. "BSCpE - 1st Year"
    const programYear = person.yearLevel
      ? person.section + " - " + person.yearLevel
      : person.section; // old records without a year level
    row.appendChild(makeCell(programYear));

    // Action buttons
    const actions = document.createElement("td");

    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.className = "small";
    editBtn.addEventListener("click", function () { startEdit(person); });

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.className = "small danger";
    deleteBtn.addEventListener("click", async function () {
      if (confirm("Delete " + person.name + "?")) {
        try {
          await deleteAttendee(person.id);
          if (editingId === person.id) resetForm();
          showMessage("Attendee deleted.", "success");
          renderTable();
        } catch (error) {
          showMessage("Could not delete: " + error.message, "error");
        }
      }
    });

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    row.appendChild(actions);
    tbody.appendChild(row);
  });
}

// Handle the form submit (add or update)
async function handleSubmit(event) {
  event.preventDefault();

  const idNumber = document.getElementById("idNumber").value.trim();
  const name = document.getElementById("name").value.trim();
  const section = document.getElementById("section").value;
  const yearLevel = document.getElementById("yearLevel").value;

  const error = validateAttendee(idNumber, name, section, yearLevel, editingId);
  if (error) {
    showMessage(error, "error");
    return;
  }

  try {
    if (editingId === null) {
      await addAttendee(idNumber, name, section, yearLevel);
      showMessage("Attendee added.", "success");
    } else {
      await updateAttendee(editingId, idNumber, name, section, yearLevel);
      showMessage("Attendee updated.", "success");
    }
    resetForm();
    renderTable();
  } catch (err) {
    showMessage("Could not save: " + err.message, "error");
  }
}

// Start the page: require sign-in, load the list, then connect the form
onAuthStateChanged(auth, async function (user) {
  if (!user) {
    window.location.href = "index.html"; // login page
    return;
  }
  try {
    await loadAttendees();
    renderTable();
  } catch (error) {
    showMessage("Could not load attendees: " + error.message, "error");
  }
});

document.getElementById("attendeeForm").addEventListener("submit", handleSubmit);
document.getElementById("cancelBtn").addEventListener("click", resetForm);

// import.js uses these
export { validateAttendee, addAttendee, renderTable, loadAttendees };