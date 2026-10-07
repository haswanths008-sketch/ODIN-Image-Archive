const archiveEl = document.getElementById("archive");
const emptyArchive = document.getElementById("emptyArchive");
const totalCount = document.getElementById("totalCount");
const todayCount = document.getElementById("todayCount");
const searchInput = document.getElementById("searchInput");
const fileInput = document.getElementById("imageFile");
const uploadState = document.getElementById("uploadState");
const refreshBtn = document.getElementById("refreshBtn");
const viewer = document.getElementById("viewer");
const viewerImage = document.getElementById("viewerImage");
const viewerMeta = document.getElementById("viewerMeta");
const viewerClose = document.getElementById("viewerClose");

let archiveData = { groups: [], total: 0, today: 0 };

function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    }[char]));
}

function renderArchive() {
    const term = searchInput.value.trim().toLowerCase();
    const groups = archiveData.groups.filter(group =>
        !term || group.date.includes(term) || group.display_date.toLowerCase().includes(term)
    );

    totalCount.textContent = archiveData.total;
    todayCount.textContent = archiveData.today;

    if (!groups.length) {
        archiveEl.innerHTML = "";
        emptyArchive.classList.add("visible");
        return;
    }

    emptyArchive.classList.remove("visible");
    archiveEl.innerHTML = groups.map(group => `
        <section class="day">
            <div class="day-head">
                <div class="day-title">
                    <div class="day-mark">▣</div>
                    <div>
                        <h3>${escapeHtml(group.display_date)}</h3>
                        <div class="day-date">${escapeHtml(group.date)}</div>
                    </div>
                </div>
                <div class="day-count">${group.count} CAPTURE${group.count === 1 ? "" : "S"}</div>
            </div>
            <div class="gallery">
                ${group.images.map(image => `
                    <article class="thumb" data-url="${escapeHtml(image.url)}" data-meta="${escapeHtml(group.display_date)} • ${escapeHtml(image.time)}">
                        <img src="${escapeHtml(image.url)}" alt="O.D.I.N. capture from ${escapeHtml(group.display_date)}" loading="lazy">
                        <div class="thumb-info">${escapeHtml(image.time)}</div>
                    </article>
                `).join("")}
            </div>
        </section>
    `).join("");

    document.querySelectorAll(".thumb").forEach(card => {
        card.addEventListener("click", () => openViewer(card.dataset.url, card.dataset.meta));
    });
}

async function loadArchive() {
    try {
        const response = await fetch("/api/archive?t=" + Date.now());
        if (!response.ok) throw new Error("Archive unavailable");
        archiveData = await response.json();
        renderArchive();
    } catch (error) {
        uploadState.textContent = "Archive connection unavailable. Start the O.D.I.N. server and refresh.";
    }
}

async function uploadCapture(file) {
    const formData = new FormData();
    formData.append("image", file);
    uploadState.textContent = "Saving capture to today's folder...";

    try {
        const response = await fetch("/upload", { method: "POST", body: formData });
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error(data.error || "Upload failed");
        uploadState.textContent = `✓ Saved • ${data.date} • ${data.filename}`;
        await loadArchive();
    } catch (error) {
        uploadState.textContent = "✕ " + error.message;
    } finally {
        fileInput.value = "";
    }
}

function openViewer(url, meta) {
    viewerImage.src = url;
    viewerMeta.textContent = meta;
    viewer.classList.add("open");
    viewer.setAttribute("aria-hidden", "false");
}

function closeViewer() {
    viewer.classList.remove("open");
    viewer.setAttribute("aria-hidden", "true");
    viewerImage.src = "";
}

fileInput.addEventListener("change", () => {
    if (fileInput.files[0]) uploadCapture(fileInput.files[0]);
});
refreshBtn.addEventListener("click", loadArchive);
searchInput.addEventListener("input", renderArchive);
viewerClose.addEventListener("click", closeViewer);
viewer.addEventListener("click", event => {
    if (event.target === viewer) closeViewer();
});
document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeViewer();
});

loadArchive();
setInterval(loadArchive, 8000);
