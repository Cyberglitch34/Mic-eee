/* ============================================================
   GLOBAL STATE
============================================================ */
let activeMeeting = null;
let currentMeeting = null;


/* ============================================================
   TEXTAREA AUTO-SCROLL FIX
============================================================ */
const prepInput = document.getElementById("prepInput");
prepInput.addEventListener("input", () => {
    prepInput.scrollTop = 0;
});


/* ============================================================
   GO TO EDITOR
============================================================ */
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


/* ============================================================
   NEW MEETING BUTTONS
============================================================ */
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


/* ============================================================
   ADD MEETING ENTRY (WITH THREE-DOT MENU)
============================================================ */
function addMeetingEntry(text) {
    const list = document.getElementById("meetingList");

    const meetingObj = {
        title: text,
        content: text === "New Meeting" ? "" : text
    };

    const entry = document.createElement("div");
    entry.classList.add("meeting-entry");

    entry.innerHTML = `
        <span class="meeting-title">
            ${text.length > 24 ? text.substring(0, 24) + "…" : text}
        </span>

        <div class="meeting-menu-btn">⋮</div>

        <div class="meeting-menu hidden">
            <div class="menu-item delete-item">Delete</div>
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

    /* ----- MOVE TO PAST ----- */
    entry.querySelector(".past-item").addEventListener("click", (e) => {
        e.stopPropagation();
        document.getElementById("pastMeetingsList")?.prepend(entry);
    });

    /* ----- MOVE TO UPCOMING ----- */
    entry.querySelector(".upcoming-item").addEventListener("click", (e) => {
        e.stopPropagation();
        document.getElementById("upcomingMeetingsList")?.prepend(entry);
    });

    list.prepend(entry);
    return meetingObj;
}


/* ============================================================
   OPEN EDITOR
============================================================ */
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


/* ============================================================
   HOME FROM EDITOR
============================================================ */
document.getElementById("homeBtn").addEventListener("click", () => {
    document.getElementById("screen-editor").classList.add("hidden");
    document.getElementById("screen-home").classList.remove("hidden");
});


/* ============================================================
   CREATE TASK/QUESTION CARD
============================================================ */
function createCard(text, panelID) {
    const container = document.getElementById(panelID);

    const card = document.createElement("div");
    card.classList.add("task-card");

    card.innerHTML = `
        <div class="card-top">
            <div class="task-text">${text}</div>
            <div class="task-icons">
                <span class="edit-icon">✏️</span>
                <span class="delete-icon">🗑️</span>
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


/* ============================================================
   CARD CONTROLS
============================================================ */
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
        editPanel.classList.add("hidden");
    });

    deleteIcon.addEventListener("click", () => deletePanel.classList.remove("hidden"));
    card.querySelector(".confirm-delete").addEventListener("click", () => card.remove());
    card.querySelector(".cancel-delete").addEventListener("click", () => deletePanel.classList.add("hidden"));
}


/* ============================================================
   ADD NEW CARD IN EDITOR (+ BUTTON)
============================================================ */
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


/* ============================================================
   START MEETING
============================================================ */
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


/* ============================================================
   SWITCH TO QUESTIONS DURING MEETING
============================================================ */
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


/* ============================================================
   DURING-MEETING ROW BUILDER
============================================================ */
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
        checkbox.classList.toggle("checked");
        row.classList.toggle("completed");
        checkbox.innerHTML = checkbox.classList.contains("checked") ? "✔" : "";
    });

    return row;
}


/* ============================================================
   ADD DURING-MEETING NEW ITEM
============================================================ */
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
        container.replaceChild(makeDuringCard(val), wrapper);
    });

    wrapper.querySelector(".during-cancel-btn").addEventListener("click", () => wrapper.remove());
}


/* ============================================================
   SUMMARY PAGE BUILDER
============================================================ */
document.getElementById("goToSummary").addEventListener("click", openSummaryScreen);

function openSummaryScreen() {
    document.getElementById("screen-during").classList.add("hidden");
    document.getElementById("screen-during-questions").classList.add("hidden");
    document.getElementById("screen-summary").classList.remove("hidden");

    const list = document.getElementById("actionList");
    list.innerHTML = "";

    /* TASKS */
    const tasks = document.querySelectorAll("#duringList .during-card");
    if (tasks.length > 0) {
        list.appendChild(makeSectionHeader("Tasks"));
        tasks.forEach(row => {
            const text = row.querySelector(".during-text").textContent.trim();
            const done = row.classList.contains("completed") ? "✔ Completed" : "⬜ Not completed";
            list.appendChild(makeSummaryRow(`${text} — ${done}`));
        });
    }

    /* QUESTIONS */
    const questions = document.querySelectorAll("#duringQuestionList .during-card");
    if (questions.length > 0) {
        list.appendChild(makeSectionHeader("Questions"));
        questions.forEach(row => {
            const text = row.querySelector(".during-text").textContent.trim();
            const done = row.classList.contains("completed") ? "✔ Answered" : "⬜ Not answered";
            list.appendChild(makeSummaryRow(`${text} — ${done}`));
        });
    }

    /* FOLLOW-UP */
    const defaults = [
        "Email the interviewer a thank-you note.",
        "Follow up in 5–7 days for next steps.",
        "Review your responses and refine your pitch."
    ];

    list.appendChild(makeSectionHeader("Follow-Up Items"));
    defaults.forEach(text => list.appendChild(makeSummaryRow(text, true)));
}


/* ============================================================
   SUMMARY HELPERS
============================================================ */
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
        <span class="action-text">${text}</span>
        ${
            editable
                ? `<div class="action-icons">
                        <span class="edit">✏️</span>
                        <span class="delete">🗑️</span>
                   </div>`
                : ""
        }
    `;

    if (editable) {
        div.querySelector(".edit").addEventListener("click", () => {
            const newVal = prompt("Edit item:", text);
            if (newVal && newVal.trim())
                div.querySelector(".action-text").textContent = newVal.trim();
        });

        div.querySelector(".delete").addEventListener("click", () => div.remove());
    }

    return div;
}


/* ============================================================
   PDF DOWNLOAD
============================================================ */
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
    const imgWidth = pdfWidth - 40;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 20, 20, imgWidth, imgHeight);
    pdf.save("Interview_Summary.pdf");

    document.body.classList.remove("pdf-shrink");
});
