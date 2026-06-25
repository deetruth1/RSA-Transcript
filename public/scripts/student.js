
const resultStore = JSON.parse(localStorage.getItem("results")) || {};
const studentRecord = document.getElementById("studentRecord");

const schoolOrder = ["SS1", "SS2", "SS3"];

const defaultTerms = ["First Term", "Second Term", "Third Term"];

let currentFilteredResults = [];

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

function renderStudentBio(studentId) {
  const results = allSessionByStudent(studentId);

  if (!results.length) {
    showToast("No student data found", "error");
    return;
  }

  const latest = results[results.length - 1];
  const { key, studentData } = latest;

  const store = resultStore[key];
  const { student } = studentData;

  document.getElementById("surname").value = student?.surname || "-";
  document.getElementById("firstName").value = student?.firstName || "-";
  document.getElementById("otherName").value = student?.otherName || "-";
  document.getElementById("email").value = student?.email || "";

  document.getElementById("displayStudentId").textContent = student?.studentId || "-";
  document.getElementById("displayYear").textContent = store.session || "-";
  document.getElementById("displaySchool").textContent = store.school || "-";
}

function render(studentId, terms = defaultTerms) {
  studentRecord.innerHTML = "";
  
  if (!studentRecord) return;

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

  const student = results[0]?.studentData?.student || {};

  let tablesHTML = "";

  results.forEach(result => {
    tablesHTML += renderTable(result.key, terms, result.studentData);
  });

  studentRecord.innerHTML = `
    <tr>
      <td colspan="5">
        <div class="p-4">
          ${tablesHTML}
        </div>
      </td>
    </tr>
  `;
}


function renderTable(key, terms, studentData) {
  const store = resultStore[key];
  if (!store) return "";

  const { session, school } = store;
  const { subjects = {} } = studentData;

  const termHeaders = terms.map(t => `<th class="p-2">${t}</th>`).join("");

  const rows = Object.values(subjects).map((sub, i) => `
    <tr>
      <td class="p-2">${sub.subject}</td>
      ${terms.map(t => `<td class="p-2 text-center">${sub[t] ?? "-"}</td>`).join("")}
    </tr>
  `).join("");

  return `
    <div class="mb-4 border bg-white shadow-xs shadow-blue-900 rounded p-2">

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

  function showTab(tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));

    document.getElementById(tab).classList.remove('hidden');
  }

function openRequest(key, studentId) {
  showTab("requests");
}
function openBio(key, studentId) {
  showTab("bio");
}
function openResult(key, studentId) {
  showTab("result");
}

function submitStudentRequest() {
  const user = JSON.parse(localStorage.getItem("currentUser"));

  if (!user || !user.studentId) {
    showToast("User not logged in", "error");
    return;
  }

  const requests =
    JSON.parse(localStorage.getItem("transcriptRequests")) || [];

  const exists = requests.some(
    r =>
      r.studentId === user.studentId &&
      r.status === "pending"
  );

  if (exists) {
    showToast("You already have a pending request", "info");
    return;
  }

  // Save temporary request
  localStorage.setItem("pendingTranscriptRequest",JSON.stringify({studentId: user.studentId,terms: defaultTerms}));

  // Redirect to payment page
  window.location.href = "payment.html";
}

document.addEventListener("DOMContentLoaded",checkPaymentCompletion);

function checkPaymentCompletion() {

  const paid =
    localStorage.getItem("paymentSuccess");

  if (paid !== "true") return;

  const requestData = JSON.parse(localStorage.getItem("pendingTranscriptRequest"));

  if (!requestData) return;

  const requests = JSON.parse(localStorage.getItem("transcriptRequests")) || [];

  requests.push({id: Date.now(),
    studentId: requestData.studentId,
    terms: requestData.terms,
    paymentStatus: "paid",
    paymentReference:localStorage.getItem(
        "paymentReference"),
  status: "pending",
   createdAt:new Date().toISOString()});

  localStorage.setItem("transcriptRequests", JSON.stringify(requests));

  localStorage.removeItem("paymentSuccess");

  localStorage.removeItem("pendingTranscriptRequest");

  localStorage.removeItem("paymentReference");
  showToast("Payment successful. Transcript request submitted.", "success");

  loadMyRequests();
}

function loadMyRequests() {

  const user = JSON.parse(
    localStorage.getItem("currentUser")
  );

  if (!user) return;

  const requests = JSON.parse(
    localStorage.getItem("transcriptRequests")
  ) || [];

  const myRequests = requests.filter(
    r => r.studentId === user.studentId
  );

  const tbody =
    document.getElementById("requestTableBody");

  if (!tbody)
  return;

  tbody.innerHTML = "";

  if (myRequests.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="text-center p-4 text-gray-500">
          No requests found
        </td>
      </tr>
    `;
    return;
  }

  myRequests.forEach(req => {

  tbody.innerHTML += `
<tr class="border-b hover:bg-gray-50 text-center">
  <td class="p-2 whitespace-nowrap">${req.id}</td>
  <td class="p-2 whitespace-nowrap">${req.paymentReference || "-"}</td>
  <td class="p-2 whitespace-nowrap">${req.status}</td>
  <td class="p-2 whitespace-nowrap">${req.paymentStatus}</td>
  <td class="p-2 whitespace-nowrap">
    ${new Date(req.createdAt).toLocaleString()}
  </td>
</tr>
`;

  });
}

