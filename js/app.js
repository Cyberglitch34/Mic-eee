/* Global state */
let activeMeeting = null;
let currentMeeting = null;
let nextMeetingId = 1;


/* Textarea auto-scroll fix */
const prepInput = document.getElementById("prepInput");
prepInput.addEventListener("input", () => {
    prepInput.scrollTop = 0;
});


/* Go to editor */
document.getElementById("goEditor").addEventListener("click", () => {
    const raw = prepInput.value.trim();
    if (!raw) return;

    if (!activeMeeting || activeMeeting.title === "New Meeting") {
        activeMeeting = addMeetingEntry(raw);
    } else {
        activeMeeting.title = raw;
        activeMeeting.content = raw;
    }

    openEditor(raw, activeMeeting);
});


/* New meeting buttons */
document.getElementById("newMeetingBtn").addEventListener("click", () => {
    activeMeeting = addMeetingEntry("New Meeting");
    prepInput.value = "";
});

document.getElementById("newMeetingBtn2").addEventListener("click", () => {
    activeMeeting = addMeetingEntry("New Meeting");
    prepInput.value = "";

    document.getElementById("screen-summary").classList.add("hidden");
    document.getElementById("screen-home").classList.remove("hidden");
});


/* Past and upcoming meetings */

// Get the sidebar buttons and lists
const pastToggle = document.getElementById("pastToggle");
const pastList = document.getElementById("pastMeetingsList");

const upcomingToggle = document.getElementById("upcomingToggle");
const upcomingList = document.getElementById("upcomingMeetingsList");

// Ensure the elements are available before adding event listeners
if (pastToggle) {
    pastToggle.addEventListener("click", () => {
        // Navigate to the results screen to view all past summaries
        const home = document.getElementById("screen-home");
        const editor = document.getElementById("screen-editor");
        const during = document.getElementById("screen-during");
        const duringQ = document.getElementById("screen-during-questions");
        const summary = document.getElementById("screen-summary");
        const results = document.getElementById("screen-results");

        home?.classList.add("hidden");
        editor?.classList.add("hidden");
        during?.classList.add("hidden");
        duringQ?.classList.add("hidden");
        summary?.classList.add("hidden");
        results?.classList.remove("hidden");
    });
}

if (upcomingToggle && upcomingList) {
    upcomingToggle.addEventListener("click", () => {
        upcomingList.classList.toggle("hidden");
    });
}

