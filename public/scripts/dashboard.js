// document.addEventListener("DOMContentLoaded", () => {
//   const currentUser = JSON.parse(
//     localStorage.getItem("currentUser"));

//   if (currentUser?.role === "admin") {
//     document.getElementById("adminUser").style.display = "flex";
//   }
  
//   if (!currentUser || currentUser.role === "student") {
//   window.location.href = "/login";
// }
// });
// axios.post('/adduser', { 
//   username: 'test',
//   email: "test@gmail.com",
//   password: '123'
// })
// .then(res => console.log(res.data))
// .catch(err => console.log(err))
// ================= GET UNIQUE STUDENTS =================
// Inside your dashboard frontend javascript file (e.g., admindash.js)
async function initializeDashboardStats() {
  try {
    const response = await fetch('http://localhost:3000/users/dashboard/stats');
    if (!response.ok) throw new Error("Could not download metrics pipeline data.");
    
    const stats = await response.json();
    console.log("Stats received from backend:", stats); 

    updateCounterDOM("totalStudentsCountElement", stats.totalStudents);
    updateCounterDOM("totalSubjectsCountElement", stats.totalSubjectsLogged);

  } catch (error) {
    console.error("Failed to safely update dashboard metric counters:", error);
    updateCounterDOM("totalStudentsCountElement", 0);
  }
}

function updateCounterDOM(elementId, value) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = value;
  } else {
    console.warn(`Could not find HTML element with id="${elementId}" on this page.`);
  }
}

document.addEventListener("DOMContentLoaded", initializeDashboardStats);

function updateCounterDOM(elementId, value) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = value;
  }
}

// ================= DASHBOARD LOAD =================
async function loadDashboard() {

  /* -------- STUDENTS -------- */

  // 🔥 PRIMARY SOURCE (from results)
  let totalStudents = getTotalStudentsFromResults();

  // 🔁 FALLBACK (if results empty)
  if (totalStudents === 0) {
    const storedStudents = JSON.parse(localStorage.getItem("students")) || [];
    totalStudents = storedStudents.length;
  }

  /* -------- REQUESTS -------- */
  const requests = JSON.parse(localStorage.getItem("transcriptRequests")) || [];
  const delivered = JSON.parse(localStorage.getItem("deliveredTranscripts")) || [];

  // Only active requests
  const activeRequests = requests.filter(r => r.status === "pending");

  const totalRequests = activeRequests.length;
  const totalSent = delivered.length;
  const totalPending = activeRequests.length;

  /* -------- FORMAT -------- */
  const format = (num) => num.toLocaleString();

  /* -------- SAFE UI UPDATE -------- */
  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = format(value);
  }

  setText("totalStudents", totalStudents);
  setText("totalRequests", totalRequests);
  setText("totalSent", totalSent);
  setText("totalPending", totalPending);
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", loadDashboard);
window.addEventListener("storage", loadDashboard);
setInterval(loadDashboard, 3000);