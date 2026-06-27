const user = JSON.parse(localStorage.getItem("currentUser"));

// if (!user || user.role !== "admin") {
//   window.location.href = "login.html";
// }

const resultStore = JSON.parse(localStorage.getItem("results")) || {};

const container = document.getElementById("courseContainer");
const resultsContainer = document.getElementById("resultsContainer");

let rowId = Number(localStorage.getItem("rowId")) || 0;
let deleteMode = false;

const termOrder = ["First Term", "Second Term", "Third Term"];
const schoolOrder = ["SS1", "SS2", "SS3"];
  
function addRow(existingData = {}) {
  // rowId++;
  // // localStorage.setItem("rowId", rowId);

  const row = document.createElement("div");
  row.className = "flex justify-between gap-2 lg:grid lg:grid-cols-2 lg:gap-6 mb-2";
  row.dataset.id = existingData.id || rowId;

 row.innerHTML = `
  <div class="flex flex-col">
    <label class="block font-medium px-1.5 mb-1">Subject</label>
    <select class="w-full shadow-sm shadow-blue-600 backdrop-blur-md rounded-lg focus:ring-blue-500 focus:border-blue-500 px-4 lg:px-6 py-2 subject" data-id="${rowId}" required>
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

  <div class="flex flex-col w-full">
    <label class="block font-medium px-1.5 mb-1">Grade</label>

    <div class="flex items-center gap-2">
      <select class="flex-1 shadow-sm shadow-blue-600 backdrop-blur-md rounded-lg focus:ring-blue-500 focus:border-blue-500 px-4 lg:px-6 py-2 grade" data-id="${rowId}" required>
        <option value="">Select Grade</option>
        <option value="A">A (70-100)</option>
        <option value="B">B (60-69)</option>
        <option value="C">C (50-59)</option>
        <option value="D">D (40-49)</option>
        <option value="E">E (30-39)</option>
        <option value="F">F (0-29)</option>
      </select>

      <button
        type="button"
        class="delete-btn hidden font-bold text-red-500">
        ✕
      </button>
    </div>
  </div>
`;
  container.appendChild(row);

  // Prefill
  if (existingData.subject) {
    row.querySelector(".subject").value = existingData.subject;
  }

  if (existingData.grade) {
    row.querySelector(".grade").value = existingData.grade;
  }
}
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("delete-btn")) {
    const row = e.target.closest("[data-id]");
    if (!row) return;

    if (!confirm("Delete?")) return;
    row.remove();
  }
});  

function toggleDeleteMode() {
  deleteMode = !deleteMode;

  const toggleBtn =
    document.getElementById("deleteModeBtn");

  document
    .querySelectorAll(".delete-btn")
    .forEach(btn =>
      btn.classList.toggle("hidden", !deleteMode)
    );

  if (toggleBtn) {
    toggleBtn.classList.toggle(
      "bg-red-600",
      deleteMode
    );

    toggleBtn.classList.toggle(
      "text-white",
      deleteMode
    );
  }

  if (deleteMode) {
    setTimeout(() => {
      deleteMode = false;

      document
        .querySelectorAll(".delete-btn")
        .forEach(btn =>
          btn.classList.add("hidden")
        );

      if (toggleBtn) {
        toggleBtn.classList.remove(
          "bg-red-600",
          "text-white"
        );
      }
    }, 3000); 
  }
}


// CHECK DUPLICATES
function duplicate(subjects) {
  return new Set(subjects).size !== subjects.length;
}

