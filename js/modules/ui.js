export const views = {
    get login() { return document.getElementById('login-view'); },
    get consent() { return document.getElementById('consent-view'); },
    get demographic() { return document.getElementById('demographic-view'); },
    get survey() { return document.getElementById('survey-view'); },
    get result() { return document.getElementById('result-view'); },
    get dashboard() { return document.getElementById('dashboard-view'); }
};

export const elements = {
    get cedulaInput() { return document.getElementById('cedula-input'); },
    get loginBtn() { return document.getElementById('login-btn'); },
    get loginError() { return document.getElementById('login-error'); },
    get adminLink() { return document.getElementById('admin-login-link'); },
    get consentCheck() { return document.getElementById('consent-check'); },
    get goToDemographicsBtn() { return document.getElementById('go-to-demographics-btn'); },
    get userInfo() { return document.getElementById('user-info'); },
    get userName() { return document.getElementById('user-name'); },
    get logoutBtn() { return document.getElementById('logout-btn'); },
    get questionsContainer() { return document.getElementById('questions-container'); },
    get nextBtn() { return document.getElementById('next-btn'); },
    get progressBar() { return document.getElementById('progress-bar'); },
    get progressText() { return document.getElementById('progress-text'); },
    get surveyTitle() { return document.getElementById('survey-title'); },
    get areaFilter() { return document.getElementById('area-filter'); }
};

export const switchView = (viewName) => {
    Object.values(views).forEach(v => v?.classList.add('hidden'));
    views[viewName]?.classList.remove('hidden');
};

export const showError = (m) => {
    if (elements.loginError) elements.loginError.textContent = m;
};

export const showUserHeader = (userName) => {
    if (elements.userInfo && elements.userName) {
        elements.userInfo.classList.remove('hidden');
        elements.userName.textContent = userName;
    }
};
