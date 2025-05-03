// Global state
let currentJournalId = null;
let currentEntryId = null;
let journalsData = [];
let currentJournalChecklistTemplates = [];
let currentJournalHasSlTp = false;

// DOM Elements
const journalSelect = document.getElementById("journal-select");
const addJournalBtn = document.getElementById("add-journal-btn");
const manageChecklistBtn = document.getElementById("manage-checklist-btn");
const viewStatsBtn = document.getElementById("view-stats-btn"); // New
const entriesSection = document.querySelector(".entries-section");
const currentJournalNameH2 = document.getElementById("current-journal-name");
const addEntryBtn = document.getElementById("add-entry-btn");
const entriesListDiv = document.getElementById("entries-list");

// Modals
const journalModal = document.getElementById("journal-modal");
const checklistModal = document.getElementById("checklist-modal");
const entryModal = document.getElementById("entry-modal");
const statsModal = document.getElementById("stats-modal"); // New
const lightboxModal = document.getElementById("lightbox-modal"); // New

// Journal Modal Elements
const journalModalTitle = document.getElementById("journal-modal-title");
const journalEditIdInput = document.getElementById("journal-edit-id");
const journalNameInput = document.getElementById("journal-name");
const journalDescriptionInput = document.getElementById("journal-description");
const journalHasSlTpCheckbox = document.getElementById("journal-has-sl-tp");
const journalChecklistTemplatesTextarea = document.getElementById("journal-checklist-templates");
const saveJournalBtn = document.getElementById("save-journal-btn");
const deleteJournalBtn = document.getElementById("delete-journal-btn");

// Checklist Modal Elements
const checklistJournalNameSpan = document.getElementById("checklist-journal-name");
const checklistTemplateListUl = document.getElementById("checklist-template-list");
const newChecklistItemTextInput = document.getElementById("new-checklist-item-text");
const addChecklistItemBtn = document.getElementById("add-checklist-item-btn");

// Entry Modal Elements
const entryModalTitle = document.getElementById("entry-modal-title");
const entryEditIdInput = document.getElementById("entry-edit-id");
const entryJournalIdInput = document.getElementById("entry-journal-id");
const entryDateInput = document.getElementById("entry-date");
const entrySymbolInput = document.getElementById("entry-symbol"); // New
const entryPositionTypeSelect = document.getElementById("entry-position-type"); // New
const entryStrategyInput = document.getElementById("entry-strategy");
const entryInitialRrInput = document.getElementById("entry-initial-rr"); // New
const entryPnlInput = document.getElementById("entry-pnl");
const entryResultSelect = document.getElementById("entry-result");
const slTpFieldsDiv = document.getElementById("sl-tp-fields");
const entrySlInput = document.getElementById("entry-sl");
const entryTpInput = document.getElementById("entry-tp");
const entryConfidenceSlider = document.getElementById("entry-confidence");
const confidenceValueSpan = document.getElementById("confidence-value");
const entryRatingInput = document.getElementById("entry-rating");
const starsDisplayDiv = document.getElementById("stars-display");
const entryNotesTextarea = document.getElementById("entry-notes");
const entryChecklistDiv = document.getElementById("entry-checklist");
const entryImageCategorySelect = document.getElementById("entry-image-category"); // New
const entryImagesPreviewBeforeDiv = document.getElementById("entry-images-preview-before"); // New
const entryImagesPreviewAfterDiv = document.getElementById("entry-images-preview-after"); // New
const entryImagesPreviewGeneralDiv = document.getElementById("entry-images-preview-general"); // New
const entryImageUploadInput = document.getElementById("entry-image-upload");
const uploadStatusSpan = document.getElementById("upload-status");
const saveEntryBtn = document.getElementById("save-entry-btn");
const deleteEntryBtn = document.getElementById("delete-entry-btn");

// Stats Modal Elements
const statsJournalNameSpan = document.getElementById("stats-journal-name"); // New
const statsContentDiv = document.getElementById("stats-content"); // New

// Lightbox Modal Elements
const lightboxImg = document.getElementById("lightbox-img"); // New
const lightboxCaption = document.getElementById("lightbox-caption"); // New

