// Global state
let currentJournalId = null;
let currentEntryId = null;
let journalsData = [];
let currentJournalChecklistTemplates = [];
let currentJournalHasSlTp = false;
let currentJournalHasCustomField = false;
let currentJournalCustomFieldName = '';
let currentJournalCustomFieldOptions = [];
let strategiesData = [];

// DOM Elements
const journalSelect = document.getElementById("journal-select");
const addJournalBtn = document.getElementById("add-journal-btn");
const manageChecklistBtn = document.getElementById("manage-checklist-btn");
const viewStatsBtn = document.getElementById("view-stats-btn");
const entriesSection = document.querySelector(".entries-section");
const currentJournalNameH2 = document.getElementById("current-journal-name");
const addEntryBtn = document.getElementById("add-entry-btn");
const entriesListDiv = document.getElementById("entries-list");

// Modals
const journalModal = document.getElementById("journal-modal");
const checklistModal = document.getElementById("checklist-modal");
const entryModal = document.getElementById("entry-modal");
const strategyModal = document.getElementById("strategy-modal");
const statsModal = document.getElementById("stats-modal");
const lightboxModal = document.getElementById("lightbox-modal");

// Journal Modal Elements
const journalModalTitle = document.getElementById("journal-modal-title");
const journalEditIdInput = document.getElementById("journal-edit-id");
const journalNameInput = document.getElementById("journal-name");
const journalDescriptionInput = document.getElementById("journal-description");
const journalHasSlTpCheckbox = document.getElementById("journal-has-sl-tp");
const journalHasCustomFieldCheckbox = document.getElementById("journal-has-custom-field");
const customFieldOptionsDiv = document.getElementById("custom-field-options");
const journalCustomFieldNameInput = document.getElementById("journal-custom-field-name");
const journalCustomFieldOptionsTextarea = document.getElementById("journal-custom-field-options");
const journalChecklistTemplatesTextarea = document.getElementById("journal-checklist-templates");
const saveJournalBtn = document.getElementById("save-journal-btn");
const deleteJournalBtn = document.getElementById("delete-journal-btn");

// Custom Field für Journal-Einstellungen
journalHasCustomFieldCheckbox.addEventListener("change", function() {
    customFieldOptionsDiv.style.display = this.checked ? "block" : "none";
});

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
const entrySymbolInput = document.getElementById("entry-symbol");
const entryPositionTypeSelect = document.getElementById("entry-position-type");
const entryStrategySelect = document.getElementById("entry-strategy-select");
const addNewStrategyBtn = document.getElementById("add-new-strategy-btn");
const entryInitialRrInput = document.getElementById("entry-initial-rr");
const entryPnlInput = document.getElementById("entry-pnl");
const entryResultSelect = document.getElementById("entry-result");
const slTpFieldsDiv = document.getElementById("sl-tp-fields");
const entrySlInput = document.getElementById("entry-sl");
const entryTpInput = document.getElementById("entry-tp");
const customFieldDiv = document.getElementById("custom-field");
const customFieldLabel = document.getElementById("custom-field-label");
const entryCustomFieldSelect = document.getElementById("entry-custom-field");
const entryConfidenceSlider = document.getElementById("entry-confidence");
const confidenceValueSpan = document.getElementById("confidence-value");
const entryRatingInput = document.getElementById("entry-rating");
const starsDisplayDiv = document.getElementById("stars-display");
const entryNotesTextarea = document.getElementById("entry-notes");
const entryChecklistDiv = document.getElementById("entry-checklist");
const entryImageCategorySelect = document.getElementById("entry-image-category");
const entryImagesPreviewBeforeDiv = document.getElementById("entry-images-preview-before");
const entryImagesPreviewAfterDiv = document.getElementById("entry-images-preview-after");
const entryImageUploadInput = document.getElementById("entry-image-upload");
const uploadStatusSpan = document.getElementById("upload-status");
const saveEntryBtn = document.getElementById("save-entry-btn");
const deleteEntryBtn = document.getElementById("delete-entry-btn");

// Strategy Modal Elements
const newStrategyNameInput = document.getElementById("new-strategy-name");
const saveStrategyBtn = document.getElementById("save-strategy-btn");

// Stats Modal Elements
const statsJournalNameSpan = document.getElementById("stats-journal-name");
const statsContentDiv = document.getElementById("stats-content");

// Lightbox Modal Elements
const lightboxImg = document.getElementById("lightbox-img");
const lightboxCaption = document.getElementById("lightbox-caption");

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
        if (modalId === "strategy-modal") resetStrategyForm();
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
        closeModal(this.closest(".modal").id);
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
        currentJournalHasCustomField = selectedJournal.has_custom_field || false;
        currentJournalCustomFieldName = selectedJournal.custom_field_name || '';
        currentJournalCustomFieldOptions = selectedJournal.custom_field_options || [];

        entriesSection.style.display = "block";
        manageChecklistBtn.style.display = "inline-block";
        viewStatsBtn.style.display = "inline-block";
        loadEntries(currentJournalId);
        loadChecklistTemplates(currentJournalId);
        loadStrategies(); // Strategien für Dropdown laden
    } else {
        entriesSection.style.display = "none";
        manageChecklistBtn.style.display = "none";
        viewStatsBtn.style.display = "none";
        currentJournalNameH2.textContent = "Einträge";
        entriesListDiv.innerHTML = "";
        currentJournalChecklistTemplates = [];
        currentJournalHasSlTp = false;
        currentJournalHasCustomField = false;
        currentJournalCustomFieldName = '';
        currentJournalCustomFieldOptions = [];
    }
}

function resetJournalForm() {
    journalEditIdInput.value = "";
    journalNameInput.value = "";
    journalDescriptionInput.value = "";
    journalHasSlTpCheckbox.checked = false;
    journalHasCustomFieldCheckbox.checked = false;
    journalCustomFieldNameInput.value = "";
    journalCustomFieldOptionsTextarea.value = "";
    customFieldOptionsDiv.style.display =