/* Add meeting entry with three-dot menu */
function addMeetingEntry(text) {
    const list = document.getElementById("meetingList");

    const meetingObj = {
        id: nextMeetingId++,
        title: text,
        content: text === "New Meeting" ? "" : text,
        entry: null
    };

    const entry = document.createElement("div");
    entry.classList.add("meeting-entry");
    entry.dataset.meetingId = String(meetingObj.id);
    entry.innerHTML = `
        <span class="meeting-title">${text.length > 24 ? text.substring(0, 24) + "…" : text}</span>
        <div class="meeting-menu-btn">⋮</div>
        <div class="meeting-menu hidden">
            <div class="menu-item delete-item">Delete</div>
            <div class="menu-item rename-item">Rename</div>
            <div class="menu-item past-item">Move to Past</div>
            <div class="menu-item upcoming-item">Move to Upcoming</div>
        </div>
    `;

    /* ----- CLICKING A MEETING LOADS IT ----- */
    entry.addEventListener("click", (e) => {
        if (e.target.classList.contains("meeting-menu-btn")) return;
        if (e.target.classList.contains("menu-item")) return;

        activeMeeting = meetingObj;
        prepInput.value = meetingObj.content || "";

        // If this meeting is in Upcoming, jump straight into the editor
        // so the agenda can be continued/edited.
        if (entry.parentElement && entry.parentElement.id === "upcomingMeetingsList") {
            openEditor(meetingObj.content || "", meetingObj);
        }
    });

    /* ----- MENU BUTTON BEHAVIOR ----- */
    const menuBtn = entry.querySelector(".meeting-menu-btn");
    const menu = entry.querySelector(".meeting-menu");

    menuBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        menu.classList.toggle("hidden");
    });

    document.addEventListener("click", () => menu.classList.add("hidden"));

    /* ----- DELETE ----- */
    entry.querySelector(".delete-item").addEventListener("click", (e) => {
        e.stopPropagation();
        entry.remove();
    });

    /* ----- RENAME ----- */
    entry.querySelector(".rename-item").addEventListener("click", (e) => {
        e.stopPropagation();
        // Hide the menu so only the rename input is visible
        const menu = entry.querySelector(".meeting-menu");
        if (menu) menu.classList.add("hidden");

        const titleElement = entry.querySelector(".meeting-title");

        // Create an input field to edit the meeting title
        const inputField = document.createElement("input");
        inputField.type = "text";
        inputField.value = titleElement.textContent.trim();
        inputField.classList.add("rename-input");

        titleElement.textContent = "";  // Clear current title
        titleElement.appendChild(inputField);  // Add the input field

        // Focus the input field for immediate editing
        inputField.focus();

        // Save the new name on blur or enter
        inputField.addEventListener("blur", saveNewName);
        inputField.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                saveNewName();
            }
        });

        // Function to save the new name
        function saveNewName() {
            const newTitle = inputField.value.trim();
            if (newTitle) {
                titleElement.textContent = newTitle.length > 24 ? newTitle.substring(0, 24) + "…" : newTitle;
                meetingObj.title = newTitle;  // Update the meeting object
                propagateMeetingTitle(meetingObj.id, newTitle);
            }
        }
    });

    /* ----- MOVE TO PAST ----- */
    entry.querySelector(".past-item").addEventListener("click", (e) => {
        e.stopPropagation();
        const pastList = document.getElementById("pastMeetingsList");
        if (pastList) {
            pastList.classList.remove("hidden");
            pastList.prepend(entry);
        }
    });

    /* ----- MOVE TO UPCOMING ----- */
    entry.querySelector(".upcoming-item").addEventListener("click", (e) => {
        e.stopPropagation();
        const upcomingList = document.getElementById("upcomingMeetingsList");
        if (upcomingList) {
            upcomingList.classList.remove("hidden");
            upcomingList.prepend(entry);
        }
    });

    // link the DOM entry and data object to each other
    meetingObj.entry = entry;
    entry.meetingObj = meetingObj;

    list.prepend(entry);
    return meetingObj;
}

// Keep meeting name consistent everywhere that meeting ID appears
function propagateMeetingTitle(meetingId, newTitle) {
    if (!meetingId || !newTitle) return;
    const idStr = String(meetingId);
    const fullTitle = newTitle.trim();
    const shortTitle = fullTitle.length > 24 ? fullTitle.substring(0, 24) + "…" : fullTitle;

    document.querySelectorAll(`.meeting-entry[data-meeting-id="${idStr}"]`).forEach(entry => {
        const titleSpan = entry.querySelector(".meeting-title");
        const dateLabel = entry.dataset.dateLabel;

        if (titleSpan) {
            // Sidebar chips that use a dedicated span
            titleSpan.textContent = shortTitle;
        } else if (dateLabel) {
            // Past / Results entries that display "Title — Date Time"
            entry.textContent = `${fullTitle} — ${dateLabel}`;
        } else {
            // Fallback: just set plain text
            entry.textContent = fullTitle;
        }
    });
}



/* Open editor */
function openEditor(rawText, meetingObj) {

    currentMeeting = meetingObj;

    document.getElementById("screen-home").classList.add("hidden");
    document.getElementById("screen-editor").classList.remove("hidden");

    document.getElementById("taskList").innerHTML = "";
    document.getElementById("questionList").innerHTML = "";

    const lines = rawText.split("\n").map(t => t.trim()).filter(Boolean);

    lines.forEach(line => {
        if (line.endsWith("?")) createCard(line, "questionList");
        else createCard(line, "taskList");
    });

    switchTab("tasks");
}