// --- API Helper ---
async function apiRequest(url, method = "GET", body = null, isFormData = false) {
    const options = {
        method,
        headers: {},
    };
    if (isFormData) {
        // Let the browser set the Content-Type for FormData
        options.body = body;
    } else if (body) {
        options.headers["Content-Type"] = "application/json";
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`/api${url}`, options);
        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                // If response is not JSON, create a generic error
                errorData = { error: `HTTP error! status: ${response.status}` };
            }
            // Add status code to the error message if available
            const errorMessage = errorData.message || errorData.error || `HTTP error! status: ${response.status}`;
            const error = new Error(errorMessage);
            error.status = response.status; // Attach status code to error object
            throw error;
        }
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            return await response.json();
        } else {
            // Handle non-JSON responses (like DELETE success)
            return { success: true, status: response.status };
        }
    } catch (error) {
        console.error("API Request Failed:", error);
        // Display a more user-friendly message, especially for known errors like 404
        if (error.status === 404 && url.includes("/statistics")) {
             // Specific message handled in openStatsModal
        } else {
            alert(`API Error: ${error.message}`);
        }
        throw error;
    }
}

// --- Modal Handling ---
function openModal(modalId) {
    document.getElementById(modalId).style.display = "block";
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = "none";
        // Reset forms inside modals when closed
        if (modalId === "journal-modal") resetJournalForm();
        if (modalId === "entry-modal") resetEntryForm();
        if (modalId === "checklist-modal") resetChecklistForm();
        if (modalId === "stats-modal") statsContentDiv.innerHTML = "<p>Statistiken werden geladen...</p>"; // Reset stats view
    }
}

// Close modal if clicked outside content or on close button
window.onclick = function(event) {
    if (event.target.classList.contains("modal")) {
        closeModal(event.target.id);
    }
}
document.querySelectorAll(".close-btn").forEach(btn => {
    btn.onclick = function() {
        closeModal(btn.closest(".modal").id);
    }
});

// --- Journal Management ---
async function loadJournals() {
    try {
        journalsData = await apiRequest("/journals");
        journalSelect.innerHTML = "<option value=\"\">-- Journal auswählen --</option>"; // Reset
        journalsData.forEach(journal => {
            const option = document.createElement("option");
            option.value = journal.id;
            option.textContent = journal.name;
            journalSelect.appendChild(option);
        });
    } catch (error) { /* Handled in apiRequest */ }
}

function handleJournalSelectChange() {
    currentJournalId = journalSelect.value;
    if (currentJournalId) {
        const selectedJournal = journalsData.find(j => j.id == currentJournalId);
        currentJournalNameH2.textContent = `Einträge für: ${selectedJournal.name}`;
        currentJournalHasSlTp = selectedJournal.has_sl_tp_fields;
        entriesSection.style.display = "block";
        manageChecklistBtn.style.display = "inline-block";
        viewStatsBtn.style.display = "inline-block"; // Show stats button
        loadEntries(currentJournalId);
        loadChecklistTemplates(currentJournalId); // Load templates for entry form
    } else {
        entriesSection.style.display = "none";
        manageChecklistBtn.style.display = "none";
        viewStatsBtn.style.display = "none"; // Hide stats button
        currentJournalNameH2.textContent = "Einträge";
        entriesListDiv.innerHTML = "";
        currentJournalChecklistTemplates = [];
        currentJournalHasSlTp = false;
    }
}

function resetJournalForm() {
    journalEditIdInput.value = "";
    journalNameInput.value = "";
    journalDescriptionInput.value = "";
    journalHasSlTpCheckbox.checked = false;
    journalChecklistTemplatesTextarea.value = "";
    journalChecklistTemplatesTextarea.style.display = "block"; // Show for new
    journalModalTitle.textContent = "Neues Journal erstellen";
    deleteJournalBtn.style.display = "none";
}

function openNewJournalModal() {
    resetJournalForm();
    openModal("journal-modal");
}

