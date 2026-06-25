const user = JSON.parse(localStorage.getItem("currentUser"));

if (!user || user.role !== "admin") {
  window.location.href = "login.html";
}

 const resultStore = JSON.parse(localStorage.getItem("results")) || {};
 const container = document.getElementById("courseContainer");
 const studentRecord = document.getElementById("studentRecord");

const termOrder = ["First Term","Second Term","Third Term"];

let editingKey = null;
let editingStudentId = null;
let deleteMode = false;



function addRow(existingData = {}) {
  const id = existingData.id || Date.now() + Math.random();

  const row = document.createElement("div");  
  row.className = "flex justify-evenly gap-2 mb-4";
  row.dataset.id = id;

  row.innerHTML = `
       <div class="flex flex-col"><label class="block font-medium px-1.5 mb-1">Subject</label>
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
      </select> </div>
    <div class="flex flex-col"><label class="block font-medium px-1.5 mb-1">Grade</label>
     <select class="w-25 shadow-sm shadow-blue-600 backdrop-blur-md rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 grade" required>
       <option value="">Select Grade</option>
         <option value="-">NIL</option>
        <option value="A">A</option>
        <option value="B">B</option>
        <option value="C">C</option>
        <option value="D">D</option>
        <option value="E">E</option>
        <option value="F">F</option>
      </select>   </div>

     <button type="button" class="delete-btn hidden text-red-500">X</button>
  `;

  container.appendChild(row);

  if (existingData.subject)
    row.querySelector(".subject").value = existingData.subject;

  if (existingData.grade)
    row.querySelector(".grade").value = existingData.grade;
}

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("delete-btn")) {
    const row = e.target.closest("[data-id]");
    if (!row) return;

    if (!confirm("Delete?")) return;

    const id = row.dataset.id;

    let data = JSON.parse(localStorage.getItem("results")) || {};
    delete data[id];
    localStorage.setItem("results", JSON.stringify(data));

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

function allSessionByStudent(studentId) {

  const results = [];

  Object.keys(resultStore).forEach(key => {
    const store = resultStore[key];
    const studentData = store.students?.[studentId];

    if (studentData) {
      results.push({ key, studentData });
    }
  });

  return results;
}

function updateStudent(term, data, student, session, school) {
  const key = editingKey || `${session}-${school}`;
  if (!resultStore[key])
    resultStore[key] = { session, school, students: {} };

  const students = resultStore[key].students;
  const id = editingStudentId || student.studentId;

  if (!students[id])
    students[id] = { student, subjects: {}, terms: [] };

  const current = students[id];

  current.student = { ...current.student, ...student };

  if (!current.terms.includes(term)) {
    current.terms.push(term);
    current.terms.sort((a, b) =>
      termOrder.indexOf(a) - termOrder.indexOf(b)
    );
  }

  const incomingIds = data.map(d => String(d.id));

  Object.keys(current.subjects).forEach(k => {
    if (!incomingIds.includes(String(current.subjects[k].id))) {
      delete current.subjects[k];
    }
  });

  data.forEach(d => {
    current.subjects[d.id] = {
      ...(current.subjects[d.id] || {}),
      id: d.id,
      subject: d.subject,
      [term]: d.grade
    };
  });

  localStorage.setItem("results", JSON.stringify(resultStore));

  showToast("Saved", "success");
}


function handleSubmit() {
  const term = document.getElementById("editTerm").value;

  const student = {
    surname: surname.value,
    firstName: firstName.value,
    otherName: otherName.value,
    studentId: editingStudentId || displayStudentId.textContent
  };

  if (!student.studentId) return showToast("Missing ID");

  // Select only the rows that are NOT marked as deleted
  const rows = document.querySelectorAll(
    "#courseContainer > div:not([data-deleted='true'])"
  );

  const data = [];

  for (const r of rows) {
    const subject = r.querySelector(".subject").value;
    const grade = r.querySelector(".grade").value;

    if (!subject || !grade) return showToast("Fill all");

    data.push({ id: r.dataset.id, subject, grade });
  }

  updateStudent(term, data, student);
}


function editStudent(key, id) {
  const s = resultStore[key]?.students?.[id];
  if (!s) return;

  editingKey = key;
  editingStudentId = id;

  surname.value = s.student.surname || "";
  firstName.value = s.student.firstName || "";
  otherName.value = s.student.otherName || "";

  displayStudentId.textContent = id;
  displayYear.textContent = resultStore[key].session;
  displaySchool.textContent = resultStore[key].school;

  edits.classList.remove("hidden");

 
  const latestTerm = s.terms?.length
    ? s.terms.at(-1)
    : termOrder[0];

  document.getElementById("editTerm").value = latestTerm;

  handleTermChange();
}


function handleTermChange() {
  if (!editingKey || !editingStudentId) return;

  const s = resultStore[editingKey]?.students?.[editingStudentId];
  if (!s) return;

  const selectedTerm = document.getElementById("editTerm").value;

  container.innerHTML = "";

  if (!Object.keys(s.subjects || {}).length) {
    addRow();
    return;
  }

  Object.values(s.subjects).forEach(sub => {
    addRow({
      id: sub.id,
      subject: sub.subject,
      grade: sub[selectedTerm] || ""
    });
  });

  showToast(`Editing ${selectedTerm}`, "info");
}


function filterResults() {

  const id = studentId.value.trim();
  if (!id) return showToast("Enter student ID", "info");

  studentRecord.innerHTML = "";

  const results = allSessionByStudent(id);

  if (!results.length) {
    studentRecord.innerHTML = `     <tr>
        <td colspan="5" class="text-center p-4 text-red-500">
          No results found
        </td>
      </tr>`;
    return;
  }

  let html = "";

  results.forEach(r => {
    html += renderTable(r.key, termOrder, r.studentData);
  });
const student = results[0]?.studentData?.student || {};
  studentRecord.innerHTML = `
  <tr><td class="block text-xl lg:text-3xl text-center font-bold p-4">ACADEMIC RECORDS</td>
  </tr>
  <tr><td class="px-4"><strong>Name:</strong> ${(student.surname || "").toUpperCase()}, ${student.firstName || ""} ${student.otherName || ""}</td></tr>
  <tr><td class="px-4"><strong>ID:</strong> ${student.studentId || id}</td></tr>
  <tr><td class="p-2">${html}</td></tr>`;
}


  function showTab(tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    
    document.getElementById(tab).classList.remove('hidden');
  }

function renderTable(key, terms, studentData) {

  const store = resultStore[key];

  const rows = Object.values(studentData.subjects).map((sub,i)=>`
    <tr>
      <td class="px-2 py-1">${sub.subject}</td>
      ${terms.map(t=>`<td class="px-2 py-1 text-center">${sub[t]||"-"}</td>`).join("")}
    </tr>
  `).join("");

  return `
    <div class="mb-4">
      <div class="flex justify-between px-2">
        <span><strong>${store.session} | ${store.school}</strong></span>

        <button onclick="openEdit('${key}','${studentData.student.studentId}')"
          class="text-blue-600 font-bold hover:text-green-600 animate-pulse">Edit</button>
      </div>

      <table colspan="5" class="w-full border mt-2">
        <thead class="bg-gray-800 text-white">
          <tr>
            <th class="px-2">Subject</th>
            ${terms.map(t=>`<th class="px-2 text-center">${t}</th>`).join("")}
          </tr>
        </thead>

        <tbody>${rows}</tbody>
      </table>

    </div>
  `;
}

  function showTab(tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.getElementById(tab).classList.remove('hidden');
  }

function openEdit(key, studentId) {
  showTab("edits");
  editStudent(key, studentId);
}

function openRecord(key, studentId) {
  showTab("record");
  editStudent(key, studentId);
}

document.getElementById("editTerm")
  .addEventListener("change", handleTermChange); 
  