/* Home from editor */
document.getElementById("homeBtn").addEventListener("click", () => {
    // When leaving the editor without starting the meeting,
    // treat this as an upcoming (prepped) meeting so it can be
    // resumed later.
    if (currentMeeting) {
        // Rebuild a simple agenda text from the editor cards
        const taskLines = Array.from(
            document.querySelectorAll("#taskList .task-card .task-text")
        ).map(el => el.textContent.trim()).filter(Boolean);

        const questionLines = Array.from(
            document.querySelectorAll("#questionList .task-card .task-text")
        ).map(el => el.textContent.trim()).filter(Boolean);

        const combined = [...taskLines, ...questionLines];
        if (combined.length > 0) {
            currentMeeting.content = combined.join("\n");
        }

        // Move its entry into Upcoming Meetings so it can be resumed
        const upcomingListEl = document.getElementById("upcomingMeetingsList");
        if (upcomingListEl && currentMeeting.entry) {
            upcomingListEl.classList.remove("hidden");
            upcomingListEl.prepend(currentMeeting.entry);
        }
    }

    document.getElementById("screen-editor").classList.add("hidden");
    document.getElementById("screen-home").classList.remove("hidden");
});


/* Create task/question card */
function createCard(text, panelID) {
    const container = document.getElementById(panelID);

    const card = document.createElement("div");
    card.classList.add("task-card");

    card.innerHTML = `
        <div class="card-top">
            <div class="task-text">${text}</div>
            <div class="task-icons">
                <span class="edit-icon">Edit</span>
                <span class="delete-icon">Delete</span>
            </div>
        </div>

        <div class="action-panel hidden">
            <input class="edit-input" value="${text}">
            <button class="save-btn">Save</button>
            <button class="cancel-btn">Cancel</button>
        </div>

        <div class="delete-panel hidden">
            <p>Delete this item?</p>
            <button class="confirm-delete">Delete</button>
            <button class="cancel-delete">Cancel</button>
        </div>
    `;

    container.appendChild(card);
    attachCardControls(card);
    return card;
}


/* Card controls */
function attachCardControls(card) {
    const editIcon = card.querySelector(".edit-icon");
    const deleteIcon = card.querySelector(".delete-icon");
    const editPanel = card.querySelector(".action-panel");
    const deletePanel = card.querySelector(".delete-panel");
    const inputField = card.querySelector(".edit-input");
    const label = card.querySelector(".task-text");

    editIcon.addEventListener("click", () => {
        deletePanel.classList.add("hidden");
        editPanel.classList.remove("hidden");
        card.querySelector(".task-icons").style.display = "none";
        inputField.focus();
    });

    card.querySelector(".save-btn").addEventListener("click", () => {
        const val = inputField.value.trim();
        if (val) label.textContent = val;
        editPanel.classList.add("hidden");
        card.querySelector(".task-icons").style.display = "flex";
    });

    card.querySelector(".cancel-btn").addEventListener("click", () => {
        if (!label.textContent.trim()) card.remove();
        else {
            editPanel.classList.add("hidden");
            card.querySelector(".task-icons").style.display = "flex";
        }
    });

    deleteIcon.addEventListener("click", () => deletePanel.classList.remove("hidden"));
    card.querySelector(".confirm-delete").addEventListener("click", () => card.remove());
    card.querySelector(".cancel-delete").addEventListener("click", () => deletePanel.classList.add("hidden"));
}


/* Add new card in editor (+ button) */
document.getElementById("addBtn").addEventListener("click", () => {
    const isTasks = document.getElementById("tabTasks").classList.contains("active");
    const panel = isTasks ? "taskList" : "questionList";

    const card = createCard("", panel);
    const editPanel = card.querySelector(".action-panel");
    const inputField = card.querySelector(".edit-input");

    card.querySelector(".task-icons").style.display = "none";
    card.querySelector(".task-text").textContent = "";

    editPanel.classList.remove("hidden");
    inputField.focus();
});