async function openEditJournalModal() {
    if (!currentJournalId) return;
    try {
        const journal = await apiRequest(`/journals/${currentJournalId}`);
        resetJournalForm();
        journalModalTitle.textContent = `Journal bearbeiten: ${journal.name}`;
        journalEditIdInput.value = journal.id;
        journalNameInput.value = journal.name;
        journalDescriptionInput.value = journal.description || "";
        journalHasSlTpCheckbox.checked = journal.has_sl_tp_fields;
        journalChecklistTemplatesTextarea.style.display = "none"; // Hide template bulk add on edit
        deleteJournalBtn.style.display = "inline-block";
        openModal("journal-modal");
    } catch (error) {
        alert("Fehler beim Laden der Journal-Details.");
    }
}

async function saveJournal() {
    const id = journalEditIdInput.value;
    const name = journalNameInput.value.trim();
    if (!name) {
        alert("Journal-Name darf nicht leer sein.");
        return;
    }

    const data = {
        name: name,
        description: journalDescriptionInput.value.trim(),
        has_sl_tp_fields: journalHasSlTpCheckbox.checked,
    };

    let url = "/journals";
    let method = "POST";

    if (id) { // Editing existing journal
        url = `/journals/${id}`;
        method = "PUT";
    } else { // Creating new journal
        const templates = journalChecklistTemplatesTextarea.value.split("\n")
            .map(line => line.trim()).filter(line => line);
        if (templates.length > 0) {
            data.checklist_templates = templates;
        }
    }

    try {
        const savedJournal = await apiRequest(url, method, data);
        closeModal("journal-modal");
        await loadJournals();
        // Reselect if it was an edit or select the new one
        const selectValue = id || savedJournal.id;
        journalSelect.value = selectValue;
        handleJournalSelectChange();
    } catch (error) {
        alert(`Fehler beim Speichern des Journals: ${error.message}`);
    }
}

async function deleteJournal() {
    const id = journalEditIdInput.value;
    if (!id || !confirm(`Möchten Sie das Journal "${journalNameInput.value}" und alle zugehörigen Einträge wirklich löschen?`)) {
        return;
    }

    try {
        await apiRequest(`/journals/${id}`, "DELETE");
        closeModal("journal-modal");
        currentJournalId = null; // Reset selection
        await loadJournals();
        handleJournalSelectChange(); // Update UI
    } catch (error) {
        alert(`Fehler beim Löschen des Journals: ${error.message}`);
    }
}

// --- Checklist Template Management ---
async function loadChecklistTemplates(journalId) {
    try {
        const journal = await apiRequest(`/journals/${journalId}`);
        currentJournalChecklistTemplates = journal.checklist_templates || [];
        renderChecklistTemplatesForManagement();
    } catch (error) {
        console.error("Failed to load checklist templates:", error);
        currentJournalChecklistTemplates = []; // Reset on error
    }
}

function renderChecklistTemplatesForManagement() {
    checklistTemplateListUl.innerHTML = ""; // Clear list
    if (!currentJournalId) return;

    const journal = journalsData.find(j => j.id == currentJournalId);
    checklistJournalNameSpan.textContent = journal ? journal.name : "";

    currentJournalChecklistTemplates.sort((a, b) => a.order - b.order).forEach(template => {
        const li = document.createElement("li");
        li.dataset.templateId = template.id;
        const textSpan = document.createElement("span");
        textSpan.textContent = template.text;
        // TODO: Add edit functionality here if needed
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Löschen";
        deleteBtn.onclick = () => deleteChecklistItem(template.id);

        li.appendChild(textSpan);
        li.appendChild(deleteBtn);
        checklistTemplateListUl.appendChild(li);
    });
}

function resetChecklistForm() {
    newChecklistItemTextInput.value = "";
}

async function openManageChecklistModal() {
    if (!currentJournalId) return;
    resetChecklistForm();
    await loadChecklistTemplates(currentJournalId); // Ensure latest templates are shown
    openModal("checklist-modal");
}

