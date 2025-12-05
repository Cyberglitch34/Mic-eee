/* ============================================================
   PREP INPUT → GO TO EDITOR SCREEN
============================================================ */
document.getElementById("goEditor").addEventListener("click", () => {
    const input = document.getElementById("prepInput");
    const raw = input.value.trim();

    if (raw === "") return;

    // 🔥 SWITCH FROM HOME → EDITOR
    document.getElementById("screen-home").classList.add("hidden");
    document.getElementById("screen-editor").classList.remove("hidden");

    // Split input (each line becomes a sticky note)
    const lines = raw
        .split("\n")
        .map(l => l.trim())
        .filter(l => l.length > 0);

    lines.forEach(line => {
        if (line.endsWith("?")) {
            createCard(line, "questionList");
        } else {
            createCard(line, "taskList");
        }
    });

    // optional: clear input box
    input.value = "";
});


/* ============================================================
   CREATE CARD (TASK OR QUESTION)
============================================================ */
function createCard(text, targetList) {
    const container = document.getElementById(targetList);

    const card = document.createElement("div");
    card.classList.add("task-card");

    card.innerHTML = `
        <ul style="margin:0; padding-left:20px;">
            <li class="task-text">${text}</li>
        </ul>

        <div class="task-icons">
            <span class="edit-icon">✏️</span>
            <span class="delete-icon">🗑️</span>
        </div>

        <!-- EDIT PANEL — NO DELETE OPTION -->
        <div class="action-panel hidden">
            <input class="edit-input" value="${text}">
            <button class="save-btn btn btn-success btn-sm">Save</button>
            <button class="cancel-btn btn btn-secondary btn-sm">Cancel</button>
        </div>

        <!-- DELETE PANEL (TRIGGERED ONLY BY TRASH ICON) -->
        <div class="delete-panel hidden">
            <p>Delete this item?</p>
            <button class="confirm-delete btn btn-danger btn-sm">Delete</button>
            <button class="cancel-delete btn btn-secondary btn-sm">Cancel</button>
        </div>
    `;

    attachCardControls(card);
    container.appendChild(card);

    return card;
}



/* ============================================================
   NEW CARD VIA + BUTTON → AUTO-EDIT MODE
============================================================ */
function createEditableCard(targetList) {
    const card = createCard("", targetList);

    const editPanel = card.querySelector(".action-panel");
    const input = card.querySelector(".edit-input");
    const editIcon = card.querySelector(".edit-icon");
    const deleteIcon = card.querySelector(".delete-icon");
    const textLabel = card.querySelector(".task-text");

    // brand-new card should start empty and editing
    textLabel.textContent = "";

    // hide icons while adding new card
    editIcon.style.display = "none";
    deleteIcon.style.display = "none";

    // open edit panel immediately
    editPanel.classList.remove("hidden");
    input.focus();

    return card;
}


/* ============================================================
   CARD LOGIC
============================================================ */
function attachCardControls(card) {
    const editIcon = card.querySelector(".edit-icon");
    const deleteIcon = card.querySelector(".delete-icon");
    const actionPanel = card.querySelector(".action-panel");
    const deletePanel = card.querySelector(".delete-panel");
    const inputField = card.querySelector(".edit-input");
    const textLabel = card.querySelector(".task-text");

    /* ---- OPEN EDIT MODE ---- */
    editIcon.addEventListener("click", () => {
        deletePanel.classList.add("hidden");
        actionPanel.classList.remove("hidden");
        inputField.focus();

        // hide icons while editing
        editIcon.style.display = "none";
        deleteIcon.style.display = "none";
    });

    /* ---- SAVE EDIT ---- */
    card.querySelector(".save-btn").addEventListener("click", () => {
        const newText = inputField.value.trim();
        if (newText !== "") textLabel.textContent = newText;

        actionPanel.classList.add("hidden");

        // show icons again
        editIcon.style.display = "";
        deleteIcon.style.display = "";
    });

    /* ---- CANCEL EDIT ---- */
    card.querySelector(".cancel-btn").addEventListener("click", () => {
        const original = textLabel.textContent.trim();

        if (original === "" && inputField.value.trim() === "") {
            card.remove();
            return;
        }

        actionPanel.classList.add("hidden");

        // show icons again
        editIcon.style.display = "";
        deleteIcon.style.display = "";
    });

    /* ---- OPEN DELETE CONFIRMATION ---- */
    deleteIcon.addEventListener("click", () => {
        actionPanel.classList.add("hidden");
        deletePanel.classList.remove("hidden");

        // hide BOTH icons when delete confirmation shows
        editIcon.style.display = "none";
        deleteIcon.style.display = "none";
    });

    /* ---- CONFIRM DELETE ---- */
    card.querySelector(".confirm-delete").addEventListener("click", () => {
        card.classList.add("fade-out");
        setTimeout(() => card.remove(), 300);
    });

    /* ---- CANCEL DELETE ---- */
    card.querySelector(".cancel-delete").addEventListener("click", () => {
        deletePanel.classList.add("hidden");

        // show icons again after cancel
        editIcon.style.display = "";
        deleteIcon.style.display = "";
    });
}

/* ============================================================
   TAB SWITCHING
============================================================ */
document.getElementById("tabTasks").addEventListener("click", () => {
    switchTab("taskList", "questionList", "tabTasks", "tabQuestions");
});

document.getElementById("tabQuestions").addEventListener("click", () => {
    switchTab("questionList", "taskList", "tabQuestions", "tabTasks");
});

function switchTab(showList, hideList, activeTab, inactiveTab) {
    document.getElementById(showList).classList.remove("hidden");
    document.getElementById(hideList).classList.add("hidden");

    document.getElementById(activeTab).classList.add("active");
    document.getElementById(inactiveTab).classList.remove("active");
}


/* ============================================================
   ADD BUTTON
============================================================ */
document.getElementById("addBtn").addEventListener("click", () => {
    if (document.getElementById("tabTasks").classList.contains("active")) {
        createEditableCard("taskList");
    } else {
        createEditableCard("questionList");
    }
});