/* ============================================================
   SWITCH TABS (TASKS / QUESTIONS)
============================================================ */
document.getElementById("tabTasks").addEventListener("click", () => switchTab("tasks"));
document.getElementById("tabQuestions").addEventListener("click", () => switchTab("questions"));

function switchTab(tab) {
    const tasksTab = document.getElementById("tabTasks");
    const questionsTab = document.getElementById("tabQuestions");
    const tasksPanel = document.getElementById("taskList");
    const questionsPanel = document.getElementById("questionList");

    if (tab === "tasks") {
        tasksTab.classList.add("active");
        questionsTab.classList.remove("active");
        tasksPanel.classList.remove("hidden");
        questionsPanel.classList.add("hidden");
    } else {
        tasksTab.classList.remove("active");
        questionsTab.classList.add("active");
        questionsPanel.classList.remove("hidden");
        tasksPanel.classList.add("hidden");
    }
}


/* Start meeting */
document.getElementById("startMeetingBtn").addEventListener("click", openDuringMeeting);

function openDuringMeeting() {

    document.getElementById("screen-editor").classList.add("hidden");
    document.getElementById("screen-during").classList.remove("hidden");

    const list = document.getElementById("duringList");
    list.innerHTML = "";

    document.querySelectorAll("#taskList .task-card").forEach(card => {
        addDuringRow(card.querySelector(".task-text").textContent.trim(), list);
    });
}


/* Switch to questions during meeting */
document.getElementById("switchToQuestions").addEventListener("click", openQuestionMode);

function openQuestionMode() {

    document.getElementById("screen-during").classList.add("hidden");
    document.getElementById("screen-during-questions").classList.remove("hidden");

    const list = document.getElementById("duringQuestionList");
    list.innerHTML = "";

    document.querySelectorAll("#questionList .task-card").forEach(card => {
        addDuringRow(card.querySelector(".task-text").textContent.trim(), list);
    });
}


/* During-meeting row builder */
function addDuringRow(text, container) {
    container.appendChild(makeDuringCard(text));
}

function makeDuringCard(text) {
    const row = document.createElement("div");
    row.classList.add("during-card");

    row.innerHTML = `
        <span class="during-text">${text}</span>
        <div class="check-box"></div>
    `;

    const checkbox = row.querySelector(".check-box");
    checkbox.addEventListener("click", () => {
        const now = Date.now();

        checkbox.classList.toggle("checked");
        row.classList.toggle("completed");
        checkbox.innerHTML = checkbox.classList.contains("checked") ? "✔" : "";

        // When the item is first checked, record how long it was highlighted
        // (i.e., how long the topic was actively discussed).
        if (checkbox.classList.contains("checked")) {
            const start = row.dataset.highlightStart
                ? parseInt(row.dataset.highlightStart, 10)
                : NaN;
            if (!Number.isNaN(start) && !row.dataset.talkDurationMs) {
                const durationMs = Math.max(0, now - start);
                row.dataset.talkDurationMs = String(durationMs);
            }

            // Once we’ve committed the duration, clear the highlight state.
            delete row.dataset.highlightStart;
        }

        // Once it's actually checked, clear any temporary highlight
        if (checkbox.classList.contains("checked")) {
            row.classList.remove("highlighted");
        }
    });

    // Sneaky highlight: clicking the row (not the checkbox) toggles a soft highlight
    row.addEventListener("click", (e) => {
        if (e.target.closest(".check-box")) return; // ignore clicks on checkbox
        // If it’s already completed, ignore highlight clicks.
        if (row.classList.contains("completed")) return;

        // One-way: clicking sets highlight (start timing) but doesn’t toggle it off.
        // Ending the highlight happens when the checkbox is clicked.
        if (!row.classList.contains("highlighted")) {
            row.classList.add("highlighted");
            row.dataset.highlightStart = String(Date.now());
        }
    });

    return row;
}