async function addChecklistItem() {
    const text = newChecklistItemTextInput.value.trim();
    if (!text || !currentJournalId) {
        return;
    }

    try {
        await apiRequest(`/journals/${currentJournalId}/checklist_templates`, "POST", { text });
        newChecklistItemTextInput.value = ""; // Clear input
        await loadChecklistTemplates(currentJournalId); // Refresh list
    } catch (error) {
        alert(`Fehler beim Hinzufügen des Checklistenpunkts: ${error.message}`);
    }
}

async function deleteChecklistItem(templateId) {
    if (!currentJournalId || !confirm("Möchten Sie diesen Checklistenpunkt wirklich löschen?")) {
        return;
    }

    try {
        await apiRequest(`/journals/${currentJournalId}/checklist_templates/${templateId}`, "DELETE");
        await loadChecklistTemplates(currentJournalId); // Refresh list
    } catch (error) {
        alert(`Fehler beim Löschen des Checklistenpunkts: ${error.message}`);
    }
}

// --- Entry Management ---
async function loadEntries(journalId) {
    entriesListDiv.innerHTML = "Lade Einträge...";
    try {
        const entries = await apiRequest(`/journals/${journalId}/entries`);
        renderEntries(entries);
    } catch (error) {
        entriesListDiv.innerHTML = "Fehler beim Laden der Einträge.";
    }
}

function renderEntries(entries) {
    entriesListDiv.innerHTML = ""; // Clear
    if (entries.length === 0) {
        entriesListDiv.innerHTML = "<p>Noch keine Einträge vorhanden.</p>";
        return;
    }
    entries.sort((a, b) => new Date(b.entry_date) - new Date(a.entry_date)); // Sort newest first
    entries.forEach(entry => {
        const div = document.createElement("div");
        div.className = "entry-summary";
        div.dataset.entryId = entry.id;
        div.onclick = () => openEditEntryModal(entry.id);

        const date = new Date(entry.entry_date).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });
        div.innerHTML = `
            <p><strong>Datum:</strong> ${date}</p>
            <p><strong>Symbol:</strong> ${entry.symbol || "N/A"} (${entry.position_type || "N/A"})</p>
            <p><strong>Strategie:</strong> ${entry.strategy || "N/A"}</p>
            <p><strong>Ergebnis:</strong> <span class="result-${(entry.result || "").toLowerCase()}">${entry.result || "N/A"}</span> (${entry.pnl !== null ? entry.pnl : "N/A"})</p>
            <p><strong>R/R:</strong> ${entry.initial_rr !== null ? entry.initial_rr.toFixed(1) : "N/A"}</p>
            <p><strong>Bewertung:</strong> ${entry.trade_rating !== null ? entry.trade_rating.toFixed(1) + " Sterne" : "N/A"}</p>
        `;
        entriesListDiv.appendChild(div);
    });
}

function resetEntryForm() {
    currentEntryId = null;
    entryEditIdInput.value = "";
    entryJournalIdInput.value = currentJournalId || "";
    entryDateInput.value = new Date().toISOString().slice(0, 16); // Default to now
    entrySymbolInput.value = ""; // New
    entryPositionTypeSelect.value = ""; // New
    entryStrategyInput.value = "";
    entryInitialRrInput.value = ""; // New
    entryPnlInput.value = "";
    entryResultSelect.value = "";
    entrySlInput.value = "";
    entryTpInput.value = "";
    entryConfidenceSlider.value = 50;
    confidenceValueSpan.textContent = "50";
    entryRatingInput.value = 3.0;
    renderStars(3.0);
    entryNotesTextarea.value = "";
    entryChecklistDiv.innerHTML = "";
    entryImagesPreviewBeforeDiv.innerHTML = ""; // New
    entryImagesPreviewAfterDiv.innerHTML = ""; // New
    entryImagesPreviewGeneralDiv.innerHTML = ""; // New
    entryImageUploadInput.value = ""; // Reset file input
    uploadStatusSpan.textContent = "";
    entryModalTitle.textContent = "Neuer Eintrag";
    deleteEntryBtn.style.display = "none";

    // Show/hide SL/TP based on current journal setting
    slTpFieldsDiv.style.display = currentJournalHasSlTp ? "block" : "none";
}

