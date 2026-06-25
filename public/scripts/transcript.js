
/* document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("currentUser"));
  if (!user || user.role === "student") {
    window.location.href = "login.html";
  }
}); */

// ================= LOAD TRANSCRIPT =================
function loadTranscript() {
  const results = JSON.parse(localStorage.getItem("finalTranscript")) || [];
  let selectedTerms = JSON.parse(localStorage.getItem("selectedTerms")) || [];

  const infoDiv = document.getElementById("studentInfo");
  const tableDiv = document.getElementById("resultTables");

  // FIX: null checks so function doesn't throw if elements are missing
  if (!infoDiv || !tableDiv) return;

  if (!results.length) {
    tableDiv.innerHTML = "<p>No transcript data</p>";
    return;
  }

  if (!selectedTerms.length) {
    selectedTerms = ["First Term", "Second Term", "Third Term"];
  }

  const student = results[0]?.studentData?.student || {};
  const surname = (student.surname || "").toUpperCase();

  // STUDENT INFO
  infoDiv.innerHTML = `
    <div class="grid grid-cols-2 gap-2">
      <div><strong>Name:</strong> ${surname} ${student.firstName || ""}</div>
      <div><strong>Student ID:</strong> ${student.studentId || "-"}</div>
      <div class="col-span-2"><strong>Email:</strong> ${student.email || "-"}</div>
    </div>
  `;

  localStorage.setItem("currentStudent", JSON.stringify({
    studentId: student.studentId || "",
    email: student.email || ""
  }));

  const allResults = JSON.parse(localStorage.getItem("results")) || {};
  let html = "";

  results.forEach(r => {
    const meta = allResults[r.key] || {};
    const { session = "", school = "" } = meta;
    const subjects = Object.values(r.studentData?.subjects || {});

    html += `
      <div class="mb-6">
        <h3 class="font-bold">${session} - ${school}</h3>
        <table class="w-full border mt-2">
          <thead class="bg-gray-800 text-sm lg:text-xs text-white">
            <tr>
              <th class="p-2 w-28 lg:w-34">Subject</th>
              ${selectedTerms.map(t => `<th class="p-0.5 w-12">${t}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
    `;

    subjects.forEach(sub => {
      html += `
        <tr class="border text-xs">
          <td class="px-2 lg:px-2 lg:py-1 border">${sub.subject || "-"}</td>
          ${selectedTerms.map(t => `<td class="text-center border">${sub[t] ?? "-"}</td>`).join("")}
        </tr>
      `;
    });

    html += `</tbody></table></div>`;
  });

  tableDiv.innerHTML = html;
}

// ================= SHARED PDF CORE =================
async function buildTranscriptPdf() {
  const element = document.getElementById("transcriptContent");

  const images = element.querySelectorAll("img");
  await Promise.all(
    Array.from(images).map(img => {
      if (img.complete && img.naturalWidth !== 0) return Promise.resolve();
      return new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    })
  );

  // FIX: scroll to top before capture to fix Chrome blank/clipped PDF bug
  window.scrollTo(0, 0);

  // FIX: force px width so html2canvas measures correctly (mm units are unreliable on screen)
  element.style.width = "794px"; // 210mm at 96dpi

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: false,
    backgroundColor: "#ffffff",
    // FIX: removed windowWidth/windowHeight — they conflict with scale:2 and clip content
  });

  // Restore original width after capture
  element.style.width = "";

  const imgData = canvas.toDataURL("image/png");

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const A4_WIDTH_MM = pdf.internal.pageSize.getWidth();
  const A4_HEIGHT_MM = pdf.internal.pageSize.getHeight();

  const pdfWidth = A4_WIDTH_MM;
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

  let heightLeft = pdfHeight;
  let position = 0;
  let page = 0;

  pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
  drawWatermark(pdf, jsPDF, A4_WIDTH_MM, A4_HEIGHT_MM);
  heightLeft -= A4_HEIGHT_MM;

  while (heightLeft > 0) {
    page++;
    position = -A4_HEIGHT_MM * page;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
    drawWatermark(pdf, jsPDF, A4_WIDTH_MM, A4_HEIGHT_MM);
    heightLeft -= A4_HEIGHT_MM;
  }

  return pdf;
}

// ================= WATERMARK =================
// FIX: jsPDF passed in as argument — GState lives on the constructor, not the instance
function drawWatermark(pdf, jsPDF, pageWidthMm, pageHeightMm) {
  pdf.saveGraphicsState();
  pdf.setGState(new jsPDF.GState({ opacity: 0.12 }));
  pdf.setFontSize(60);
  pdf.setTextColor(120, 120, 120);
  pdf.text("STUDENT COPY", pageWidthMm / 2, pageHeightMm / 2, {
    align: "center",
    angle: 30,
  });
  pdf.restoreGraphicsState();
}

// ================= AUTO MARK DELIVERED =================
function autoMarkDelivered() {
  const requests = JSON.parse(localStorage.getItem("transcriptRequests")) || [];
  const student = JSON.parse(localStorage.getItem("currentStudent")) || {};

  const updated = requests.map(r => {
    if (r.studentId === student.studentId) {
      return { ...r, status: "delivered", deliveredAt: new Date().toISOString() };
    }
    return r;
  });

  localStorage.setItem("transcriptRequests", JSON.stringify(updated));
  showToast("Marked as delivered", "info");
}

// ================= DOWNLOAD =================
// FIX: wrapped in try/catch so errors show a toast instead of failing silently
async function handleDownload() {
  try {
    const pdf = await buildTranscriptPdf();
    pdf.save("transcript.pdf");
  } catch (err) {
    console.error(err);
    showToast("Failed to generate PDF", "error");
  }
}

// ================= SEND EMAIL =================
async function handleSendEmail() {
  try {
    const pdf = await buildTranscriptPdf();
    const blob = pdf.output("blob");

    const student = JSON.parse(localStorage.getItem("currentStudent")) || {};

    if (!student.email) {
      showToast("No email found for this student", "error");
      return;
    }

    const formData = new FormData();
    formData.append("file", blob, "transcript.pdf");
    formData.append("email", student.email);

    const res = await fetch("http://localhost:5000/send-transcript", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    if (data.success) {
      showToast("Email sent successfully", "success");
      autoMarkDelivered();
    } else {
      showToast("Failed to send email", "error");
    }
  } catch (err) {
    console.error(err);
    showToast("Server error", "error");
  }
}

// ================= INIT =================
document.addEventListener("DOMContentLoaded", loadTranscript);
