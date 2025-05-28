// --- Constants & Configuration ---
const CUSTOM_FONT_NAME = 'FranklinGothicDemi'; // Verify this matches jsPDFAPI.addFont(...)
const FALLBACK_FONT_NAME = 'Helvetica';
const MAX_TOTAL_STICKERS = 21;
const LABELS_PER_PAGE = 21; // 3 cols * 7 rows

// PDF Dimensions and Layout (mm)
const PAGE_WIDTH_MM = 145;
const PAGE_HEIGHT_MM = 225;
const LABEL_WIDTH_MM = 45.997;
const LABEL_HEIGHT_MM = 29.438;
const INNER_BOX_WIDTH_MM = 13.121;
const INNER_BOX_HEIGHT_MM = 11.1488;
const COLS = 3;
const ROWS = 7;
const GRID_WIDTH_MM = COLS * LABEL_WIDTH_MM;
const GRID_HEIGHT_MM = ROWS * LABEL_HEIGHT_MM;
const MARGIN_X_MM = (PAGE_WIDTH_MM - GRID_WIDTH_MM) / 2;
const MARGIN_Y_MM = (PAGE_HEIGHT_MM - GRID_HEIGHT_MM) / 2;

// Text Positioning & Styling
const TEXT_PADDING_MM = 2.5;
const PRODUCT_NAME_Y_OFFSET_MM = 7.0;
const BATCH_NO_Y_OFFSET_MM = 14.5;
const QTY_LINE_Y_OFFSET_MM = 20.0;
const MFG_DATE_Y_OFFSET_MM = 26.5;
const INNER_BOX_Y_OFFSET_MM = 9.5;
const INNER_BOX_RIGHT_MARGIN_MM = 2.5;
const FONT_SIZE_PRODUCT_NAME = 27;
const FONT_SIZE_WEIGHT_VOL = 14;
const FONT_SIZE_BATCH_LABEL = 14.83;
const FONT_SIZE_BATCH_VALUE = 14.83;
const FONT_SIZE_QTY_LABEL = 18.88;
const FONT_SIZE_QTY_VALUE = 18.88;
const FONT_SIZE_QTY_UNIT = 11.57;
const FONT_SIZE_MFG_LABEL = 18.88;
const FONT_SIZE_MFG_VALUE = 18.88;
const QTY_VALUE_NOS_GAP_MM = 0.5;

// --- DOM Elements ---
const labelForm = document.getElementById('labelForm');
const productNameInput = document.getElementById('productName');
const batchNumberInput = document.getElementById('batchNumber');
const quantityInBoxInput = document.getElementById('quantityInBox');
const mfgDateInput = document.getElementById('mfgDate');
const numberOfStickersInput = document.getElementById('numberOfStickers');
const addToArrayButton = document.getElementById('addToQueueButton'); // Button id remains for HTML, but variable is now addToArrayButton
const generateAllButton = document.getElementById('generateAllButton');
const labelArrayList = document.getElementById('labelQueueList');
const emptyArrayMessage = document.querySelector('.empty-queue-message');
const arrayStatusSpan = document.getElementById('queueStatus');
const currentYearSpan = document.getElementById('currentYear');

// Modal DOM Elements
const modal = document.getElementById('notificationModal');
const modalContentContainer = document.getElementById('modalContentContainer');
const modalTitle = document.getElementById('modalTitle');
const modalMessage = document.getElementById('modalMessage');
const modalCloseButton = document.getElementById('modalCloseButton');

// --- State ---
let labelArray = []; // Array of {id, productName, batchNumber, ..., numberOfStickers}

