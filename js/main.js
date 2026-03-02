import { state } from './state.js';
import { elements, switchView } from './modules/ui.js';
import { handleLogin } from './modules/auth.js';
import { renderValidationCard, renderQuestion, saveTempProgress } from './modules/survey.js';
import { simulate, renderParticipationTable, renderResultsTable, downloadGeneralReport } from './modules/dashboard.js';

const setupEventListeners = () => {
    // Auth
    if (elements.loginBtn) elements.loginBtn.onclick = handleLogin;
    if (elements.logoutBtn) elements.logoutBtn.onclick = () => location.reload();

    // Admin Shortcut
    if (elements.adminLink) {
        elements.adminLink.onclick = (e) => {
            e.preventDefault();
            elements.cedulaInput.value = "0000";
            handleLogin();
        };
    }

    // Survey Flow
    if (elements.nextBtn) {
        elements.nextBtn.onclick = () => {
            state.currentQuestionIndex++;
            renderQuestion();
            saveTempProgress();
        };
    }

    if (elements.consentCheck) {
        elements.consentCheck.onchange = e => {
            if (elements.goToDemographicsBtn) elements.goToDemographicsBtn.disabled = !e.target.checked;
        };
    }

    if (elements.goToDemographicsBtn) {
        elements.goToDemographicsBtn.onclick = () => {
            renderValidationCard();
            switchView('demographic');
        };
    }

    // Dashboard features
    const btnSimular = document.getElementById('simulate-data-btn');
    if (btnSimular) btnSimular.onclick = simulate;

    const btnPart = document.getElementById('view-participation-btn');
    if (btnPart) btnPart.onclick = renderParticipationTable;

    const btnRes = document.getElementById('view-individual-results-btn');
    if (btnRes) btnRes.onclick = renderResultsTable;

    const btnGenReport = document.getElementById('download-general-report-btn');
    if (btnGenReport) btnGenReport.onclick = downloadGeneralReport;

    const btnReset = document.getElementById('reset-data-btn');
    if (btnReset) btnReset.onclick = () => {
        if (confirm("¿Borrar base de datos?")) {
            localStorage.clear();
            location.reload();
        }
    };

    const exitBtn = document.getElementById('exit-system-btn');
    if (exitBtn) exitBtn.onclick = () => location.reload();
};

const init = () => {
    // Load Global State
    if (window.employeesData && window.surveyConfigData) {
        state.employees = window.employeesData;
        state.surveyConfig = window.surveyConfigData;

        // Hide all views except login initially
        switchView('login');

        // Wait for next tick to ensure DOM is fully instantiated in module context
        setTimeout(() => {
            setupEventListeners();
        }, 50);

    } else {
        console.error("Critical error: data.js failed to load before main.js.");
        // Retry once after a delay if data.js is lagging
        setTimeout(init, 500);
    }
};

// Module scripts are deferred by default, meaning DOMContentLoaded might have already fired,
// or it might fire right after. We check the readystate to be safe.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