/* Add during-meeting new item */
document.getElementById("duringAddTask").addEventListener("click", () => {
    insertDuringEditableRow(document.getElementById("duringList"));
});

document.getElementById("duringAddQuestion").addEventListener("click", () => {
    insertDuringEditableRow(document.getElementById("duringQuestionList"));
});

function insertDuringEditableRow(container) {

    const wrapper = document.createElement("div");
    wrapper.classList.add("during-edit-row");

    wrapper.innerHTML = `
        <input type="text" class="during-edit-input" placeholder="Type here...">
        <div class="during-edit-actions">
            <button class="during-save-btn">Save</button>
            <button class="during-cancel-btn">Cancel</button>
        </div>
    `;

    container.appendChild(wrapper);
    wrapper.querySelector(".during-edit-input").focus();

    wrapper.querySelector(".during-save-btn").addEventListener("click", () => {
        const val = wrapper.querySelector(".during-edit-input").value.trim();
        if (!val) return;
        // Mark items created during the live phase as "new"
        const newCard = makeDuringCard(val);
        newCard.dataset.newItem = "1";
        // New topics/questions added mid-interview should start highlighted
        // so their “time talking” begins as soon as they’re saved.
        newCard.classList.add("highlighted");
        newCard.dataset.highlightStart = String(Date.now());
        container.replaceChild(newCard, wrapper);
    });

    wrapper.querySelector(".during-cancel-btn").addEventListener("click", () => wrapper.remove());
}


/* Summary page builder */
document.getElementById("goToSummary").addEventListener("click", openSummaryScreen);

function openSummaryScreen() {
    document.getElementById("screen-during").classList.add("hidden");
    document.getElementById("screen-during-questions").classList.add("hidden");
    document.getElementById("screen-summary").classList.remove("hidden");

    const list = document.getElementById("actionList");
    list.innerHTML = "";

    /* FOLLOW-UP (always shown first) */
    const defaults = [
        "Email the interviewer a thank-you note.",
        "Follow up in 5–7 days for next steps.",
        "Review your responses and refine your pitch."
    ];

    list.appendChild(makeSectionHeader("Follow-Up Items"));
    defaults.forEach(text => list.appendChild(makeSummaryRow(text, true)));

    /* TASKS */
    const tasks = document.querySelectorAll("#duringList .during-card");
    if (tasks.length > 0) {
        list.appendChild(makeSectionHeader("Tasks"));
        tasks.forEach(row => {
            const text = row.querySelector(".during-text").textContent.trim();
            const isDone = row.classList.contains("completed");
            const isNew = row.dataset.newItem === "1";
            const durationLabel = formatTalkDuration(row.dataset.talkDurationMs);
            const icon = isDone ? "✔" : "✖";
            const statusClass = isDone ? "status-pill complete" : "status-pill missed";
            const label = isDone ? "Talked about" : "Not talked about";

            const newPill = isNew
                ? `<span class="status-pill new">New topic</span>`
                : "";

            const combined = `
                <span class="summary-main-text">${text}</span>
                <span class="action-meta">
                    ${newPill}
                    <span class="${statusClass}">${icon} ${label}</span>
                    ${durationLabel}
                </span>
            `.trim();

            list.appendChild(makeSummaryRow(combined));
        });
    }

    /* QUESTIONS */
    const questions = document.querySelectorAll("#duringQuestionList .during-card");
    if (questions.length > 0) {
        list.appendChild(makeSectionHeader("Questions"));
        questions.forEach(row => {
            const text = row.querySelector(".during-text").textContent.trim();
            const isDone = row.classList.contains("completed");
            const isNew = row.dataset.newItem === "1";
            const icon = isDone ? "✔" : "✖";
            const statusClass = isDone ? "status-pill complete" : "status-pill missed";
            const label = isDone ? "Asked" : "Not asked";

            const newPill = isNew
                ? `<span class="status-pill new">New question</span>`
                : "";

            const combined = `
                <span class="summary-main-text">${text}</span>
                <span class="action-meta">
                    ${newPill}
                    <span class="${statusClass}">${icon} ${label}</span>
                </span>
            `.trim();

            list.appendChild(makeSummaryRow(combined));
        });
    }
}