// --- SVG Icons for Buttons (as strings) ---
const LOADER_ICON_SVG = `<svg class="animate-spin mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;
const ADD_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>`;
const GENERATE_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`;

// --- Helper Functions ---
function showCustomModal(title, messageContent, isError = false, hideOkButton = false) {
    // Always reset OK button visibility at the start
    modalCloseButton.style.display = '';
    modalTitle.textContent = title;
    if (typeof messageContent === 'string') {
        modalMessage.innerHTML = messageContent;
    } else {
        modalMessage.innerHTML = '';
        if (Array.isArray(messageContent)) {
            const ul = document.createElement('ul');
            ul.className = 'list-disc pl-5 mt-2 space-y-1';
            messageContent.forEach(msg => {
                const li = document.createElement('li');
                li.textContent = msg;
                ul.appendChild(li);
            });
            modalMessage.appendChild(ul);
        } else {
            modalMessage.appendChild(messageContent);
        }
    }
    // Only hide OK button if hideOkButton is true (for clear all/cancel modals)
    if (hideOkButton) {
        modalCloseButton.style.display = 'none';
    } else {
        modalCloseButton.style.display = '';
    }
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.add('opacity-100');
        modalContentContainer.classList.remove('scale-95', 'opacity-0');
        modalContentContainer.classList.add('scale-100', 'opacity-100');
    }, 10);
}

function hideCustomModal() {
    modalContentContainer.classList.remove('scale-100', 'opacity-100');
    modalContentContainer.classList.add('scale-95', 'opacity-0');
    modal.classList.remove('opacity-100');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

function calculateTotalStickersInArray() {
    return labelArray.reduce((sum, item) => sum + Number(item.numberOfStickers || 0), 0);
}

function updateArrayDisplayAndButtonStates() {
    labelArrayList.innerHTML = ''; // Clear existing items
    const totalStickers = calculateTotalStickersInArray();

    if (labelArray.length === 0) {
        // Always show the empty array message
        const emptyMsg = document.createElement('p');
        emptyMsg.className = 'empty-queue-message text-muted-foreground text-center py-10';
        emptyMsg.textContent = 'Array is empty. Add labels using the form.';
        labelArrayList.appendChild(emptyMsg);
        generateAllButton.disabled = true;
    } else {
        if (emptyArrayMessage) emptyArrayMessage.style.display = 'none';
        generateAllButton.disabled = false;
        labelArray.forEach(item => {
            const div = document.createElement('div');
            div.className = `
                bg-white border border-gray-200 shadow-lg rounded-xl mb-6 px-6 py-5
                flex flex-col gap-2
                transition-all
                hover:shadow-xl
            `.replace(/\s+/g, ' ');
            div.innerHTML = `
                <div class="mb-3">
                    <span class="text-lg font-bold text-primary tracking-wide">${item.productName}</span>
                </div>
                <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-2 text-sm">
                    <div class="flex flex-col">
                        <span class="text-gray-500 font-medium">Batch</span>
                        <span class="text-foreground font-semibold">${item.batchNumber}</span>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-gray-500 font-medium">Qty in Box</span>
                        <span class="text-foreground font-semibold">${item.quantityInBox}</span>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-gray-500 font-medium">Weight/Vol</span>
                        <span class="text-foreground font-semibold">${item.weightVolume}</span>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-gray-500 font-medium">MFG Date</span>
                        <span class="text-foreground font-semibold">${item.mfgDate}</span>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-gray-500 font-medium">Copies</span>
                        <span class="text-foreground font-semibold">${item.numberOfStickers}</span>
                    </div>
                </div>
                <div class="flex justify-end mt-4">
                    <button type="button" class="remove-item-btn text-red-600 hover:bg-red-100 hover:text-red-800 h-8 w-8 rounded-full flex items-center justify-center transition" data-id="${item.id}" aria-label="Remove label">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                </div>
            `;
            labelArrayList.appendChild(div);
        });
    }
    if (arrayStatusSpan) arrayStatusSpan.textContent = `${totalStickers} / ${MAX_TOTAL_STICKERS}`;

    // Update "Add to Array" button state
    const stickersToAdd = parseInt(numberOfStickersInput.value, 10) || 0;
    if (totalStickers >= MAX_TOTAL_STICKERS) {
        addToArrayButton.disabled = true;
        addToArrayButton.querySelector('span').textContent = 'Sticker Array Full';
    } else if (totalStickers + stickersToAdd > MAX_TOTAL_STICKERS && stickersToAdd > 0) {
        addToArrayButton.disabled = true;
        addToArrayButton.querySelector('span').textContent = 'Exceeds Limit';
    } else {
        addToArrayButton.disabled = false;
        addToArrayButton.querySelector('span').textContent = 'Add to PDF Array';
    }
}

function handleAddToArray() {
    const productName = productNameInput.value.trim().toUpperCase();
    const batchNumber = batchNumberInput.value.trim().toUpperCase();
    let quantityInBox = quantityInBoxInput.value.trim();
    // Remove any extra spaces and ensure " NOS" suffix
    quantityInBox = quantityInBox.replace(/\s+NOS$/, '') + ' NOS';
    const weightVolume = getWeightVolume();
    const mfgDate = mfgDateInput.value.trim().toUpperCase();
    const numberOfStickers = parseInt(numberOfStickersInput.value, 10);

    const errors = [];
    if (!productName) errors.push("Product name is required.");
    if (productName.length > 17) errors.push("Product name must be at most 17 characters.");
    if (!batchNumber) errors.push("Batch number is required.");
    if (batchNumber.length > 5) errors.push("Batch number must be at most 5 characters.");
    if (!quantityInBox.match(/^\d{1,4} NOS$/)) errors.push("Quantity in box is required");
    if (!weightVolumeValueInput.value || !weightVolumeUnitInput.value) errors.push("Weight/Volume is required.");
    if (!mfgDate.match(/^\d{2}\/[A-Z]{3}\/\d{4}$/)) errors.push("Manufacture date is required");
    if (isNaN(numberOfStickers) || numberOfStickers <= 0) {
        errors.push("Number of stickers is required");
    }

    if (errors.length > 0) {
        showCustomModal('Input Error', errors, true);
        return;
    }

    const totalStickersInArray = calculateTotalStickersInArray();
    if (totalStickersInArray + numberOfStickers > MAX_TOTAL_STICKERS) {
        showCustomModal('Array Limit Reached', `Adding ${numberOfStickers} sticker(s) would exceed the array limit of ${MAX_TOTAL_STICKERS} total stickers. Currently ${totalStickersInArray} stickers in array.`, true);
        return;
    }

    const newItem = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
        productName, batchNumber, quantityInBox, weightVolume, mfgDate, numberOfStickers
    };
    labelArray.push(newItem);
    updateArrayDisplayAndButtonStates();
    // Do NOT clear the form here
    // numberOfStickersInput.value = ''; // Optionally clear just this if you want
    productNameInput.focus();
    showCustomModal('Success', `${productName} added to array with ${numberOfStickers} ${pluralize('sticker', numberOfStickers)}.`);
}

function handleRemoveFromArray(itemId) {
    const itemIndex = labelArray.findIndex(item => item.id === itemId);
    if (itemIndex > -1) {
        const removedItem = labelArray.splice(itemIndex, 1)[0];
        updateArrayDisplayAndButtonStates();
        showCustomModal('Removed', `"${removedItem.productName}" removed from array.`);
    }
}

async function generateCombinedPDF() {
    if (labelArray.length === 0) {
        showCustomModal('Empty Array', 'Add labels to the array before generating PDF.', true);
        return;
    }

    generateAllButton.disabled = true;
    generateAllButton.innerHTML = `${LOADER_ICON_SVG} <span>Generating PDF...</span>`;

    // --- PDF Layout Constants ---
    const PAGE_WIDTH_MM = 145;
    const PAGE_HEIGHT_MM = 220;
    const LABEL_WIDTH_MM = 45.997;
    const LABEL_HEIGHT_MM = 29.438;
    const COLS = 3;
    const ROWS = 7;
    const LABELS_PER_PAGE = COLS * ROWS;
    const STICKER_GAP_X_MM = 1.2;
    const STICKER_GAP_Y_MM = 1.5;
    const GRID_WIDTH_MM = COLS * LABEL_WIDTH_MM + (COLS - 1) * STICKER_GAP_X_MM;
    const GRID_HEIGHT_MM = ROWS * LABEL_HEIGHT_MM + (ROWS - 1) * STICKER_GAP_Y_MM;
    const MARGIN_X_MM = (PAGE_WIDTH_MM - GRID_WIDTH_MM) / 2;
    const MARGIN_Y_MM = (PAGE_HEIGHT_MM - GRID_HEIGHT_MM) / 2;
    const INNER_BOX_WIDTH_MM = 13.121;
    const INNER_BOX_HEIGHT_MM = 11.1488;
    const INNER_BOX_OFFSET_X = 30.689;
    const INNER_BOX_OFFSET_Y = 8.949;

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: [PAGE_WIDTH_MM, PAGE_HEIGHT_MM]
        });

        let stickerIndex = 0;
        let page = 0;
        let totalStickers = calculateTotalStickersInArray();
        let stickers = [];
        // Flatten labelArray into a stickers array
        labelArray.forEach(item => {
            for (let i = 0; i < Number(item.numberOfStickers); i++) {
                stickers.push(item);
            }
        });

        for (let i = 0; i < stickers.length; i++) {
            if (i > 0 && i % LABELS_PER_PAGE === 0) {
                doc.addPage([PAGE_WIDTH_MM, PAGE_HEIGHT_MM], 'portrait');
                page++;
            }
            const labelNum = i % LABELS_PER_PAGE;
            const row = Math.floor(labelNum / COLS);
            const col = labelNum % COLS;
            const x = MARGIN_X_MM + col * (LABEL_WIDTH_MM + STICKER_GAP_X_MM);
            const y = MARGIN_Y_MM + row * (LABEL_HEIGHT_MM + STICKER_GAP_Y_MM);

            // Draw label box (black fill, black border)
            doc.setDrawColor(0, 0, 0); // Black border
            doc.setLineWidth(0.2);
            doc.setFillColor(0, 0, 0); // Black fill
            doc.rect(x, y, LABEL_WIDTH_MM, LABEL_HEIGHT_MM, 'S'); // 'S' for stroke only, change to 'FD' for fill+stroke if needed

            // Draw inner box (black fill, black border)
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.2);
            doc.setFillColor(0, 0, 0);
            doc.rect(x + INNER_BOX_OFFSET_X, y + INNER_BOX_OFFSET_Y, INNER_BOX_WIDTH_MM, INNER_BOX_HEIGHT_MM, 'S');

            // Set text color to black
            doc.setTextColor(0, 0, 0);

            // Add label text (all uppercase)
            doc.setFontSize(10);
            doc.text((stickers[i].productName || '').toUpperCase(), x + 2, y + 7, { maxWidth: LABEL_WIDTH_MM - 4 });
            doc.setFontSize(8);
            doc.text((`BATCH: ${stickers[i].batchNumber || ''}`).toUpperCase(), x + 2, y + 13);
            doc.text((`QTY: ${stickers[i].quantityInBox || ''}`).toUpperCase(), x + 2, y + 18);
            doc.text((`WT/VOL: ${stickers[i].weightVolume || ''}`).toUpperCase(), x + 2, y + 23);
            doc.text((`MFG: ${stickers[i].mfgDate || ''}`).toUpperCase(), x + 2, y + 28);
        }

        doc.save('herbal_product_labels.pdf');
        showCustomModal('Success', 'PDF generated with all labels.');
    } catch (error) {
        console.error("Error generating PDF:", error);
        showCustomModal('PDF Generation Error', `An error occurred: ${error.message}. Check console.`, true);
    } finally {
        generateAllButton.disabled = labelArray.length === 0;
        generateAllButton.innerHTML = `${GENERATE_ICON_SVG} <span>Generate All Labels PDF</span>`;
    }
}

// --- Confirmation for Generate All Labels PDF ---
function confirmGeneratePDF() {
    const total = calculateTotalStickersInArray();
    showCustomModal(
        'Generate PDF',
        `<div>Are you sure you want to generate the PDF for all <strong>${total}</strong> ${pluralize('sticker', total)}?</div>
         <div class="flex gap-3 mt-4">
            <button id="confirmGeneratePDFBtn" class="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90">Yes, Generate</button>
            <button id="cancelGeneratePDFBtn" class="bg-muted text-foreground px-4 py-2 rounded hover:bg-muted/80">Cancel</button>
         </div>`,
        false,
        true // hide OK button
    );
    setTimeout(() => {
        const confirmBtn = document.getElementById('confirmGeneratePDFBtn');
        const cancelBtn = document.getElementById('cancelGeneratePDFBtn');
        if (confirmBtn) confirmBtn.onclick = () => {
            hideCustomModal();
            setTimeout(() => generateCombinedPDF(), 200); // slight delay for modal animation
        };
        if (cancelBtn) cancelBtn.onclick = () => hideCustomModal();
    }, 50);
}

// --- Event Listeners ---
if (addToArrayButton) addToArrayButton.addEventListener('click', handleAddToArray);
if (generateAllButton) generateAllButton.addEventListener('click', confirmGeneratePDF);
if (modalCloseButton) modalCloseButton.addEventListener('click', hideCustomModal);

if (modal) {
    modal.addEventListener('click', (event) => {
        if (event.target === modal) hideCustomModal();
    });
}

if (labelArrayList) {
    labelArrayList.addEventListener('click', (event) => {
        const removeButton = event.target.closest('.remove-item-btn');
        if (removeButton) {
            handleRemoveFromArray(removeButton.dataset.id);
        }
    });
}

if (numberOfStickersInput) {
    numberOfStickersInput.addEventListener('input', updateArrayDisplayAndButtonStates);
}

const clearFormButton = document.getElementById('clearFormButton');
if (clearFormButton) {
    clearFormButton.addEventListener('click', function () {
        // Check if any input has value (ignore selects with default value)
        const inputs = labelForm.querySelectorAll('input');
        let hasValue = false;
        for (const input of inputs) {
            if (
                (input.type === 'checkbox' || input.type === 'radio')
                    ? input.checked
                    : (typeof input.value === 'string' && input.value.trim().length > 0)
            ) {
                hasValue = true;
                break;
            }
        }
        // Check selects (dropdowns) only if user changed from the default option
        const selects = labelForm.querySelectorAll('select');
        for (const select of selects) {
            // If the select has a data-default attribute, compare to that, else use first option
            const defaultValue = select.dataset.default !== undefined
                ? select.dataset.default
                : (select.options[0] ? select.options[0].value : '');
            if (select.value !== defaultValue) {
                hasValue = true;
                break;
            }
        }
        if (!hasValue) {
            setTimeout(() => showToast('There is nothing to clear in the form.'), 0);
            return;
        }
        showCustomModal(
            'Clear All Fields',
            `<div>Are you sure you want to clear all fields in <strong>Enter Label Details</strong>?</div>
             <div class="flex gap-3 mt-4">
                <button id="confirmClearFormBtn" class="bg-destructive text-white px-4 py-2 rounded hover:bg-destructive/90">Yes, Clear</button>
                <button id="cancelClearFormBtn" class="bg-muted text-foreground px-4 py-2 rounded hover:bg-muted/80">Cancel</button>
             </div>`,
            false,
            true // hide OK button
        );
        setTimeout(() => {
            const confirmBtn = document.getElementById('confirmClearFormBtn');
            const cancelBtn = document.getElementById('cancelClearFormBtn');
            if (confirmBtn) {
                confirmBtn.onclick = () => {
                    labelForm.reset();
                    hideCustomModal();
                };
            }
            if (cancelBtn) {
                cancelBtn.onclick = () => hideCustomModal();
            }
        }, 50);
    });
}

// --- Toast Notification ---
function showToast(message) {
    // Remove any existing toast
    let existing = document.getElementById('customToast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'customToast';
    toast.textContent = message;
    toast.style.position = 'fixed';
    toast.style.bottom = '32px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.background = '#323232';
    toast.style.color = '#fff';
    toast.style.padding = '12px 24px';
    toast.style.borderRadius = '8px';
    toast.style.fontSize = '1rem';
    toast.style.zIndex = '9999';
    toast.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '1';
    }, 10);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 2000);
}

// --- Custom Input Restrictions & Formatting ---

// Product Name: Limit to 17 characters (handled by maxlength in HTML)
// Batch Number: Limit to 5 characters (handled by maxlength in HTML)

// Quantity in Box: Only 4 digits, always ends with " NOS" (append on blur, not during typing)
if (quantityInBoxInput) {
    quantityInBoxInput.addEventListener('input', function (e) {
        // Remove all non-digits and limit to 4
        let val = this.value.replace(/\D/g, '').slice(0, 4);
        this.value = val;
    });
    quantityInBoxInput.addEventListener('blur', function () {
        let val = this.value.replace(/\D/g, '').slice(0, 4);
        if (val) {
            this.value = val + ' NOS';
        } else {
            this.value = '';
        }
    });
    quantityInBoxInput.addEventListener('focus', function () {
        // Remove NOS suffix for editing
        let val = this.value.replace(/\D/g, '').slice(0, 4);
        this.value = val;
    });
}

// Weight/Volume: Only 3 digits + dropdown for unit
const weightVolumeValueInput = document.getElementById('weightVolumeValue');
const weightVolumeUnitInput = document.getElementById('weightVolumeUnit');

function getWeightVolume() {
    if (!weightVolumeValueInput || !weightVolumeUnitInput) return '';
    if (!weightVolumeValueInput.value) return '';
    return weightVolumeValueInput.value + ' ' + weightVolumeUnitInput.value;
}

// Manufacture Date: Format on blur only
const MONTHS = [
    '', 'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
];
if (mfgDateInput) {
    mfgDateInput.addEventListener('blur', function () {
        let val = this.value.trim();
        // Accept formats like 1/5/2025, 01/05/2025, 1-5-2025, 01-05-2025, etc.
        let match = val.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
        if (match) {
            let day = match[1].padStart(2, '0');
            let monthNum = parseInt(match[2], 10);
            let year = match[3];
            let monthStr = (monthNum >= 1 && monthNum <= 12) ? MONTHS[monthNum] : '';
            if (monthStr) {
                this.value = `${day}/${monthStr}/${year}`;
            }
        }
    });
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }
    if (labelForm) labelForm.reset(); // Ensure form is clear on load
    if (numberOfStickersInput) numberOfStickersInput.value = ''; // Specifically clear number input
    updateArrayDisplayAndButtonStates(); // Initial state
    if (productNameInput) productNameInput.focus();
});

// Utility for pluralization
function pluralize(word, count) {
    return count === 1 ? word : word + 's';
}