function profile() {
  const session = document.getElementById("session").value.trim();
  const term = document.getElementById("term").value;
  const email = document.getElementById("email").value;
  const school = document.getElementById("school").value;
  const surname = document.getElementById("surname").value;
  const firstName = document.getElementById("firstName").value;
  const otherName = document.getElementById("otherName").value;
  const studentId = document.getElementById("studentId").value;
  
  if (!session || !term || !school || !surname || !firstName || !studentId || !email) {
  showToast("Fill in required details");
    return;
  }
    
  const student = {
    surname, firstName, otherName, studentId, email
  };

  const rows = document.querySelectorAll("#courseContainer > [data-id]");
  const data = [];

  rows.forEach(row => {
    const id = row.dataset.id;
    const subject = row.querySelector(".subject").value;
    const grade = row.querySelector(".grade").value;

       if (!subject || !grade) {
  showToast("No records");
    return null; 
       }
    
    data.push({
      id, subject, term: [], grade
    });
  });
  
  const subjects = data.map(item => item.subject);
  if (duplicate(subjects)) {
    showToast("Duplicate subjects not allowed.");
   return null;
  }
  return {session, term, school, student, data};
}

// SUBMIT FORM
document.getElementById("courseForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const result = profile(); 
  if (!result) return;

  try {
    const response = await fetch("http://localhost:3000/users/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(result)
    });

    if (response.ok) {
      showToast("All records saved into the Database successfully!", "success");
      saveData(result.session, result.term, result.data, result.school, result.student); 
    } else {
      const errorData = await response.json().catch(() => ({}));
      showToast(errorData.message || "Failed to save records to server.", "error");
    }

  } catch (error) {
    console.error("Network connection error:", error);
    showToast("Cannot connect to server.", "error");
  }
});
function saveData(session, term, data, school, students) {
  const USERS_KEY = "registeredUsers";

  const key = `${session}-${school}`;

  // ================= CREATE STORE =================
  if (!resultStore[key]) {
    resultStore[key] = {
      session,
      school,
      students: {}
    };
  }

  // ================= CREATE STUDENT =================
  if (!resultStore[key].students[students.studentId]) {
    resultStore[key].students[students.studentId] = {
      student: students,
      subjects: {},
      terms: []
    };
  }

  const currentStudent = resultStore[key].students[students.studentId];

  // ================= USERS STORAGE =================
  let users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];

  // 🔥 Normalize email
  const email = students.email.toLowerCase();

  // 🔴 CHECK DUPLICATE EMAIL (SAFE)
  const emailExists = users.some(
    u =>
      u.email?.toLowerCase() === email &&
      u.studentId !== students.studentId
  );

  if (emailExists) {
    showToast("Email already exists", "error");
     return {session, term, school, student, data};
  }

  // ✅ CHECK EXISTING USER
  const existingUser = users.find(u => u.studentId === students.studentId);

  if (existingUser) {
    // Update existing
    existingUser.email = email;
    existingUser.firstName = students.firstName;
    existingUser.surname = students.surname;
  } else {
    // Add new
    users.push({
      studentId: students.studentId,
      email: email,
      firstName: students.firstName,
      surname: students.surname,
      role: "student"
    });
  }

  localStorage.setItem(USERS_KEY, JSON.stringify(users));

  // ================= TERMS =================
  if (!currentStudent.terms.includes(term)) {
    currentStudent.terms.push(term);
    currentStudent.terms.sort(
      (a, b) => termOrder.indexOf(a) - termOrder.indexOf(b)
    );
  }

  // ================= SUBJECTS (FIXED LOGIC) =================
  data.forEach(item => {
    const subjectKey = item.subject;

    if (!currentStudent.subjects[subjectKey]) {
      currentStudent.subjects[subjectKey] = {
        subject: item.subject
      };
    }

    currentStudent.subjects[subjectKey][term] = item.grade;
  });

  // ================= SAVE =================
  localStorage.setItem("results", JSON.stringify(resultStore));
}

