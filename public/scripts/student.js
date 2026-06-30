// --- SESSION AUTHORIZATION ENFORCEMENT ---
const user = JSON.parse(localStorage.getItem("currentUser"));

if (!user || !user.studentId) {
  window.location.href = "/login";
}

// Global reference targets
const studentRecord = document.getElementById("studentRecord");
const defaultTerms = ["First Term", "Second Term", "Third Term"];

// Mobile Responsive Navigation Menu Toggle
document.getElementById("menuBtn")?.addEventListener("click", () => {
  const menu = document.getElementById("mobileMenu");
  if (menu) menu.classList.toggle("hidden");
});

function showTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.getElementById(tabId)?.classList.remove('hidden');
  document.getElementById("mobileMenu")?.classList.add("hidden"); // Auto-collapse menu
}

// Navigation Shortlinks
function openBio() { showTab("bio"); }
function openResult() { showTab("result"); }
function openRequest() { showTab("requests"); }

// --- ENGINE INITIALIZER ---
document.addEventListener("DOMContentLoaded", () => {
  autoPopulateStudentProfile();
  loadMyRequests();
  checkPaymentCompletion();
});

// =========================================================
// 1. BIO-DATA & ACADEMIC DATA AUTO-POPULATION PIPELINE
// =========================================================
async function autoPopulateStudentProfile() {
  if (!user?.studentId) return;

  try {
    // Call the search endpoint we created on your Express router
    const response = await fetch(`http://localhost:3000/users/search/profile?studentId=${user.studentId}`);
    
    if (!response.ok) {
      if (studentRecord) {
        studentRecord.innerHTML = `
          <div class="text-center p-6 text-red-500 font-semibold bg-white rounded-xl shadow">
            ⚠️ No academic profile found in the database for ID: ${user.studentId}
          </div>`;
      }
      return;
    }

    const dbRecord = await response.json();

    // Fill personal bio-data profile input text tokens
    document.getElementById("surname").value = dbRecord.surname || "-";
    document.getElementById("firstName").value = dbRecord.firstName || "-";
    document.getElementById("otherName").value = dbRecord.otherName || "-";
    document.getElementById("email").value = dbRecord.email || "-";

    document.getElementById("displayStudentId").textContent = dbRecord.studentId || "-";
    document.getElementById("displayYear").value = dbRecord.session || "-";
    document.getElementById("Level").value = dbRecord.school || "-";

    // Build academic sheet component elements
    renderPerformanceTable(dbRecord);

  } catch (error) {
    console.error("Critical error mapping profile document states:", error);
  }
}

function renderPerformanceTable(dbRecord) {
  if (!studentRecord) return;
  studentRecord.innerHTML = "";

  if (!dbRecord.results || dbRecord.results.length === 0) {
    studentRecord.innerHTML = `<p class="text-slate-400 italic text-center py-6 text-sm">No grades logged for this terminal identity context.</p>`;
    return;
  }

  // Parse nested array schemas safely directly into row collections
  const rowsHtml = dbRecord.results.map(item => `
    <tr class="border-b text-slate-700 hover:bg-slate-50 transition text-sm">
      <td class="px-4 py-3 font-semibold text-slate-800">${item.subject}</td>
      <td class="px-4 py-3 text-center font-bold text-blue-600">${item.grade || "-"}</td>
    </tr>
  `).join("");

  studentRecord.innerHTML = `
    <div class="mb-4 bg-white rounded-xl border border-slate-100 p-2">
      <div class="flex justify-between items-center px-2 mb-3">
        <span class="text-sm font-bold text-slate-500">SESSION: ${dbRecord.session} | LEVEL: ${dbRecord.school}</span>
        <span class="text-xs bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-md border border-indigo-200">${dbRecord.term}</span>
      </div>

      <table class="w-full border text-left rounded-lg overflow-hidden">
        <thead class="bg-slate-900 text-white text-xs uppercase tracking-wider">
          <tr>
            <th class="px-4 py-2.5">Subject Name</th>
            <th class="px-4 py-2.5 text-center">Grade</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          ${rowsHtml}
        </tbody>
      </table>
    </div>
  `;
}

