async function searchStudentProfile() {
  const searchInput = document.getElementById("searchStudentId");
  if (!searchInput) return;

  const studentId = searchInput.value.trim();
  if (!studentId) {
    showToast("Please enter a Student ID first", "error");
    return;
  }

  try {
    // 1. Fetch data from your MongoDB profiles collection
    const response = await fetch(`http://localhost:3000/users/search/profile?studentId=${studentId}`);
    const data = await response.json();

    if (!response.ok) {
      showToast(data.message || "Student profile not found in database", "error");
      return;
    }

    showToast("Student records loaded successfully", "success");

    // 2. Automatically fill your form inputs with the data found in MongoDB
    // (Make sure these IDs match the input fields on your edit page!)
    if (document.getElementById("firstName")) document.getElementById("firstName").value = data.firstName || "";
    if (document.getElementById("surname")) document.getElementById("surname").value = data.surname || "";
    if (document.getElementById("otherName")) document.getElementById("otherName").value = data.otherName || "";
    if (document.getElementById("email")) document.getElementById("email").value = data.email || "";

    // If your page renders a performance/grades table, call it here:
    if (typeof renderPerformanceTable === "function") {
      renderPerformanceTable(data);
    }

  } catch (error) {
    console.error("Search error:", error);
    showToast("Failed to connect to server backend", "error");
  }
}

const user = JSON.parse(localStorage.getItem("currentUser"));

if (!user || user.role === "student") {
  window.location.href = "login.html";
}

let currentFilteredResults = [];
let hideIdTimeout;

const resultStore = JSON.parse(localStorage.getItem("results")) || {};
const studentRecord = document.getElementById("studentRecord");

const schoolOrder = ["SS1", "SS2", "SS3"];
const termOrder = ["First Term", "Second Term", "Third Term"];

function filterResults() {
  const studentId = document.getElementById("studentId").value.trim();

  if (!studentId) {
    showToast("Enter student ID", "info");
    return;
  }
// openHeader(key, studentId); 
  render(studentId, termOrder);
  showStudentId(studentId);
  openHeader('${key}','${id}');
}

function render(studentId, terms) {
  studentRecord.innerHTML = "";

  const results = allSessionByStudent(studentId);

  if (!results.length) {
    studentRecord.innerHTML = `
      <tr>
        <td colspan="5" class="text-center p-4 text-red-500">
          No results found
        </td>
      </tr>
    `;
    return;
  }

  const filteredResults = results.map(result => {
    const subjects = result.studentData.subjects || {};
    const newSubjects = {};

    Object.entries(subjects).forEach(([key, sub]) => {
      const filteredSub = { subject: sub.subject };

      terms.forEach(term => {
        filteredSub[term] = sub[term] ?? "-";
      });

      newSubjects[key] = filteredSub;
    });

    return {
      key: result.key,
      studentData: {
        ...result.studentData,
        subjects: newSubjects
      }
    };
  });

  currentFilteredResults = filteredResults;

  const student = filteredResults[0]?.studentData?.student || {};

  let tablesHTML = "";

  filteredResults.forEach(result => {
    tablesHTML += renderTable(result.key, terms, result.studentData);
  });

  studentRecord.innerHTML = `
    <tr>
      <td colspan="5">
        <div class="p-4">
          <!-- Student Info -->
          <div class="mb-4">
            <p><strong>Name:</strong> 
              ${student.surname?.toUpperCase() || ""}, ${student.firstName || ""} ${student.otherName || ""}
            </p>
            <p><strong>ID:</strong> ${student.studentId || ""}</p>
          </div>

          <!-- Tables -->
          ${tablesHTML}

          <div class="flex justify-center p-2"><button onclick="generateTranscript('${student.studentId}')"
            class="bg-blue-600 text-white px-2 py-1.5 rounded">
            Generate Transcript
          </button></div>
        </div>
      </td>
    </tr>
  `;
}

function renderTable(key, terms, studentData) {
  const store = resultStore[key];
  if (!store) return "";

  const { session, school } = store;
  const { subjects } = studentData;

  const termHeaders = terms.map(t => `<th class="p-2">${t}</th>`).join("");

  const rows = Object.values(subjects).map((sub, i) => `
    <tr>
      <td class="p-2">${sub.subject}</td>
      ${terms.map(t => `<td class="p-2 text-center">${sub[t]}</td>`).join("")}
    </tr>
  `).join("");

  return `
    <div class="mb-2 border rounded p-2">
      <div class="flex justify-between mb-2">
        <span><strong>Year:</strong> ${session}</span>
        <span><strong>Class:</strong> ${school}</span>
      </div>

      <table class="w-full border">
        <thead class="bg-gray-800 text-white">
          <tr>
            <th>Subject</th>
            ${termHeaders}
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

    </div>
  `;
}

function allSessionByStudent(studentId) {
  const results = [];

  sortSession().forEach(key => {
    const store = resultStore[key];
    if (!store || !store.students) return;

    const studentData = store.students[studentId];

    if (studentData) {
      results.push({ key, studentData });
    }
  });

  return results;
}

function sortSession() {
  return Object.keys(resultStore).sort((a, b) => {
    const [yearA, schoolA] = a.split("-");
    const [yearB, schoolB] = b.split("-");

    return (
      parseInt(yearA) - parseInt(yearB) ||
      schoolOrder.indexOf(schoolA) - schoolOrder.indexOf(schoolB)
    );
  });
}

function showStudentId(studentId) {
  const box = document.getElementById("idBox");
  const displayBox = document.getElementById("displayStudentId");
  const input = document.getElementById("studentId");

  if (!box || !displayBox || !input) return;

  input.value = studentId;
  displayBox.textContent = studentId;

  box.classList.remove("hidden");

  if (hideIdTimeout) clearTimeout(hideIdTimeout);

  hideIdTimeout = setTimeout(() => {
    box.classList.add("hidden");
  }, 5000);
}

function boxid() {
  const box = document.getElementById("studentIdBox");
  const container = document.getElementById("idBox");
  const input = document.getElementById("studentId");
  const display = document.getElementById("displayStudentId");

  if (!box || !container) return;

  const studentId = localStorage.getItem("selectedStudentId");

  if (!studentId) {
    container.classList.add("hidden");
    return;
  }

  box.textContent = studentId;
  if (display) display.textContent = studentId;
  if (input) input.value = studentId;

  container.classList.remove("hidden");
   localStorage.removeItem("selectedStudentId");
  if (hideIdTimeout) clearTimeout(hideIdTimeout);

  hideIdTimeout = setTimeout(() => {
    container.classList.add("hidden");
  }, 500);
}

document.addEventListener("DOMContentLoaded", () => {
  boxid();
});  

function generateTranscript(studentId) {
  if (!currentFilteredResults.length) {
    showToast("No result available");
    return;
  }

  localStorage.setItem("selectedTerms", JSON.stringify(termOrder));

  localStorage.setItem(
    "finalTranscript",
    JSON.stringify(currentFilteredResults)
  );

  window.location.href = "transcript.html";
}

  function showTab(tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    
    document.getElementById(tab).classList.remove('hidden');
  }

function openHeader(key, studentId) {
  showTab("header");
  editStudent(key, studentId);
}