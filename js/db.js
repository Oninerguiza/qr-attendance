// Database helper using localStorage.
// Each "table" is stored as a JSON array under its own key.

const TABLES = ["admins", "attendees", "attendance"];

// Create empty tables the first time the app runs
function initDatabase() {
  TABLES.forEach(function (table) {
    if (localStorage.getItem(table) === null) {
      localStorage.setItem(table, JSON.stringify([]));
    }
  });

  // Default settings (late cutoff time)
  if (localStorage.getItem("settings") === null) {
    localStorage.setItem("settings", JSON.stringify({ lateCutoff: "08:00" }));
  }
}

// Read all records from a table
function getData(table) {
  return JSON.parse(localStorage.getItem(table)) || [];
}

// Replace all records in a table
function saveData(table, data) {
  localStorage.setItem(table, JSON.stringify(data));
}