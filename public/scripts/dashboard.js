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

// ================= GET UNIQUE STUDENTS =================
function getTotalStudentsFromResults() {
  const results = JSON.parse(localStorage.getItem("results")) || {};

  const studentMap = new Map();

  Object.values(results).forEach(store => {
    const students = store.students || {};

    Object.values(students).forEach(s => {
      const student = s.student;

      if (student?.studentId) {
        studentMap.set(student.studentId, student);
      }
    });
  });

  return studentMap.size;
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