function openNewEntryModal() {
    if (!currentJournalId) {
        alert("Bitte zuerst ein Journal auswählen.");
        return;
    }
    resetEntryForm();
    renderChecklistForEntry({}); // Render empty checklist based on templates
    openModal("entry-modal");
}

async function openEditEntryModal(entryId) {
    resetEntryForm();
    entryModalTitle.textContent = "Eintrag bearbeiten";
    try {
        const entry = await apiRequest(`/entries/${entryId}`);
        currentEntryId = entry.id;
        entryEditIdInput.value = entry.id;
        entryJournalIdInput.value = entry.journal_id;
        // Ensure date is in correct format for datetime-local
        const localDate = new Date(entry.entry_date);
        localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
        entryDateInput.value = localDate.toISOString().slice(0, 16);

        entrySymbolInput.value = entry.symbol || ""; // New
        entryPositionTypeSelect.value = entry.position_type || ""; // New
        entryStrategyInput.value = entry.strategy || "";
        entryInitialRrInput.value = entry.initial_rr !== null ? entry.initial_rr : ""; // New
        entryPnlInput.value = entry.pnl !== null ? entry.pnl : "";
        entryResultSelect.value = entry.result || "";
        entryConfidenceSlider.value = entry.confidence_level || 50;
        confidenceValueSpan.textContent = entry.confidence_level || 50;
        entryRatingInput.value = entry.trade_rating !== null ? entry.trade_rating : 3.0;
        renderStars(entry.trade_rating !== null ? entry.trade_rating : 3.0);
        entryNotesTextarea.value = entry.notes || "";

        if (currentJournalHasSlTp) {
            entrySlInput.value = entry.stop_loss !== null ? entry.stop_loss : "";
            entryTpInput.value = entry.take_profit !== null ? entry.take_profit : "";
            slTpFieldsDiv.style.display = "block";
        } else {
            slTpFieldsDiv.style.display = "none";
        }

        renderChecklistForEntry(entry.checklist_statuses || []);
        renderImagesForEntry(entry.images || []);

        deleteEntryBtn.style.display = "inline-block";
        openModal("entry-modal");

    } catch (error) {
        alert("Fehler beim Laden des Eintrags.");
    }
}

async function saveEntry() {
    const id = entryEditIdInput.value;
    const journalId = entryJournalIdInput.value;
    if (!journalId) {
        alert("Journal ID fehlt.");
        return;
    }

    // Collect checklist statuses
    const checklistStatuses = {};
    entryChecklistDiv.querySelectorAll("input[type=\"checkbox\"]").forEach(checkbox => {
        checklistStatuses[checkbox.dataset.templateId] = checkbox.checked;
    });

    const data = {
        symbol: entrySymbolInput.value.trim() || null, // New
        position_type: entryPositionTypeSelect.value || null, // New
        strategy: entryStrategyInput.value.trim() || null,
        initial_rr: entryInitialRrInput.value !== "" ? parseFloat(entryInitialRrInput.value) : null, // New
        pnl: entryPnlInput.value !== "" ? parseFloat(entryPnlInput.value) : null,
        result: entryResultSelect.value || null,
        confidence_level: parseInt(entryConfidenceSlider.value, 10),
        trade_rating: parseFloat(entryRatingInput.value),
        notes: entryNotesTextarea.value.trim(),
        checklist_statuses: checklistStatuses,
        // Use the date from the input field if it exists, otherwise let backend default
        entry_date: entryDateInput.value ? new Date(entryDateInput.value).toISOString() : null
    };

    if (currentJournalHasSlTp) {
        data.stop_loss = entrySlInput.value !== "" ? parseFloat(entrySlInput.value) : null;
        data.take_profit = entryTpInput.value !== "" ? parseFloat(entryTpInput.value) : null;
    }

    let url = `/journals/${journalId}/entries`;
    let method = "POST";

    if (id) { // Editing existing entry
        url = `/entries/${id}`;
        method = "PUT";
    }

    try {
        await apiRequest(url, method, data);
        closeModal("entry-modal");
        loadEntries(journalId); // Refresh list
    } catch (error) {
        alert(`Fehler beim Speichern des Eintrags: ${error.message}`);
    }
}

