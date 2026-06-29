const user = JSON.parse(localStorage.getItem("currentUser"));

// if (!user || user.role !== "admin") {
//   window.location.href = "login.html";
// }

const container = document.getElementById("courseContainer");
const studentRecord = document.getElementById("studentRecord");

const termOrder = ["First Term", "Second Term", "Third Term"];

// Track the single document database ID and student metadata globally while editing
let currentDatabaseId = null;
let currentSession = null;
let currentSchool = null;
let deleteMode = false;

function addRow(existingData = {}) {
  // Use simple unique identifiers for dynamic DOM management
  const id = existingData.id || "row-" + Date.now() + Math.random().toString(36).substr(2, 4);

  const row = document.createElement("div");  
  row.className = "flex justify-evenly gap-2 mb-4 subject-row";
  row.dataset.id = id;

  row.innerHTML = `
    <div class="flex flex-col">
      <label class="block font-medium px-1.5 mb-1">Subject</label>
      <select class="w-40 lg:w-70 shadow-sm shadow-blue-600 backdrop-blur-md rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 subject" required>
        <option value="">Select Subject</option>
        <option value="Mathematics">Mathematics</option>
        <option value="English Language">English</option>
        <option value="Chemistry">Chemistry</option>
        <option value="Physics">Physics</option>
        <option value="Biology">Biology</option>
        <option value="Further Mathematics">Further Mathematics</option>
        <option value="Geography">Geography</option>
        <option value="Literature">Literature</option>
        <option value="Agricultural Science">Agricultural Science</option>
        <option value="Economics">Economics</option>
        <option value="Fisheries">Fisheries</option>
      </select> 
    </div>
    <div class="flex flex-col">
      <label class="block font-medium px-1.5 mb-1">Grade</label>
      <select class="w-25 shadow-sm shadow-blue-600 backdrop-blur-md rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 grade" required>
        <option value="">Select Grade</option>
        <option value="-">NIL</option>
        <option value="A">A</option>
        <option value="B">B</option>
        <option value="C">C</option>
        <option value="D">D</option>
        <option value="E">E</option>
        <option value="F">F</option>
      </select>   
    </div>
    <button type="button" class="delete-btn hidden text-red-500 font-bold self-end mb-2">X</button>
  `;

  container.appendChild(row);

  if (existingData.subject) row.querySelector(".subject").value = existingData.subject;
  if (existingData.grade) row.querySelector(".grade").value = existingData.grade;
}

// Global removal engine for visual DOM row elements
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("delete-btn")) {
    const row = e.target.closest("[data-id]");
    if (!row) return;
    if (confirm("Remove this subject row?")) {
      row.remove();
    }
  }
});  

function toggleDeleteMode() {
  deleteMode = !deleteMode;
  const toggleBtn = document.getElementById("toggleDeleteBtn");

  document.querySelectorAll(".delete-btn").forEach(btn => btn.classList.toggle("hidden", !deleteMode));

  if (toggleBtn) {
    toggleBtn.classList.toggle("bg-red-600", deleteMode);
    toggleBtn.classList.toggle("text-white", deleteMode);
  }
}

