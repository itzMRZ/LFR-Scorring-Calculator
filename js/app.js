/* ========================================================================
 * LFR SCORE CALCULATOR - ADVANCED CONFIGURATION SYSTEM
 * ========================================================================
 *
 * FEATURES:
 * - Preset Management: Built-in and custom user presets
 * - Import/Export: JSON-based configuration sharing
 * - Validation: Real-time input validation with error display
 * - Persistence: LocalStorage for settings and presets
 * - Toast Notifications: User-friendly feedback system
 *
 * ARCHITECTURE:
 * - Separation of Concerns: Distinct modules for scoring, UI, and data
 * - State Management: Centralized scoring rules and preset storage
 * - Event-Driven: Modular event handlers for all interactions
 *
 * INDUSTRY PRACTICES:
 * - JSON Schema for configuration
 * - Validation before persistence
 * - Import/Export with metadata
 * - User preset isolation from built-in presets
 * - Clipboard API integration
 * - Error handling and user feedback
 *
 * ====================================================================== */

// ===== SCORING RULES (DEFAULT VALUES) =====
const DEFAULT_RULES = {
    startPoint: 20,
    endPoint: 20,
    checkpoint: 150,
    restart: -70,
    bonus: 150,
    timeMultiplier: 1,
    totalTime: 5
};

// Built-in Competition Presets
const BUILT_IN_PRESETS = {
    'Default': { ...DEFAULT_RULES },
    'RoboCup Junior': {
        startPoint: 0,
        endPoint: 50,
        checkpoint: 100,
        restart: -50,
        bonus: 200,
        timeMultiplier: 2,
        totalTime: 8
    },
    'WRO Regular': {
        startPoint: 10,
        endPoint: 30,
        checkpoint: 120,
        restart: -60,
        bonus: 100,
        timeMultiplier: 1.5,
        totalTime: 5
    },
    'FIRST LEGO League': {
        startPoint: 15,
        endPoint: 25,
        checkpoint: 80,
        restart: -40,
        bonus: 150,
        timeMultiplier: 1,
        totalTime: 3
    }
};

let scoringRules = { ...DEFAULT_RULES };
let userPresets = {};

// ===== UTILITY FUNCTIONS =====