async function deleteEntry() {
    const id = entryEditIdInput.value;
    const journalId = entryJournalIdInput.value;
    if (!id || !journalId || !confirm("Möchten Sie diesen Eintrag wirklich löschen?")) {
        return;
    }

    try {
        await apiRequest(`/entries/${id}`, "DELETE");
        closeModal("entry-modal");
        loadEntries(journalId); // Refresh list
    } catch (error) {
        alert(`Fehler beim Löschen des Eintrags: ${error.message}`);
    }
}

// --- Entry Form Components ---

// Confidence Slider
entryConfidenceSlider.oninput = function() {
    confidenceValueSpan.textContent = this.value;
}

// Star Rating
function renderStars(rating) {
    starsDisplayDiv.innerHTML = ""; // Clear existing stars
    const ratingPrecise = parseFloat(rating) || 0;
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement("span");
        star.classList.add("star");
        star.dataset.value = i;
        // Determine fill level (full, half, empty)
        if (ratingPrecise >= i) {
            star.classList.add("filled");
            star.innerHTML = "&#9733;"; // Filled star
        } else if (ratingPrecise >= i - 0.7 && ratingPrecise < i - 0.2) { // Adjust thresholds for better visual feel
            // Use CSS for half-star appearance if desired, or just show filled
            star.classList.add("filled"); // Simplification: show filled for >= 0.5
            star.style.width = "50%"; // Crude half-star effect, better with CSS background
            star.style.overflow = "hidden";
            star.style.display = "inline-block";
            star.innerHTML = "&#9733;"; // Or use a half-star icon/character
        } else if (ratingPrecise >= i - 0.2) { // Treat close values as full
             star.classList.add("filled");
             star.innerHTML = "&#9733;";
        } else {
            star.innerHTML = "&#9734;"; // Empty star
        }
        star.onclick = () => handleStarClick(i);
        starsDisplayDiv.appendChild(star);
    }
    // Update hidden input for precise value
    entryRatingInput.value = ratingPrecise.toFixed(1);
}

function handleStarClick(value) {
    // Allow clicking near a star to set intermediate values (e.g., click between 3 and 4 sets 3.5)
    // This requires more complex event handling (offsetX) - simplified for now:
    // Clicking a star sets the rating to that star's value.
    entryRatingInput.value = value.toFixed(1);
    renderStars(value);
}

// Initialize stars on load
renderStars(parseFloat(entryRatingInput.value));
// Update stars when the hidden number input changes
entryRatingInput.onchange = () => renderStars(parseFloat(entryRatingInput.value));


// Checklist Rendering for Entry
function renderChecklistForEntry(statuses) {
    entryChecklistDiv.innerHTML = ""; // Clear
    const statusMap = {};
    if (Array.isArray(statuses)) {
        statuses.forEach(s => { statusMap[s.template_id] = s.checked; });
    } else if (typeof statuses === "object" && statuses !== null) {
        // Handle case where statuses might be an object {template_id: boolean}
        Object.assign(statusMap, statuses);
    }

    if (currentJournalChecklistTemplates.length === 0) {
        entryChecklistDiv.innerHTML = "<p>Keine Checklistenpunkte für dieses Journal definiert.</p>";
        return;
    }

    currentJournalChecklistTemplates.sort((a, b) => a.order - b.order).forEach(template => {
        const label = document.createElement("label");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.dataset.templateId = template.id;
        checkbox.checked = statusMap[template.id] || false;

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(` ${template.text}`));
        entryChecklistDiv.appendChild(label);
    });
}

