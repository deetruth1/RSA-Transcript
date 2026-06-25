const user = JSON.parse(localStorage.getItem("currentUser"));

if (!user || user.role === "student") {
  window.location.href = "login.html";
}

// ================= STATE =================
let deliveredCache = [];
let visibleData = [];

const ROW_HEIGHT = 60;
const BUFFER = 5;

// ================= STUDENT HELPERS =================
function getStudentInfo(studentId) {
  const results = JSON.parse(localStorage.getItem("results")) || {};
  let info = null;

  Object.values(results).forEach(store => {
    const s = store.students?.[studentId];
    if (s?.student) info = s.student;
  });

  return info;
}

function formatStudent(studentId) {
  const student = getStudentInfo(studentId);

  if (!student) {
    return {
      name: "Unknown",
      email: "No email"
    };
  }

  return {
    name: `${student.surname || ""} ${student.firstName || ""}`.trim(),
    email: student.email || "No email"
  };
}

// ================= LOAD DELIVERED =================
function loadDelivered() {
  let delivered = JSON.parse(localStorage.getItem("deliveredTranscripts")) || [];

  // 🔥 fallback: derive from requests if empty
  if (!delivered.length) {
    const requests = JSON.parse(localStorage.getItem("transcriptRequests")) || [];

    delivered = requests
      .filter(r => (r.status || "").toLowerCase() === "delivered")
      .map(r => {
        const student = formatStudent(r.studentId);

        return {
          ...r,
          name: student.name,
          email: student.email,
          date: r.date || new Date().toISOString()
        };
      });
  }

  // sort newest first
  delivered.sort((a, b) => new Date(b.date) - new Date(a.date));

  deliveredCache = delivered;
  visibleData = delivered;

  updateVisibleRows();
}

// ================= RENDER =================
function updateVisibleRows() {
  const container = document.getElementById("deliveredTable");
  const scrollBox = document.getElementById("scrollContainer");

  if (!container || !scrollBox) return;

  const scrollTop = scrollBox.scrollTop;
  const containerHeight = scrollBox.clientHeight;

  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER);
  const endIndex = Math.min(
    visibleData.length,
    Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + BUFFER
  );

  const rows = visibleData.slice(startIndex, endIndex);

  if (!rows.length) {
    container.innerHTML = `
      <tr>
        <td colspan="5" class="text-center p-4">
          No delivered transcripts
        </td>
      </tr>
    `;
    return;
  }

  container.innerHTML = rows.map(item => {
    const date = item.date
      ? new Date(item.date).toLocaleString()
      : "-";

    return `
      <tr class="border-b hover:bg-gray-50 whitespace-nowrap">

        <td class="p-2">${item.studentId || "-"}</td>
        <td class="p-2">${item.name || "Unknown"}</td>
        <td class="p-2">${item.email || "No email"}</td>
        <td class="p-2 text-center">${date}</td>
      </tr>
    `;
  }).join("");
}

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
  const scrollBox = document.getElementById("scrollContainer");

  scrollBox?.addEventListener("scroll", updateVisibleRows);

  loadDelivered();
});