const user = JSON.parse(localStorage.getItem("currentUser"));

if (!user || (user.role === "student")) {
  window.location.href = "login.html";
}


let allRequestsCache = [];
let visibleData = [];

const ROW_HEIGHT = 60;
const BUFFER = 5;

function getStudentInfo(studentId) {
  const results = JSON.parse(localStorage.getItem("results")) || {};

  let info = null;

  Object.values(results).forEach(store => {
    const s = store.students?.[studentId];

    if (s?.student) {
      info = s.student;
    }
  });
  return info;
}

function formatStudent(studentId) {
  const student = getStudentInfo(studentId);

  if (!student) {
    return {
      name: "Unknown Student",
      email: "No email"
    };
  }

  return {
    name: `${student.surname || ""} ${student.firstName || ""}`.trim(),
    email: student.email || "No email"
  };
}


function loadAllRequests() {

  const requests = JSON.parse(localStorage.getItem("transcriptRequests")) || [];

  allRequestsCache = requests.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)).map(r => {
    const student = formatStudent(r.studentId);

      return {
        ...r, id: String(r.id), 
        studentId: String(r.studentId), 
        name: student.name,
        email: student.email, 
        paymentReference:r.paymentReference || "-", 
        paymentStatus: r.paymentStatus || "unpaid",
        status: (r.status || "pending").toLowerCase()
    };
    });

  handleSearch();
}

// ================= SEARCH =================

function handleSearch() {

  const query = (document.getElementById("searchRequest")?.value || "").toLowerCase().trim();

  visibleData = allRequestsCache.filter(r =>
    r.status === "pending" && (
      r.name.toLowerCase().includes(query) ||
      r.studentId.toLowerCase().includes(query) ||
      r.email.toLowerCase().includes(query)
    )
  );

  updateVisibleRows();
}

// ================= RENDER =================

function updateVisibleRows() {

  const container = document.getElementById("requests");

  const scrollBox = document.getElementById("scrollContainer");

  if (!container || !scrollBox) return;

  const scrollTop = scrollBox.scrollTop;

  const containerHeight = scrollBox.clientHeight;

  const startIndex = Math.max(0,
    Math.floor(scrollTop / ROW_HEIGHT) - BUFFER
  );

  const endIndex = Math.min(visibleData.length, Math.ceil((scrollTop + containerHeight) /
      ROW_HEIGHT) + BUFFER);

  const rows =visibleData.slice(startIndex, endIndex);

  container.innerHTML = rows.length ? rows.map(r => `

<tr class="border-b hover:bg-gray-50 whitespace-nowrap text-center">

  <td class="px-2 py-2">
    ${r.studentId}
  </td>

  <td class="px-2 py-2">
    ${r.name}
  </td>

  <td class="px-2 py-2 md:table-cell">
    ${r.email}
  </td>

  <td class="px-2 py-2">
    ${r.paymentStatus}
  </td>

  <td class="px-2 py-2 lg:table-cell">
    ${r.paymentReference}
  </td>

  <td class="px-2 py-2">
    <span class="font-semibold ${r.status === "pending" ? "text-yellow-500" : r.status === "cancelled" ? "text-red-600" : "text-green-600"} ">${r.status}</span>
  </td>

  <td class="px-2 py-2 lg:table-cell">
    ${r.createdAt ? new Date(r.createdAt).toLocaleString(): "-"}
  </td>

  <td class="px-2 py-2 text-center"> ${r.status === "pending" ? `
  <button onclick="redirectToGenerateTranscript('${r.studentId}','${r.id}')" class="font-bold text-green-700 rounded animate-pulse hover:text-blue-700">Generate</button>` : ` <span class="font-semibold">${r.status}</span> `}

  </td>
</tr> `).join("") : `
<tr>
  <td colspan="8"
      class="text-center p-6 text-gray-500">
    No requests found
  </td>
</tr>
`;
}

// ================= UPDATE STATUS =================

function updateStatus(requestId,status) {

  let requests = JSON.parse(localStorage.getItem("transcriptRequests")) || [];

  requests = requests.map(r => String(r.id) === String(requestId)  ? {
          ...r, status, date:new Date().toISOString()}
      : r
  );

  localStorage.setItem("transcriptRequests",
   JSON.stringify(requests)
  );

  if (status === "delivered") {

    let delivered = JSON.parse(localStorage.getItem("deliveredTranscripts")) || [];

    const req = requests.find(
      r => String(r.id) === String(requestId));

    if ( req && !delivered.some(
        d => String(d.id) === String(req.id))
    ) {

   const student = formatStudent(
         req.studentId
        );

      delivered.push({
        ...req, name: student.name,
        email: student.email,
        deliveredAt: new Date().toISOString()});

      localStorage.setItem("deliveredTranscripts", JSON.stringify(delivered));
    }
  }

  loadAllRequests();
}

// ================= REDIRECT =================

function redirectToGenerateTranscript(studentId, requestId) {

  localStorage.setItem("selectedStudentId",  studentId);

  localStorage.setItem("activeRequestId", requestId);

  window.location.href = "generate.html";}

// ================= GLOBALS =================

window.handleSearch = handleSearch;
window.updateStatus = updateStatus;
window.redirectToGenerateTranscript = redirectToGenerateTranscript;

// ================= INIT =================

document.addEventListener("DOMContentLoaded", () => { 
  document.getElementById("searchRequest")
      ?.addEventListener("input", handleSearch
);

   document.getElementById("scrollContainer")
      ?.addEventListener(
        "scroll",
        updateVisibleRows
      );

    loadAllRequests();
  }
);