// Image Upload and Display
async function handleImageUpload() {
    const file = entryImageUploadInput.files[0];
    const category = entryImageCategorySelect.value; // Get selected category

    if (!file) {
        alert("Bitte wählen Sie eine Bilddatei aus.");
        return;
    }
    if (!currentEntryId) {
        alert("Bitte speichern Sie den Eintrag zuerst, um Bilder hochzuladen.");
        return;
    }

    const formData = new FormData();
    formData.append("image", file);
    formData.append("category", category); // Send category with the image

    uploadStatusSpan.textContent = "Lade hoch...";

    try {
        // Use apiRequest helper with isFormData = true
        const newImage = await apiRequest(`/entries/${currentEntryId}/images`, "POST", formData, true);

        addImageToPreview(newImage);
        uploadStatusSpan.textContent = "Upload erfolgreich!";
        entryImageUploadInput.value = ""; // Reset file input
    } catch (error) {
        console.error("Image Upload Failed:", error);
        uploadStatusSpan.textContent = `Upload fehlgeschlagen: ${error.message}`;
    }
}

function renderImagesForEntry(images) {
    // Clear all preview sections
    entryImagesPreviewBeforeDiv.innerHTML = "";
    entryImagesPreviewAfterDiv.innerHTML = "";
    entryImagesPreviewGeneralDiv.innerHTML = "";

    images.forEach(image => addImageToPreview(image));
}

function addImageToPreview(image) {
    const container = document.createElement("div");
    container.className = "img-preview-container";
    container.dataset.imageId = image.id;

    const img = document.createElement("img");
    img.src = image.file_path; // Use the URL provided by the API
    img.alt = `Vorschau (${image.category})`;
    img.style.cursor = "pointer"; // Indicate clickable
    img.onclick = () => openLightbox(image.file_path, `Bild ${image.id} (${image.category})`); // Add lightbox trigger

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "img-delete-btn";
    deleteBtn.innerHTML = "&times;";
    deleteBtn.onclick = (e) => {
        e.stopPropagation(); // Prevent triggering lightbox
        deleteImage(image.id);
    };

    container.appendChild(img);
    container.appendChild(deleteBtn);

    // Append to the correct category section
    switch (image.category) {
        case "Before":
            entryImagesPreviewBeforeDiv.appendChild(container);
            break;
        case "After":
            entryImagesPreviewAfterDiv.appendChild(container);
            break;
        default:
            entryImagesPreviewGeneralDiv.appendChild(container);
            break;
    }
}

async function deleteImage(imageId) {
    if (!confirm("Möchten Sie dieses Bild wirklich löschen?")) {
        return;
    }

    try {
        await apiRequest(`/images/${imageId}`, "DELETE");
        // Remove preview from DOM
        const previewContainer = document.querySelector(`.img-preview-container[data-image-id="${imageId}"]`);
        if (previewContainer) {
            previewContainer.remove();
        }
    } catch (error) {
        alert(`Fehler beim Löschen des Bildes: ${error.message}`);
    }
}

// --- Lightbox Functionality ---
function openLightbox(src, caption) {
    lightboxImg.src = src;
    lightboxCaption.textContent = caption || "";
    openModal("lightbox-modal");
}

// --- Statistics ---
async function openStatsModal() {
    if (!currentJournalId) return;

    const journal = journalsData.find(j => j.id == currentJournalId);
    statsJournalNameSpan.textContent = journal ? journal.name : "";
    statsContentDiv.innerHTML = "<p>Statistiken werden geladen...</p>";
    openModal("stats-modal");

    try {
        const statsData = await apiRequest(`/journals/${currentJournalId}/statistics`);
        renderStatistics(statsData);
    } catch (error) {
        // Handle case where no entries exist (API returns 404)
        if (error.status === 404) {
             statsContentDiv.innerHTML = `<p>Keine Einträge für dieses Journal vorhanden, um Statistiken zu berechnen.</p>`;
        } else {
            statsContentDiv.innerHTML = `<p>Fehler beim Laden der Statistiken: ${error.message}</p>`;
        }
    }
}

