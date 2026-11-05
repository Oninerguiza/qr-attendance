// Attendee management: add, edit, delete, list

let editingId = null; // null = adding new, otherwise the id being edited

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
  const duplicate = getData("attendees").some(function (a) {
    return a.idNumber === idNumber && a.id !== currentId;
  });
  if (duplicate) {
    return "That ID number already exists.";
  }

  return "";
}

// Add a new attendee
function addAttendee(idNumber, name, section, yearLevel) {
  const attendees = getData("attendees");
  attendees.push({
    id: Date.now(),
    idNumber: idNumber,
    name: name,
    section: section,
    yearLevel: yearLevel
  });
  saveData("attendees", attendees);
}

// Update an existing attendee
function updateAttendee(id, idNumber, name, section, yearLevel) {
  const attendees = getData("attendees");
  const person = attendees.find(function (a) { return a.id === id; });
  if (person) {
    person.idNumber = idNumber;
    person.name = name;
    person.section = section;
    person.yearLevel = yearLevel;
    saveData("attendees", attendees);
  }
}

// Delete an attendee
function deleteAttendee(id) {
  const attendees = getData("attendees").filter(function (a) {
    return a.id !== id;
  });
  saveData("attendees", attendees);
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
  const attendees = getData("attendees");
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
    deleteBtn.addEventListener("click", function () {
      if (confirm("Delete " + person.name + "?")) {
        deleteAttendee(person.id);
        if (editingId === person.id) resetForm();
        showMessage("Attendee deleted.", "success");
        renderTable();
      }
    });

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    row.appendChild(actions);
    tbody.appendChild(row);
  });
}

// Handle the form submit (add or update)
function handleSubmit(event) {
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

  if (editingId === null) {
    addAttendee(idNumber, name, section, yearLevel);
    showMessage("Attendee added.", "success");
  } else {
    updateAttendee(editingId, idNumber, name, section, yearLevel);
    showMessage("Attendee updated.", "success");
  }

  resetForm();
  renderTable();
}