// Toast notification system
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = type === 'success'
        ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

    toast.innerHTML = `
        <div class="toast-content">
            <div class="toast-icon">${icon}</div>
            <div class="toast-message">${message}</div>
        </div>
    `;

    container.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 100);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (container.contains(toast)) {
                container.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// Validation
function validateRules(rules) {
    const errors = {};

    if (rules.timeMultiplier < 0) {
        errors.timeMultiplier = 'Time multiplier cannot be negative';
    }

    if (rules.totalTime !== undefined && rules.totalTime < 0) {
        errors.totalTime = 'Total time cannot be negative';
    }

    // Check for unreasonable values
    const maxValue = 10000;
    const minValue = -10000;

    Object.keys(rules).forEach(key => {
        if (key !== 'timeMultiplier' && key !== 'totalTime' && (rules[key] > maxValue || rules[key] < minValue)) {
            errors[key] = `Value must be between ${minValue} and ${maxValue}`;
        }
    });

    return errors;
}

function displayValidationErrors(errors) {
    // Clear all errors first
    document.querySelectorAll('.validation-error').forEach(el => {
        el.classList.remove('active');
        el.textContent = '';
    });
    document.querySelectorAll('.settings-group input').forEach(el => {
        el.classList.remove('error');
    });

    // Display new errors
    Object.keys(errors).forEach(key => {
        const errorEl = document.getElementById(`error-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`);
        const inputEl = document.getElementById(`rule-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`);
        if (errorEl && inputEl) {
            errorEl.textContent = errors[key];
            errorEl.classList.add('active');
            inputEl.classList.add('error');
        }
    });
}

// Load saved settings from localStorage
function loadSettings() {
    const saved = localStorage.getItem('lfrScoringRules');
    const savedPresets = localStorage.getItem('lfrUserPresets');

    if (saved) {
        try {
            scoringRules = JSON.parse(saved);
            updateSettingsInputs();
            // Pre-fill main interface total time input with settings value
            document.getElementById('total-time').value = scoringRules.totalTime || 5;
        } catch (e) {
            console.error('Error loading settings:', e);
            scoringRules = { ...DEFAULT_RULES };
        }
    } else {
        // On first load, set the default value
        document.getElementById('total-time').value = scoringRules.totalTime || 5;
    }

    if (savedPresets) {
        try {
            userPresets = JSON.parse(savedPresets);
            updatePresetDropdown();
        } catch (e) {
            console.error('Error loading presets:', e);
            userPresets = {};
        }
    }
}

// Save settings to localStorage
function saveSettings() {
    localStorage.setItem('lfrScoringRules', JSON.stringify(scoringRules));
}

// Save user presets
function saveUserPresets() {
    localStorage.setItem('lfrUserPresets', JSON.stringify(userPresets));
}

// Update preset dropdown
function updatePresetDropdown() {
    const select = document.getElementById('preset-select');
    select.innerHTML = '<option value="">Select a preset...</option>';

    // Add built-in presets
    const builtInGroup = document.createElement('optgroup');
    builtInGroup.label = 'Built-in Presets';
    for (const [name, rules] of Object.entries(BUILT_IN_PRESETS)) {
        const option = document.createElement('option');
        option.value = `builtin:${name}`;
        option.textContent = name;
        builtInGroup.appendChild(option);
    }
    select.appendChild(builtInGroup);

    // Add user presets
    if (Object.keys(userPresets).length > 0) {
        const userGroup = document.createElement('optgroup');
        userGroup.label = 'My Presets';
        for (const [name, rules] of Object.entries(userPresets)) {
            const option = document.createElement('option');
            option.value = `user:${name}`;
            option.textContent = name;
            userGroup.appendChild(option);
        }
        select.appendChild(userGroup);
    }
}

// Load preset
function loadPreset(presetKey) {
    const [type, name] = presetKey.split(':');
    let rules;

    if (type === 'builtin') {
        rules = BUILT_IN_PRESETS[name];
    } else if (type === 'user') {
        rules = userPresets[name];
    }

    if (rules) {
        scoringRules = { ...rules };
        updateSettingsInputs();
        displayValidationErrors({});
        // Update main interface total time input when preset is loaded
        document.getElementById('total-time').value = scoringRules.totalTime || 5;
        showToast(`Loaded preset: ${name}`, 'success');
    }
}

// Export configuration
function exportConfiguration() {
    const config = {
        name: 'Custom LFR Scoring Configuration',
        version: '1.0',
        timestamp: new Date().toISOString(),
        rules: scoringRules
    };

    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `lfr-scoring-config-${Date.now()}.json`;
    link.click();

    URL.revokeObjectURL(url);
    showToast('Configuration exported successfully', 'success');
}

// Import configuration
function importConfiguration(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const config = JSON.parse(e.target.result);

            if (!config.rules) {
                throw new Error('Invalid configuration file');
            }

            // Validate imported rules
            const errors = validateRules(config.rules);
            if (Object.keys(errors).length > 0) {
                showToast('Invalid configuration values', 'error');
                return;
            }

            scoringRules = { ...config.rules };
            updateSettingsInputs();
            saveSettings();
            updateCheckboxLabels();
            updateCustomRulesBadge();
            showToast('Configuration imported successfully', 'success');

        } catch (error) {
            showToast('Failed to import configuration', 'error');
            console.error('Import error:', error);
        }
    };
    reader.readAsText(file);
}

// Copy configuration to clipboard
function copyConfigToClipboard() {
    const config = {
        name: 'Custom LFR Scoring Configuration',
        version: '1.0',
        rules: scoringRules
    };

    const jsonStr = JSON.stringify(config, null, 2);

    navigator.clipboard.writeText(jsonStr).then(() => {
        showToast('Configuration copied to clipboard', 'success');
    }).catch(() => {
        showToast('Failed to copy to clipboard', 'error');
    });
}

// Update settings modal inputs with current values
function updateSettingsInputs() {
    document.getElementById('rule-start-point').value = scoringRules.startPoint;
    document.getElementById('rule-end-point').value = scoringRules.endPoint;
    document.getElementById('rule-checkpoint').value = scoringRules.checkpoint;
    document.getElementById('rule-restart').value = scoringRules.restart;
    document.getElementById('rule-bonus').value = scoringRules.bonus;
    document.getElementById('rule-time-multiplier').value = scoringRules.timeMultiplier;
}