function renderStatistics(stats) {
    if (!stats || stats.total_trades === 0) {
        statsContentDiv.innerHTML = "<p>Keine ausreichenden Daten für Statistiken vorhanden.</p>";
        return;
    }

    let html = `<div class="stats-grid">
                    <div class="stats-card">
                        <h4>Allgemein</h4>
                        <ul>
                            <li>Gesamte Trades: ${stats.total_trades}</li>
                            <li>Winrate: <span class="${stats.win_rate_percentage >= 50 ? "positive" : "negative"}">${stats.win_rate_percentage}%</span></li>
                            <li>Durchschnittliches P&L: <span class="${stats.average_pnl >= 0 ? "positive" : "negative"}">${stats.average_pnl}</span></li>
                            <li>Durchschnittl. Gewinn: <span class="positive">${stats.average_winning_pnl}</span></li>
                            <li>Durchschnittl. Verlust: <span class="negative">${stats.average_losing_pnl}</span></li>
                            <li>Durchschnittl. Initial R/R: ${stats.average_initial_rr !== null ? stats.average_initial_rr : "N/A"}</li>
                        </ul>
                    </div>
                    <div class="stats-card">
                        <h4>Ergebnisse</h4>
                        <ul>
                            <li>Gewinner: ${stats.results_count.Win || 0}</li>
                            <li>Verlierer: ${stats.results_count.Loss || 0}</li>
                            <li>Break Even: ${stats.results_count.BE || 0}</li>
                            <li>Partial Break Even: ${stats.results_count.PartialBE || 0}</li>
                        </ul>
                    </div>
                    <div class="stats-card">
                        <h4>Positionstypen</h4>
                        <ul>
                            <li>Long: ${stats.position_type_count.Long || 0}</li>
                            <li>Short: ${stats.position_type_count.Short || 0}</li>
                        </ul>
                    </div>
                </div>`; // Close stats-grid

    if (stats.symbol_performance && stats.symbol_performance.length > 0) {
        html += `<div class="stats-section">
                    <h4>Performance nach Symbol</h4>
                    <table>
                        <thead><tr><th>Symbol</th><th>Anzahl</th><th>Gewinner</th><th>Verlierer</th><th>Winrate</th></tr></thead>
                        <tbody>`;
        stats.symbol_performance.forEach(item => {
            html += `<tr>
                        <td>${item.symbol}</td>
                        <td>${item.count}</td>
                        <td>${item.wins}</td>
                        <td>${item.losses}</td>
                        <td><span class="${item.win_rate >= 50 ? "positive" : "negative"}">${item.win_rate.toFixed(1)}%</span></td>
                     </tr>`;
        });
        html += `   </tbody>
                    </table>
                 </div>`;
    }

    if (stats.checklist_usage && stats.checklist_usage.length > 0) {
        html += `<div class="stats-section">
                    <h4>Checklisten-Nutzung (% angehakt)</h4>
                    <ul>`;
        stats.checklist_usage.forEach(item => {
            // Add color based on percentage? Maybe > 75% is good?
            const percentageClass = item.checked_percentage >= 75 ? "positive" : (item.checked_percentage < 50 ? "negative" : "");
            html += `<li>${item.text}: <span class="${percentageClass}">${item.checked_percentage.toFixed(1)}%</span> (${item.checked_count}/${item.total_entries_with_item})</li>`;
        });
        html += `   </ul>
                 </div>`;
    }

    statsContentDiv.innerHTML = html;
}

// --- Event Listeners ---
journalSelect.addEventListener("change", handleJournalSelectChange);
addJournalBtn.addEventListener("click", openNewJournalModal);
document.getElementById("current-journal-name").addEventListener("dblclick", openEditJournalModal); // Allow editing name by double click
manageChecklistBtn.addEventListener("click", openManageChecklistModal);
viewStatsBtn.addEventListener("click", openStatsModal); // New
saveJournalBtn.addEventListener("click", saveJournal);
deleteJournalBtn.addEventListener("click", deleteJournal);

addChecklistItemBtn.addEventListener("click", addChecklistItem);

addEntryBtn.addEventListener("click", openNewEntryModal);
saveEntryBtn.addEventListener("click", saveEntry);
deleteEntryBtn.addEventListener("click", deleteEntry);
entryImageUploadInput.addEventListener("change", handleImageUpload);

// --- Initial Load ---
document.addEventListener("DOMContentLoaded", () => {
    loadJournals();
});