// =========================================================
// 2. TRANSCRIPT REQUEST TRACKING PIPELINE (BACKEND REST FULL)
// =========================================================
async function submitStudentRequest() {
  if (!user?.studentId) return;

  try {
    // Check with backend database if a pending processing task is ongoing
    const checkResponse = await fetch(`http://localhost:3000/users/requests/status?studentId=${user.studentId}`);
    const checkData = await checkResponse.json();

    if (checkData.hasPending) {
      alert("⚠️ Request Blocked:\nYou already have an open transcript request under review.");
      return;
    }

    // Set staging payload state parameters inside memory token
    localStorage.setItem("pendingTranscriptRequest", JSON.stringify({ studentId: user.studentId, terms: defaultTerms }));

    // Send context flow over to authorization gateway page
    window.location.href = "payment.html";

  } catch (error) {
    console.error("Request generation runtime failure:", error);
    alert("Connection lost communicating with core API server framework.");
  }
}

async function checkPaymentCompletion() {
  const paymentVerified = localStorage.getItem("paymentSuccess");
  if (paymentVerified !== "true") return;

  const requestMetadata = JSON.parse(localStorage.getItem("pendingTranscriptRequest"));
  if (!requestMetadata) return;

  const payload = {
    studentId: requestMetadata.studentId,
    terms: requestMetadata.terms,
    paymentStatus: "paid",
    paymentReference: localStorage.getItem("paymentReference") || "REF-" + Date.now()
  };

  try {
    // Issue persistent HTTP POST data transmission request to backend routers
    const response = await fetch('http://localhost:3000/users/requests/create', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      // Clear out state descriptors safely to complete isolation context cycles
      localStorage.removeItem("paymentSuccess");
      localStorage.removeItem("pendingTranscriptRequest");
      localStorage.removeItem("paymentReference");

      alert("🎉 Payment successfully authorized. Your transcript order has been logged.");
      loadMyRequests();
    }
  } catch (error) {
    console.error("Failed to commit paid registration entity parameters to Mongo:", error);
  }
}

async function loadMyRequests() {
  const tbody = document.getElementById("requestTableBody");
  if (!tbody || !user?.studentId) return;

  try {
    const response = await fetch(`http://localhost:3000/users/requests/list?studentId=${user.studentId}`);
    if (!response.ok) return;

    const requestArray = await response.json();
    tbody.innerHTML = "";

    if (requestArray.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center p-4 text-slate-400 italic">No tracking records logged on this database node.</td></tr>`;
      return;
    }

    requestArray.forEach(req => {
      // Setup tailwind badge colors depending on backend data parameters
      const statusColor = req.status === "pending" ? "text-amber-600 bg-amber-50 border-amber-200" : "text-green-600 bg-green-50 border-green-200";
      
      tbody.innerHTML += `
        <tr class="border-b hover:bg-slate-50 text-slate-700 transition">
          <td class="p-3 font-mono text-xs text-slate-500">${req._id}</td>
          <td class="p-3">${req.paymentReference || "-"}</td>
          <td class="p-3 text-center">
            <span class="px-2 py-0.5 rounded text-xs font-bold border ${statusColor}">${req.status.toUpperCase()}</span>
          </td>
          <td class="p-3 text-center text-xs font-semibold text-green-600">${req.paymentStatus.toUpperCase()}</td>
          <td class="p-3 text-slate-500 text-xs">${new Date(req.createdAt || req.date).toLocaleString()}</td>
        </tr>
      `;
    });

  } catch (error) {
    console.error("Failed loading transaction lists:", error);
  }
}

function logout() {
  localStorage.removeItem("currentUser");
  window.location.href = "login.html";
}