// Update checkbox labels with current point values
function updateCheckboxLabels() {
    document.querySelector('label[for="start-point"]').textContent =
        `Leaving Start Point (S) — ${scoringRules.startPoint >= 0 ? '+' : ''}${scoringRules.startPoint} points`;
    document.querySelector('label[for="end-point"]').textContent =
        `Stopping at End Point (E) — ${scoringRules.endPoint >= 0 ? '+' : ''}${scoringRules.endPoint} points`;
}

// Check if using custom rules and update badge
function updateCustomRulesBadge() {
    const isCustom = JSON.stringify(scoringRules) !== JSON.stringify(DEFAULT_RULES);
    const badge = document.getElementById('custom-rules-badge');
    if (isCustom) {
        badge.classList.add('active');
    } else {
        badge.classList.remove('active');
    }
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    // ===== SETTINGS MODAL FUNCTIONALITY =====
    const settingsModal = document.getElementById('settings-modal');
    const settingsIcon = document.getElementById('settings-icon');
    const closeModalBtn = document.getElementById('close-modal');
    const saveSettingsBtn = document.getElementById('save-settings');
    const resetDefaultsBtn = document.getElementById('reset-defaults');

    // Preset management elements
    const presetSelect = document.getElementById('preset-select');
    const savePresetBtn = document.getElementById('save-preset-btn');
    const deletePresetBtn = document.getElementById('delete-preset-btn');
    const savePresetModal = document.getElementById('save-preset-modal');
    const presetNameInput = document.getElementById('preset-name-input');
    const confirmSavePreset = document.getElementById('confirm-save-preset');
    const cancelSavePreset = document.getElementById('cancel-save-preset');

    // Import/Export elements
    const exportConfigBtn = document.getElementById('export-config-btn');
    const importConfigBtn = document.getElementById('import-config-btn');
    const copyConfigBtn = document.getElementById('copy-config-btn');
    const importFileInput = document.getElementById('import-file-input');

    // Open modal
    settingsIcon.addEventListener('click', function() {
        updateSettingsInputs();
        updatePresetDropdown();
        settingsModal.classList.add('active');
    });

    // Close modal
    closeModalBtn.addEventListener('click', function() {
        settingsModal.classList.remove('active');
    });

    // Close modal when clicking outside
    settingsModal.addEventListener('click', function(e) {
        if (e.target === settingsModal) {
            settingsModal.classList.remove('active');
        }
    });

    // Close modal with ESC key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (settingsModal.classList.contains('active')) {
                settingsModal.classList.remove('active');
            }
            if (savePresetModal.classList.contains('active')) {
                savePresetModal.classList.remove('active');
            }
        }
    });

    // Preset selection
    presetSelect.addEventListener('change', function() {
        const value = this.value;
        if (value) {
            loadPreset(value);
        }
    });

    // Save preset button - open modal
    savePresetBtn.addEventListener('click', function() {
        presetNameInput.value = '';
        savePresetModal.classList.add('active');
        presetNameInput.focus();
    });

    // Confirm save preset
    confirmSavePreset.addEventListener('click', function() {
        const name = presetNameInput.value.trim();
        if (!name) {
            showToast('Please enter a preset name', 'error');
            return;
        }

        if (BUILT_IN_PRESETS[name]) {
            showToast('Cannot overwrite built-in preset', 'error');
            return;
        }

        // Get current values from inputs
        const newPreset = {
            startPoint: Number.parseFloat(document.getElementById('rule-start-point').value) || 0,
            endPoint: Number.parseFloat(document.getElementById('rule-end-point').value) || 0,
            checkpoint: Number.parseFloat(document.getElementById('rule-checkpoint').value) || 0,
            restart: Number.parseFloat(document.getElementById('rule-restart').value) || 0,
            bonus: Number.parseFloat(document.getElementById('rule-bonus').value) || 0,
            timeMultiplier: Number.parseFloat(document.getElementById('rule-time-multiplier').value) || 1,
            totalTime: Number.parseFloat(document.getElementById('rule-total-time').value) || 5
        };

        // Validate before saving
        const errors = validateRules(newPreset);
        if (Object.keys(errors).length > 0) {
            showToast('Please fix validation errors first', 'error');
            return;
        }

        userPresets[name] = newPreset;
        saveUserPresets();
        updatePresetDropdown();
        savePresetModal.classList.remove('active');
        showToast(`Preset "${name}" saved successfully`, 'success');
    });

    // Cancel save preset
    cancelSavePreset.addEventListener('click', function() {
        savePresetModal.classList.remove('active');
    });

    // Delete preset
    deletePresetBtn.addEventListener('click', function() {
        const value = presetSelect.value;
        if (!value) {
            showToast('Please select a preset to delete', 'error');
            return;
        }

        const [type, name] = value.split(':');

        if (type === 'builtin') {
            showToast('Cannot delete built-in presets', 'error');
            return;
        }

        if (confirm(`Are you sure you want to delete the preset "${name}"?`)) {
            delete userPresets[name];
            saveUserPresets();
            updatePresetDropdown();
            presetSelect.value = '';
            showToast(`Preset "${name}" deleted`, 'success');
        }
    });

    // Export configuration
    exportConfigBtn.addEventListener('click', function() {
        exportConfiguration();
    });

    // Import configuration
    importConfigBtn.addEventListener('click', function() {
        importFileInput.click();
    });

    importFileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            importConfiguration(file);
            e.target.value = ''; // Reset input
        }
    });

    // Copy configuration
    copyConfigBtn.addEventListener('click', function() {
        copyConfigToClipboard();
    });

    // Save settings
    saveSettingsBtn.addEventListener('click', function() {
        scoringRules.startPoint = Number.parseFloat(document.getElementById('rule-start-point').value) || 0;
        scoringRules.endPoint = Number.parseFloat(document.getElementById('rule-end-point').value) || 0;
        scoringRules.checkpoint = Number.parseFloat(document.getElementById('rule-checkpoint').value) || 0;
        scoringRules.restart = Number.parseFloat(document.getElementById('rule-restart').value) || 0;
        scoringRules.bonus = Number.parseFloat(document.getElementById('rule-bonus').value) || 0;
        scoringRules.timeMultiplier = Number.parseFloat(document.getElementById('rule-time-multiplier').value) || 1;
        scoringRules.totalTime = Number.parseFloat(document.getElementById('rule-total-time').value) || 0;

        // Validate before saving
        const errors = validateRules(scoringRules);
        if (Object.keys(errors).length > 0) {
            displayValidationErrors(errors);
            showToast('Please fix validation errors', 'error');
            return;
        }

        displayValidationErrors({});
        saveSettings();
        updateCheckboxLabels();
        updateCustomRulesBadge();
        // Update main interface total time input with settings value
        document.getElementById('total-time').value = scoringRules.totalTime;
        settingsModal.classList.remove('active');
        showToast('Settings saved successfully', 'success');
    });

    // Reset to defaults
    resetDefaultsBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to reset all scoring rules to default values?')) {
            scoringRules = { ...DEFAULT_RULES };
            updateSettingsInputs();
            saveSettings();
            updateCheckboxLabels();
            updateCustomRulesBadge();
            displayValidationErrors({});
            showToast('Reset to default settings', 'success');
        }
    });

    // Load settings on page load
    loadSettings();
    updateCheckboxLabels();
    updateCustomRulesBadge();

    // ===== STOPWATCH FUNCTIONALITY =====
    let stopwatchInterval = null;
    let stopwatchTime = 0;
    let isRunning = false;

    const stopwatchDisplay = document.getElementById('stopwatch-display');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const resetBtn = document.getElementById('reset-btn');
    const playIcon = playPauseBtn.querySelector('.play-icon');
    const pauseIcon = playPauseBtn.querySelector('.pause-icon');
    const btnText = playPauseBtn.querySelector('.btn-text');

    function formatTime(milliseconds) {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const ms = Math.floor((milliseconds % 1000) / 10);

        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
    }

    function updateStopwatchDisplay() {
        stopwatchDisplay.textContent = formatTime(stopwatchTime);
    }

    function startStopwatch() {
        isRunning = true;
        playPauseBtn.classList.add('paused');
        playIcon.classList.add('hidden');
        pauseIcon.classList.remove('hidden');
        btnText.textContent = 'Pause';

        const startTime = Date.now() - stopwatchTime;

        stopwatchInterval = setInterval(function() {
            stopwatchTime = Date.now() - startTime;
            updateStopwatchDisplay();

            // Auto-update elapsed time fields
            const totalSeconds = Math.floor(stopwatchTime / 1000);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;

            document.getElementById('elapsed-time-min').value = minutes;
            document.getElementById('elapsed-time-sec').value = seconds;
        }, 10);
    }

    function pauseStopwatch() {
        isRunning = false;
        clearInterval(stopwatchInterval);
        playPauseBtn.classList.remove('paused');
        playIcon.classList.remove('hidden');
        pauseIcon.classList.add('hidden');
        btnText.textContent = stopwatchTime > 0 ? 'Resume' : 'Start';
    }

    playPauseBtn.addEventListener('click', function() {
        if (isRunning) {
            pauseStopwatch();
        } else {
            startStopwatch();
        }
    });

    // Reset button with hold-to-confirm
    let resetHoldTimer = null;
    let isResetting = false;

    resetBtn.addEventListener('mousedown', function() {
        isResetting = true;
        resetBtn.textContent = 'Hold...';

        resetHoldTimer = setTimeout(function() {
            if (isResetting) {
                // Perform reset
                isRunning = false;
                clearInterval(stopwatchInterval);
                stopwatchTime = 0;
                updateStopwatchDisplay();

                playPauseBtn.classList.remove('paused');
                playIcon.classList.remove('hidden');
                pauseIcon.classList.add('hidden');
                btnText.textContent = 'Start';

                // Reset elapsed time fields
                document.getElementById('elapsed-time-min').value = 0;
                document.getElementById('elapsed-time-sec').value = 0;

                resetBtn.textContent = 'Reset';
                showToast('Stopwatch reset', 'success');
            }
        }, 800); // Hold for 800ms
    });

    resetBtn.addEventListener('mouseup', function() {
        isResetting = false;
        clearTimeout(resetHoldTimer);
        resetBtn.textContent = 'Reset';
    });

    resetBtn.addEventListener('mouseleave', function() {
        isResetting = false;
        clearTimeout(resetHoldTimer);
        resetBtn.textContent = 'Reset';
    });

    // Touch events for mobile
    resetBtn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        isResetting = true;
        resetBtn.textContent = 'Hold...';

        resetHoldTimer = setTimeout(function() {
            if (isResetting) {
                // Perform reset
                isRunning = false;
                clearInterval(stopwatchInterval);
                stopwatchTime = 0;
                updateStopwatchDisplay();

                playPauseBtn.classList.remove('paused');
                playIcon.classList.remove('hidden');
                pauseIcon.classList.add('hidden');
                btnText.textContent = 'Start';

                // Reset elapsed time fields
                document.getElementById('elapsed-time-min').value = 0;
                document.getElementById('elapsed-time-sec').value = 0;

                resetBtn.textContent = 'Reset';
                showToast('Stopwatch reset', 'success');
            }
        }, 800);
    });

    resetBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        isResetting = false;
        clearTimeout(resetHoldTimer);
        resetBtn.textContent = 'Reset';
    });

    resetBtn.addEventListener('touchcancel', function(e) {
        e.preventDefault();
        isResetting = false;
        clearTimeout(resetHoldTimer);
        resetBtn.textContent = 'Reset';
    });

    // ===== TIME PRESET BUTTONS =====
    document.querySelectorAll('.time-preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const time = btn.dataset.time;
            document.getElementById('rule-total-time').value = time;
        });
    });

    // ===== SCORING CALCULATION =====
    document.getElementById('calculate-btn').addEventListener('click', function() {

        // --- 1. Get Values from Inputs ---

        // Get boolean (true/false) from checkboxes
        const leftStart = document.getElementById('start-point').checked;
        const reachedEnd = document.getElementById('end-point').checked;

        // Get numbers from count fields
        const checkpoints = Number.parseInt(document.getElementById('checkpoints').value) || 0;
        const restarts = Number.parseInt(document.getElementById('restarts').value) || 0;

        // --- MODIFIED TIME LOGIC ---
        // Get time values - use manual input if provided, otherwise fall back to settings
        const totalTimeMinutes = Number.parseFloat(document.getElementById('total-time').value) || scoringRules.totalTime || 0;
        const elapsedMinutes = Number.parseInt(document.getElementById('elapsed-time-min').value) || 0;
        const elapsedSeconds = Number.parseInt(document.getElementById('elapsed-time-sec').value) || 0;

        // Convert all time to a common unit (seconds) for calculation
        const totalTimeInSeconds = totalTimeMinutes * 60;
        const elapsedTotalSeconds = (elapsedMinutes * 60) + elapsedSeconds;
        // --- END OF MODIFIED TIME LOGIC ---


        // --- 2. Calculate Each Score Component (Using Custom Rules) ---

        // S: Start point score
        const scoreS = leftStart ? scoringRules.startPoint : 0;

        // E: End point score
        const scoreE = reachedEnd ? scoringRules.endPoint : 0;

        // C: Checkpoint score per checkpoint
        const scoreC = checkpoints * scoringRules.checkpoint;

        // R: Restart penalty per restart
        const scoreR = restarts * scoringRules.restart;

        // B: Perfect bonus if restarts is 0 AND the end was reached
        const scoreB = (restarts === 0 && reachedEnd) ? scoringRules.bonus : 0;

        // T: (Total Time - Elapsed Time) * time multiplier
        const scoreT = (totalTimeInSeconds - elapsedTotalSeconds) * scoringRules.timeMultiplier;

        // --- 3. Calculate Total Score ---
        const finalScore = scoreS + scoreE + scoreC + scoreR + scoreB + scoreT;

        // --- 4. Display the Result ---

        // Show the final score
        document.getElementById('total-score').textContent = `Total Score: ${finalScore.toFixed(0)}`;

        // Show a detailed breakdown in a better format
        const breakdown = `
            <div class="breakdown-row">
                <span class="breakdown-label">Start Point (S):</span>
                <span class="breakdown-value" style="color: ${scoreS < 0 ? '#ef4444' : '#10b981'}">${scoreS > 0 ? '+' : ''}${scoreS}</span>
            </div>
            <div class="breakdown-row">
                <span class="breakdown-label">End Point (E):</span>
                <span class="breakdown-value" style="color: ${scoreE < 0 ? '#ef4444' : '#10b981'}">${scoreE > 0 ? '+' : ''}${scoreE}</span>
            </div>
            <div class="breakdown-row">
                <span class="breakdown-label">Checkpoints (C):</span>
                <span class="breakdown-value" style="color: ${scoreC < 0 ? '#ef4444' : '#10b981'}">${scoreC > 0 ? '+' : ''}${scoreC} <span style="opacity: 0.6">(${checkpoints} × ${scoringRules.checkpoint})</span></span>
            </div>
            <div class="breakdown-row">
                <span class="breakdown-label">Restarts (R):</span>
                <span class="breakdown-value" style="color: ${scoreR < 0 ? '#ef4444' : '#10b981'}">${scoreR > 0 ? '+' : ''}${scoreR} <span style="opacity: 0.6">(${restarts} × ${scoringRules.restart})</span></span>
            </div>
            <div class="breakdown-row">
                <span class="breakdown-label">Perfect Bonus (B):</span>
                <span class="breakdown-value" style="color: ${scoreB < 0 ? '#ef4444' : '#10b981'}">${scoreB > 0 ? '+' : ''}${scoreB}</span>
            </div>
            <div class="breakdown-row">
                <span class="breakdown-label">Time Bonus (T):</span>
                <span class="breakdown-value" style="color: ${scoreT < 0 ? '#ef4444' : '#10b981'}">${scoreT > 0 ? '+' : ''}${scoreT.toFixed(1)}s <span style="opacity: 0.6">(${totalTimeInSeconds.toFixed(0)}s - ${elapsedTotalSeconds.toFixed(0)}s) × ${scoringRules.timeMultiplier}</span></span>
            </div>
        `;
        document.getElementById('score-breakdown').innerHTML = breakdown;
    });

    // ===== DARK MODE TOGGLE =====
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const sunIcon = darkModeToggle.querySelector('.sun-icon');
    const moonIcon = darkModeToggle.querySelector('.moon-icon');

    // Check for saved dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'enabled') {
        document.body.classList.add('dark-mode');
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
    }

    // Toggle dark mode
    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');

        // Toggle icons
        sunIcon.classList.toggle('hidden', isDarkMode);
        moonIcon.classList.toggle('hidden', !isDarkMode);

        // Save preference
        localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');
    });
});