/* Summary helpers */
function formatTalkDuration(msString) {
    if (!msString) return "";
    const ms = parseInt(msString, 10);
    if (!Number.isFinite(ms) || ms <= 0) return "";

    const totalSeconds = Math.round(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    let label = "";
    if (minutes > 0) {
        label = `${minutes}m`;
        if (seconds > 0) {
            label += ` ${seconds}s`;
        }
    } else {
        label = `${seconds}s`;
    }

    return `<span class="duration-pill">Time on topic: ${label}</span>`;
}

function makeSectionHeader(title) {
    const h = document.createElement("h3");
    h.textContent = title;
    h.style.marginTop = "28px";
    h.style.marginBottom = "10px";
    h.style.fontWeight = "700";
    return h;
}

function makeSummaryRow(text, editable = false) {
    const div = document.createElement("div");
    div.classList.add("action-item");

    div.innerHTML = `
        <div class="action-row">
            <span class="action-text">${text}</span>
            ${
                editable
                    ? `<div class="action-icons">
                            <span class="edit">Edit</span>
                            <span class="delete">Delete</span>
                       </div>`
                    : ""
            }
        </div>
        ${
            editable
                ? `<div class="action-panel hidden">
                        <input class="edit-input" value="${text}">
                        <button class="save-btn">Save</button>
                        <button class="cancel-btn">Cancel</button>
                   </div>`
                : ""
        }
    `;

    if (editable) {
        const editBtn = div.querySelector(".edit");
        const deleteBtn = div.querySelector(".delete");
        const textEl = div.querySelector(".action-text");
        const iconsEl = div.querySelector(".action-icons");
        const panelEl = div.querySelector(".action-panel");
        const inputEl = div.querySelector(".edit-input");

        editBtn.addEventListener("click", () => {
            if (!panelEl || !inputEl) return;
            panelEl.classList.remove("hidden");
            if (iconsEl) iconsEl.style.display = "none";
            inputEl.value = textEl.textContent.trim();
            inputEl.focus();
        });

        div.querySelector(".save-btn").addEventListener("click", () => {
            const val = inputEl.value.trim();
            if (val) textEl.textContent = val;
            panelEl.classList.add("hidden");
            if (iconsEl) iconsEl.style.display = "flex";
        });

        div.querySelector(".cancel-btn").addEventListener("click", () => {
            panelEl.classList.add("hidden");
            if (iconsEl) iconsEl.style.display = "flex";
            inputEl.value = textEl.textContent.trim();
        });

        deleteBtn.addEventListener("click", () => div.remove());
    }

    return div;
}


/* PDF download */
let pendingPdfUrl = null; // holds latest summary PDF URL while user decides saving

document.getElementById("downloadSummary").addEventListener("click", async () => {

    document.body.classList.add("pdf-shrink");
    await new Promise(r => setTimeout(r, 80));

    const summaryElement = document.getElementById("summaryCard");

    const canvas = await html2canvas(summaryElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff"
    });

    const imgData = canvas.toDataURL("image/png");

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4"
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 24;

    let imgWidth = pdfWidth - margin * 2;
    let imgHeight = (canvas.height * imgWidth) / canvas.width;

    // If the rendered image is taller than the printable area,
    // scale it down so it fits entirely on one 8.5x11 page.
    const maxImgHeight = pdfHeight - margin * 2;
    if (imgHeight > maxImgHeight) {
        const scale = maxImgHeight / imgHeight;
        imgHeight = maxImgHeight;
        imgWidth = imgWidth * scale;
    }

    pdf.addImage(imgData, "PNG", (pdfWidth - imgWidth) / 2, margin, imgWidth, imgHeight);

    // Create a temporary blob URL so a Past Meeting entry
    // can reopen this summary PDF during this browser session.
    let pdfUrl = null;
    try {
        const blob = pdf.output("blob");
        pdfUrl = URL.createObjectURL(blob);
    } catch (e) {
        pdfUrl = null;
    }

    const now = new Date();
    const dateLabel = now
        .toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
        .replace(/,/g, "");
    const fileName = `Interview Summary - ${dateLabel}.pdf`;

    pdf.save(fileName);

    document.body.classList.remove("pdf-shrink");

    // Ask whether to save this summary into Past Meetings
    pendingPdfUrl = pdfUrl;
    openSavePastModal();
});