// 2. SEARCH ENGINE: PULL DATA DIRECTLY FROM MONGODB
async function filterResults() {
  // ✅ Rename the domestic selector variable to "inputEl" to completely avoid global naming clashes
  const inputEl = document.getElementById("studentId");
  
  if (!inputEl) {
    console.error("Could not locate the #studentId input element in the DOM tree.");
    return;
  }

  const id = inputEl.value.trim();
  console.log("Frontend collected ID to search:", id); // Check your browser console log!

  if (!id) {
    showToast("Enter student ID", "info");
    return;
  }

  studentRecord.innerHTML = "";

  try {
    // Fire the query with the safely isolated variable string
    const response = await fetch(`http://localhost:3000/users/search/profile?studentId=${id}`);
    
    if (!response.ok) {
      studentRecord.innerHTML = `
        <tr>
          <td colspan="5" class="text-center p-4 text-red-500 font-semibold">No portfolio record found for ID: ${id}</td>
        </tr>`;
      return;
    }

    const dbRecord = await response.json();
    
    currentDatabaseId = dbRecord._id;
    currentSession = dbRecord.session;
    currentSchool = dbRecord.school;

    const rowsHtml = dbRecord.results.map(sub => `
      <tr class="border-b text-slate-700">
        <td class="px-2 py-1.5">${sub.subject}</td>
        <td class="px-2 py-1.5 text-center font-bold text-blue-600">${sub.grade || "-"}</td>
      </tr>
    `).join("");

    const parsedTableHtml = `
      <div class="mb-4 p-2">
        <div class="flex justify-between items-center px-2 mb-2">
          <span class="text-slate-600 font-medium"><strong>${dbRecord.session} | ${dbRecord.school}</strong></span>
          <button onclick="openEdit()" class="text-blue-600 font-bold hover:text-green-600 transition">Edit Portfolio</button>
        </div>
        <table class="w-full border mt-1 text-sm">
          <thead class="bg-slate-800 text-white text-left">
            <tr>
              <th class="px-2 py-1">Subject</th>
              <th class="px-2 py-1 text-center">${dbRecord.term}</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>
    `;

    studentRecord.innerHTML = `
      <tr><td class="block text-xl lg:text-3xl text-center font-bold p-4 text-blue-600">ACADEMIC PORTFOLIO</td></tr>
      <tr><td class="px-4 text-sm"><strong>Name:</strong> ${(dbRecord.surname || "").toUpperCase()}, ${dbRecord.firstName || ""} ${dbRecord.otherName || ""}</td></tr>
      <tr><td class="px-4 text-sm"><strong>Student ID:</strong> ${dbRecord.studentId}</td></tr>
      <tr><td class="px-4 text-sm mb-4"><strong>Registered Email:</strong> ${dbRecord.email}</td></tr>
      <tr><td class="p-2">${parsedTableHtml}</td></tr>
    `;

  } catch (error) {
    console.error(error);
    showToast("Error establishing connection with database pipeline.", "error");
  }
} 

// 3. TRANSITION TO EDIT DASHBOARD LAYER
async function openEdit() {
  if (!currentDatabaseId) return;
  showTab("edits");

  try {
    // Look up the clean database entry by _id
    const response = await fetch(`http://localhost:3000/users/profile/${currentDatabaseId}`);
    const record = await response.json();

    // Fill textual static and input tags
    surname.value = record.surname || "";
    firstName.value = record.firstName || "";
    otherName.value = record.otherName || "";
    displayStudentId.textContent = record.studentId;
    displayYear.textContent = record.session;
    displaySchool.textContent = record.school;
    document.getElementById("editTerm").value = record.term;

    // Rebuild course selectors inside container 
    container.innerHTML = "";
    if (record.results && record.results.length > 0) {
      record.results.forEach(sub => {
        addRow({ subject: sub.subject, grade: sub.grade });
      });
    } else {
      addRow();
    }

  } catch (err) {
    console.error(err);
    showToast("Error retrieving profile editor payload context.", "error");
  }
}

// 4. PUT REQUEST: SAVE MERGED DOCUMENT RECORD TO SERVER
async function handleSubmit() {
  if (!currentDatabaseId) return showToast("Missing structural context key", "error");

  const term = document.getElementById("editTerm").value;
  if (!term) return showToast("Please select a target active term", "error");

  // Read clean input lists
  const rows = document.querySelectorAll("#courseContainer > .subject-row");
  const nestedResults = [];

  for (const r of rows) {
    const subject = r.querySelector(".subject").value;
    const grade = r.querySelector(".grade").value;

    if (!subject || !grade) return showToast("Fill all subject elements or remove empty rows", "error");
    nestedResults.push({ subject, grade });
  }

  // Pack data to match backend schema expectation
  const updatedPayload = {
    surname: surname.value.trim(),
    firstName: firstName.value.trim(),
    otherName: otherName.value.trim(),
    term: term,
    results: nestedResults
  };

  try {
    const response = await fetch(`http://localhost:3000/users/profile/${currentDatabaseId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedPayload)
    });

    if (response.ok) {
      showToast("Student profile successfully updated in database!", "success");
      openRecord();      // Return to review mode
      filterResults();   // Instantly update overview metrics
    } else {
      const errData = await response.json().catch(() => ({}));
      showToast(errData.message || "Failed saving payload data.", "error");
    }
  } catch (error) {
    console.error(error);
    showToast("Database transmission timeout.", "error");
  }
}

function showTab(tab) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.getElementById(tab).classList.remove('hidden');
}

function openRecord() {
  showTab("record");
}

document.getElementById("editTerm").addEventListener("change", () => {
  showToast(`Term changed contextually to ${document.getElementById("editTerm").value}`, "info");
});