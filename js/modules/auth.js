import { state } from '../state.js';
import { elements, views, switchView, showError, showUserHeader } from './ui.js';
import { resumeSurvey } from './survey.js';
import { initDashboard } from './dashboard.js';

export const handleLogin = () => {
    const inputId = elements.cedulaInput.value.trim();
    if (!inputId) {
        showError("Por favor, ingresa tu cédula.");
        return;
    }

    if (inputId === '0000' || inputId === '9999') {
        state.currentUser = { name: "Administrador SST", role: "admin", id: inputId, area: "SST" };
        showUserHeader();
        initDashboard();
        switchView('dashboard');
        return;
    }

    const user = state.employees.find(emp => emp.id === inputId);
    if (user) {
        state.currentUser = user;
        showUserHeader();

        state.demographics = {
            name: user.name,
            area: user.area,
            position: user.position,
            education: user.education || 'Profesional',
            marital: user.marital_status || 'Casado(a)',
            seniority: user.seniority || '2-5 años',
            sex: user.sex === 'M' ? 'Masculino' : 'Femenino',
            formLabel: user.form_type === 'A' ? 'FORMA A (Jefes/Profesionales)' : 'FORMA B (Operativos/Auxiliares)'
        };

        const saved = localStorage.getItem(`itaca_temp_${user.id}`);
        if (saved) {
            const data = JSON.parse(saved);
            if (confirm(`Hola ${user.name}, tienes una prueba pendiente. ¿Deseas continuar desde la pregunta ${data.index + 1}?`)) {
                resumeSurvey(data);
                return;
            } else {
                localStorage.removeItem(`itaca_temp_${user.id}`);
            }
        }
        switchView('consent');
    } else {
        showError("Cédula no registrada.");
    }
};