/* ============================================================
   SAVE SUMMARY METADATA TO PAST MEETINGS
============================================================ */
function saveSummaryToPastMeetings(pdfUrl) {
    const title =
        (currentMeeting && currentMeeting.title && currentMeeting.title.trim()) ||
        (activeMeeting && activeMeeting.title && activeMeeting.title.trim()) ||
        "Interview Summary";

    const date = new Date();
    const dateStr = date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
    const timeStr = date.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit"
    });

    // Home sidebar past interviews list — move the original meeting chip down
    const pastListHome = document.getElementById("pastMeetingsList");
    let meetingIdForHistory = null;
    if (pastListHome) {
        const originalEntry =
            (currentMeeting && currentMeeting.entry) ||
            (activeMeeting && activeMeeting.entry) ||
            null;

        if (originalEntry) {
            // Update its label to include the date, then move it under Past Interviews
            const titleSpan = originalEntry.querySelector(".meeting-title");
            const label = `${title} — ${dateStr} ${timeStr}`;
            if (titleSpan) {
                titleSpan.textContent = label;
            } else {
                originalEntry.textContent = label;
            }

            if (originalEntry.dataset.meetingId) {
                meetingIdForHistory = originalEntry.dataset.meetingId;
            }

            if (originalEntry.parentElement) {
                originalEntry.parentElement.removeChild(originalEntry);
            }

            pastListHome.classList.remove("hidden");
            pastListHome.prepend(originalEntry);
        } else {
            // Fallback: if we somehow don't have the original chip, create one
            addPastMeetingEntry(pastListHome, title, dateStr, timeStr, pdfUrl, meetingIdForHistory);
        }
    }

    // Results screen list
    const resultsList = document.getElementById("resultsList");
    addPastMeetingEntry(resultsList, title, dateStr, timeStr, pdfUrl, meetingIdForHistory);
}

function addPastMeetingEntry(listElement, title, dateStr, timeStr, pdfUrl, meetingId) {
    if (!listElement) return;

    const entry = document.createElement("div");
    entry.classList.add("meeting-entry");
    const dateLabel = `${dateStr} ${timeStr}`;
    entry.dataset.dateLabel = dateLabel;
    entry.dataset.title = title;
    if (meetingId) {
        entry.dataset.meetingId = String(meetingId);
    }
    entry.textContent = `${title} — ${dateLabel}`;

    if (pdfUrl) {
        entry.style.cursor = "pointer";
        entry.addEventListener("click", () => {
            window.open(pdfUrl, "_blank", "noopener");
        });
    }

    listElement.classList.remove("hidden");
    listElement.prepend(entry);
}


/* Save-to-past modal controls */
function openSavePastModal() {
    const overlay = document.getElementById("savePastModal");
    if (!overlay) return;
    overlay.classList.remove("hidden");
}

const savePastConfirmBtn = document.getElementById("savePastConfirm");
const savePastCancelBtn = document.getElementById("savePastCancel");
const savePastOverlay = document.getElementById("savePastModal");