function sessionTable(key) {
  const tableId = key.replace(/\s+/g, "-");
  const existing = document.getElementById(tableId);

  const { students, session, school } = resultStore[key];

  let tablesHTML = "";

  // Iterate over each student
  Object.values(students).forEach(({ student, subjects, terms }) => {
    const termCol = terms.map(term => `<th class="p-2">${term}</th>`).join("");

    const subjectRow = Object.values(subjects).map((item, index) => `
      <tr>
        <td class="p-2 text-center">${index + 1}</td>
        <td class="p-2">${item.subject}</td>
        ${terms.map(term => `<td class="p-2 text-center">${item[term] || "-"}</td>`).join("")}
      </tr>
    `).join("");

    tablesHTML += `
       <h3 class="text-lg text-blue-600 font-bold mt-3 p-4">Academic Record</h3>
      <div class="flex flex-col mb-2 text-black">
        <span><strong>Full Name:</strong> ${student.surname}, ${student.firstName} ${student.otherName || ""}</span>
        <span><strong>ID:</strong> ${student.studentId}</span>
          <span><strong>Email:</strong> ${student.email}</span>
        <span><strong>Year:</strong> ${session}</span>
        <span><strong>Class:</strong> ${school}</span>
      </div>

      <table class="w-full border text-sm text-black mb-4">
        <thead>
          <tr>
            <th class="p-2">#</th>
            <th class="p-2">Subject</th>
            ${termCol}
          </tr>
        </thead>
        <tbody>
          ${subjectRow}
        </tbody>
      </table>
    `;
  });

  if (existing) {
    existing.innerHTML = tablesHTML;
  } else {
    const result = document.createElement("div");
    result.id = tableId;
    result.className = "p-4 rounded shadow mb-2";
    result.innerHTML = tablesHTML;
    resultsContainer.appendChild(result);
  }
}
// session sorter
function sortSession() {
  return Object.keys(resultStore).sort((a, b) => {
    const [yearA, schoolA] = a.split("-");
    const [yearB, schoolB] = b.split("-");
    // 1. Sort by year
    const yearDiff = parseInt(yearA) - parseInt(yearB);
    if (yearDiff !== 0) return yearDiff;
    // 2. Sort by school
    return schoolOrder.indexOf(schoolA) - schoolOrder.indexOf(schoolB);
  });
}

function allSession() {
  resultsContainer.innerHTML = "";
  sortSession().forEach(key => sessionTable(key));
}
// Year function
function years() {
  const select = document.getElementById("session");
  const startYear = 1999;
  const currentYear = new Date().getFullYear();

  for (let year = currentYear; year >= startYear; year--) {
    const option = document.createElement("option");
    option.value = `${year}/${year+1}`;
    option.textContent = `${year}/${year+1}`;
    select.appendChild(option);
  }
}
// global functioncall
years();
for (let i = 0; i<7; i++) addRow();

function handlePreview() {
  const result = profile();
  const { session, term, school, student, data } = result;
  
  resultsContainer.innerHTML = "";

  let rows = data.map((item, index) => `
    <tr>
      <td class="p-1 text-center">${index + 1}</td>
      <td class="p-2">${item.subject}</td>
      <td class="p-1 text-center">${item.grade}</td>
    </tr>
  `).join("");
  
    if (!rows || !result) {
  showToast("No records");
    return;
  }

  resultsContainer.innerHTML = `
   <div class="p-4">
     <!-- Student Info -->
    <div class="flex flex-col mb-4 text-sm p-2 rounded-lg">
      <span><strong>Full name:</strong> 
        ${student?.surname || ""}, 
        ${student?.firstName || ""} 
        ${student?.otherName || ""}
      </span>
      <span><strong>ID:</strong> ${student?.studentId || ""}</span>
     <span><strong>Email:</strong> ${student.email}</span>
    </div>
    <!-- Tables -->
   <div class="flex justify-between mb-2">
   <span><strong>Year:</strong> ${session}</span>
   <span><strong>Class:</strong> ${school}</span>
  </div>
      <table class="w-full border p-2 text-sm text-black">
         <thead class="bg-gray-500">
          <tr>
            <th class="p-2 text-center">#</th>
            <th class="p-2">Subject</th>
            <th class="p-2 text-center">${term}</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      </div>
  `;
 showToast("Preview loaded", "info");
}