document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("currentUser"));

  if (!user || !user.studentId) {
    window.location.href = "login.html";
     showToast("No user logged in", "error");
    return;
  }

  renderStudentBio(user.studentId);
  render(user.studentId);
  loadMyRequests();
  checkPaymentCompletion();
});

/* function loadMyRequests() {
  const user = JSON.parse(localStorage.getItem("currentUser"));
  if (!user) return;

  const requests = JSON.parse(localStorage.getItem("transcriptRequests")) || [];
  const my = requests.filter(r => r.studentId === user.studentId);

 const tbody =
    document.getElementById(
      "requestTableBody"
    );



const container = document.getElementById("requestStatus");
  if (!container) return;

  if (!my.length) {
    container.innerHTML = "No requests yet";
    return;
  }

  container.innerHTML = my.map(r => `
    <div class="border bg-white shadow-xs shadow-blue-900 p-2 rounded mb-2">
      <p><b>ID:</b> ${r.id}</p>
      <p><b>Status:</b> ${r.status}</p>
      <p><b>Date:</b> ${new Date(r.createdAt).toLocaleString()}</p>
    </div>
  `).join("");  
} */

/*function submitStudentRequest() {
  const user = JSON.parse(localStorage.getItem("currentUser"));

  if (!user || !user.studentId) {
    showToast("User not logged in", "error");
    return;
  }

  const studentId = user.studentId;
  const terms = defaultTerms; 

  const requests = JSON.parse(localStorage.getItem("transcriptRequests")) || [];

  const exists = requests.some(
    r => r.studentId === studentId && r.status === "pending"
  );

  if (exists) {
    showToast("Request already pending", "info");
    return;
  }

  const newRequest = {
    id: Date.now(),
    studentId,
    terms,
    status: "pending",
    createdAt: new Date().toISOString()
  };

  requests.push(newRequest);
  localStorage.setItem("transcriptRequests", JSON.stringify(requests));

  showToast("Transcript request submitted", "success");

  loadMyRequests();
//  sendAdminEmail(newRequest);
}

/*function sendAdminEmail(request) {
  if (!window.emailjs) return;
  emailjs.send("YOUR_SERVICE_ID", "YOUR_TEMPLATE_ID", {
    student_id: request.studentId,
    terms: request.terms.join(", "),
    status: request.status,
    date: request.date
  })
  .then(() => showToast("Admin notified"))
  .catch(err => showToast("err"));
}*/

