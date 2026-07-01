// At the very top of scripts/student.js:
const user = JSON.parse(localStorage.getItem("currentUser"));

if (!user || (user.role !== "student" && user.role !== "admin")) {
  window.location.href = "/login";
}

// 🌟 Target the exact studentId string passed by your updated login session:
const studentLookupKey = user.studentId || user.email;
// Global reference targets
const studentRecord = document.getElementById("studentRecord");
const defaultTerms = ["First Term", "Second Term", "Third Term"];

// Mobile Responsive Navigation Menu Toggle
document.getElementById("menuBtn")?.addEventListener("click", () => {
  const menu = document.getElementById("mobileMenu");
  if (menu) menu.classList.toggle("hidden");
});

// function showTab(tabId) {
//   document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
//   document.getElementById(tabId)?.classList.remove('hidden');
//   document.getElementById("mobileMenu")?.classList.add("hidden"); // Auto-collapse menu
// }

// Navigation Shortlinks
// Add or verify these navigation handlers at the top level of student.js:

function openBio() { 
  showTab("bio"); 
}

function openResult() { 
  showTab("result"); 
}

function openRequest() { 
  showTab("requests"); 
}

function showTab(tabId) {
  // Hide all sections with the tab-content class
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  
  // Show the requested section element
  document.getElementById(tabId)?.classList.remove('hidden');
  
  // Close the mobile responsive nav drawer automatically
  document.getElementById("mobileMenu")?.classList.add("hidden"); 
}

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
  // Use the available user session details to determine what to search for
  const lookupKey = user?.studentId || user?.username || user?.email;
  if (!lookupKey) return;

  try {
    // Call your working backend router path
    const response = await fetch(`http://localhost:3000/users/search/profile?studentId=${lookupKey}`);
    
    if (!response.ok) {
      if (studentRecord) {
        studentRecord.innerHTML = `
          <div class="text-center p-6 text-red-500 font-semibold bg-white rounded-xl shadow">
            ⚠️ No academic profile found in the database for identity: ${lookupKey}
          </div>`;
      }
      return;
    }

    const dbRecord = await response.json();
    console.log("Profile successfully loaded from MongoDB:", dbRecord);

    // 🌟 Safely map to the correct element IDs present in your student.html layout
    if (document.getElementById("surname")) document.getElementById("surname").value = dbRecord.surname || "-";
    if (document.getElementById("firstName")) document.getElementById("firstName").value = dbRecord.firstName || "-";
    if (document.getElementById("otherName")) document.getElementById("otherName").value = dbRecord.otherName || "-";
    if (document.getElementById("email")) document.getElementById("email").value = dbRecord.email || "-";
    if (document.getElementById("studentId")) document.getElementById("studentId").value = dbRecord.studentId || "-";
    if (document.getElementById("Year")) document.getElementById("Year").value = dbRecord.session || dbRecord.year || "-";
    if (document.getElementById("Level")) document.getElementById("Level").value = dbRecord.school || dbRecord.level || "-";

    // Build academic sheet component elements
  renderPerformanceTable(dbRecord);

  } catch (error) {
    console.error("Critical error mapping profile document states:", error);
  }
}
// =========================================================
// 1b. DYNAMIC PERFORMANCE RESULTS TABLE RENDERER
// =========================================================
function renderPerformanceTable(dbRecord) {
  // Find your <div id="studentRecord"></div> container from student.html
  const resultContainer = document.getElementById("studentRecord");
  if (!resultContainer) return;
  
  resultContainer.innerHTML = "";

  // Extract the results array or handle fallback properties cleanly
  const gradesArray = dbRecord.results || dbRecord.Grades || [];

  if (gradesArray.length === 0) {
    resultContainer.innerHTML = `
      <div class="bg-white rounded-xl p-6 text-center border border-slate-200 shadow-sm">
        <p class="text-slate-400 italic text-sm">No terminal grades logged for this student identity record yet.</p>
      </div>`;
    return;
  }

  // Loop through your subjects and grades to compile the table rows
  const rowsHtml = gradesArray.map(item => `
    <tr class="border-b border-slate-100 text-slate-700 hover:bg-slate-50 transition text-sm">
      <td class="px-6 py-3.5 font-semibold text-slate-800">${item.subject || item.Subject || "-"}</td>
      <td class="px-6 py-3.5 text-center font-bold text-blue-600">${item.grade || item.Grade || "-"}</td>
    </tr>
  `).join("");

  // Inject the fully built table component directly into the container element
  resultContainer.innerHTML = `
    <div class="mb-4 bg-white rounded-xl border border-slate-200 p-4 shadow-sm max-w-4xl mx-auto">
      <div class="flex flex-wrap justify-between items-center px-2 mb-4 gap-2">
        <span class="text-xs font-bold text-slate-500 tracking-wide uppercase">
          SESSION: ${dbRecord.session || dbRecord.year || "-"} | LEVEL: ${dbRecord.school || dbRecord.level || "-"}
        </span>
        <span class="text-xs bg-indigo-100 text-indigo-800 font-bold px-2.5 py-1 rounded-md border border-indigo-200">
          ${dbRecord.term || "Academic Report Card"}
        </span>
      </div>

      <div class="overflow-hidden border border-slate-100 rounded-lg">
        <table class="w-full text-left border-collapse">
          <thead class="bg-slate-950 text-white text-xs uppercase tracking-wider">
            <tr>
              <th class="px-6 py-3 font-semibold">Subject Name</th>
              <th class="px-6 py-3 text-center font-semibold">Grade</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 bg-white">
            ${rowsHtml}
          </tbody>
        </table>
      </div>
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
    window.location.href = "/payment";

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