if (savePastConfirmBtn && savePastCancelBtn && savePastOverlay) {
    savePastConfirmBtn.addEventListener("click", () => {
        // Save the most recently generated PDF into Past Meetings
        saveSummaryToPastMeetings(pendingPdfUrl);
        savePastOverlay.classList.add("hidden");
    });

    savePastCancelBtn.addEventListener("click", () => {
        // User chose not to save; clear any pending URL reference
        pendingPdfUrl = null;
        savePastOverlay.classList.add("hidden");
    });

    // Close modal if user clicks on the dimmed background
    savePastOverlay.addEventListener("click", (e) => {
        if (e.target === savePastOverlay) {
            savePastOverlay.classList.add("hidden");
        }
    });
}

// Results screen navigation
const resultsBackHomeBtn = document.getElementById("resultsBackHome");
const resultsNewMeetingBtn = document.getElementById("resultsNewMeeting");

if (resultsBackHomeBtn) {
    resultsBackHomeBtn.addEventListener("click", () => {
        document.getElementById("screen-results")?.classList.add("hidden");
        document.getElementById("screen-home")?.classList.remove("hidden");
    });
}

/* Settings modal and theme/layout toggles */
const settingsButtons = document.querySelectorAll(".settings-btn");
const settingsPanel = document.getElementById("settingsPanel");
const layoutComfortableBtn = document.getElementById("layoutComfortable");
const layoutCompactBtn = document.getElementById("layoutCompact");
const darkModeToggle = document.getElementById("darkModeToggle");
const transparentModeToggle = document.getElementById("transparentModeToggle");

if (settingsPanel && settingsButtons.length > 0) {
    settingsButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            settingsPanel.classList.toggle("hidden");
        });
    });
}

if (layoutComfortableBtn) {
    layoutComfortableBtn.addEventListener("click", () => {
        document.body.classList.remove("layout-compact");
    });
}

if (layoutCompactBtn) {
    layoutCompactBtn.addEventListener("click", () => {
        document.body.classList.add("layout-compact");
    });
}

if (darkModeToggle) {
    darkModeToggle.addEventListener("change", () => {
        if (darkModeToggle.checked) {
            document.body.classList.add("theme-dark");
        } else {
            document.body.classList.remove("theme-dark");
        }
    });
}

if (transparentModeToggle) {
    transparentModeToggle.addEventListener("change", () => {
        if (transparentModeToggle.checked) {
            document.body.classList.add("theme-transparent");
        } else {
            document.body.classList.remove("theme-transparent");
        }
    });
}

// Reset demo: clear all in-memory UI so you don't have to refresh.
const resetDemoBtn = document.getElementById("resetDemoBtn");
if (resetDemoBtn) {
    resetDemoBtn.addEventListener("click", () => {
        // Clear global state
        activeMeeting = null;
        currentMeeting = null;
        pendingPdfUrl = null;

        // Clear text input
        prepInput.value = "";

        // Clear all lists
        const idsToClear = [
            "meetingList",
            "pastMeetingsList",
            "upcomingMeetingsList",
            "meetingListSummary",
            "resultsList",
            "taskList",
            "questionList",
            "duringList",
            "duringQuestionList",
            "actionList"
        ];
        idsToClear.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = "";
        });

        // Hide non-home screens
        ["screen-editor", "screen-during", "screen-during-questions", "screen-summary", "screen-results"].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add("hidden");
        });
        const home = document.getElementById("screen-home");
        if (home) home.classList.remove("hidden");

        // Hide sub-lists initially
        const pastList = document.getElementById("pastMeetingsList");
        const upcomingList = document.getElementById("upcomingMeetingsList");
        if (pastList) pastList.classList.add("hidden");
        if (upcomingList) upcomingList.classList.add("hidden");
    });
}

if (resultsNewMeetingBtn) {
    resultsNewMeetingBtn.addEventListener("click", () => {
        document.getElementById("screen-results")?.classList.add("hidden");
        document.getElementById("screen-home")?.classList.remove("hidden");

        // Start a fresh meeting slot on home
        activeMeeting = addMeetingEntry("New Meeting");
        prepInput.value = "";
    });
}
