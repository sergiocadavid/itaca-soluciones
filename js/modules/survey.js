import { state } from '../state.js';
import { elements, views, switchView } from './ui.js';

export const prepareQueue = () => {
    const FACTOR = 0.05 // Ajustar a 1.0 para versión real
    const forms = state.surveyConfig.forms;
    const type = state.currentUser.form_type;
    state.questionsQueue = [
        ...(forms[type] || []).slice(0, Math.ceil(forms[type].length * FACTOR)).map(q => ({ ...q, section: 'intralaboral' })),
        ...(forms.extralaboral || []).slice(0, Math.ceil(forms.extralaboral.length * FACTOR)).map(q => ({ ...q, section: 'extralaboral' })),
        ...(forms.stress || []).slice(0, Math.ceil(forms.stress.length * FACTOR)).map(q => ({ ...q, section: 'stress' }))
    ];
};

export const renderValidationCard = () => {
    views.demographic.innerHTML = `
        <div class="card" style="max-width: 700px; margin: 0 auto; border-top: 8px solid #3498db; padding: 35px; background:white; border-radius:15px;">
            <h2 style="text-align:center; color:#2c3e50;">Ficha Técnica del Evaluado</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; background: #f8fafc; padding: 25px; border-radius: 12px; border: 1px solid #e2e8f0; text-align: left; margin: 20px 0;">
                <div><small style="font-weight:bold; color:#3498db;">NOMBRE</small><br><strong>${state.demographics.name}</strong></div>
                <div><small style="font-weight:bold; color:#3498db;">PERFIL</small><br><strong>${state.demographics.formLabel}</strong></div>
                <div><small style="font-weight:bold; color:#3498db;">ÁREA</small><br>${state.demographics.area}</div>
                <div><small style="font-weight:bold; color:#3498db;">CARGO</small><br>${state.demographics.position}</div>
                <div><small style="font-weight:bold; color:#3498db;">ESCOLARIDAD</small><br>${state.demographics.education}</div>
                <div><small style="font-weight:bold; color:#3498db;">ESTADO CIVIL</small><br>${state.demographics.marital}</div>
            </div>
            <button id="start-survey-final" class="btn-primary" style="width:100%; height:60px; font-size:1.2rem; font-weight:bold;">CONFIRMAR E INICIAR PRUEBA</button>
        </div>`;

    // We bind it here dynamically because it was dynamically created
    document.getElementById('start-survey-final').onclick = startSurvey;
};

export const startSurvey = () => {
    prepareQueue();
    state.currentQuestionIndex = 0;
    state.answers = {};
    switchView('survey');
    renderQuestion();
};

export const resumeSurvey = (data) => {
    state.answers = data.answers;
    state.currentQuestionIndex = data.index;
    prepareQueue();
    switchView('survey');
    renderQuestion();
};

export const renderQuestion = () => {
    const q = state.questionsQueue[state.currentQuestionIndex];
    if (!q) { finishSurvey(); return; }

    const progress = Math.round((state.currentQuestionIndex / state.questionsQueue.length) * 100);
    elements.progressBar.style.width = `${progress}%`;
    elements.progressText.textContent = `${progress}% Completado`;

    const color = q.section === 'extralaboral' ? "#27ae60" : q.section === 'stress' ? "#e67e22" : "#2980b9";

    elements.surveyTitle.innerHTML = `
        <div style="text-align: center; border-bottom: 4px solid ${color}; margin-bottom: 20px;">
            <p style="margin:0; font-size:0.8rem; color:#95a5a6;">${state.demographics.formLabel}</p>
            <h2 style="color: ${color}; text-transform: uppercase; margin: 5px 0;">SÍNTOMAS DE ${q.section}</h2>
        </div>`;

    elements.questionsContainer.innerHTML = `
        <div class="question-card">
            <p style="font-size: 1.4rem; color: #2c3e50; margin-bottom: 30px;">${q.text}</p>
            <div style="display: flex; flex-direction: column; gap: 12px;">
                 ${state.surveyConfig.options.map(opt => {
        const isSelected = state.answers[q.id] === opt.value;
        return `
                    <div class="option-row" data-val="${opt.value}"
                         style="display:flex; align-items:center; padding:18px; border:2px solid ${isSelected ? color : '#eee'}; border-radius:12px; cursor:pointer; background:${isSelected ? color + '10' : 'white'};">
                        <div class="radio-outer" style="width:24px; height:24px; border:2px solid ${isSelected ? color : '#bdc3c7'}; border-radius:50%; margin-right:15px; display:flex; align-items:center; justify-content:center;">
                            <div class="radio-inner" style="width:12px; height:12px; background:${isSelected ? color : 'transparent'}; border-radius:50%;"></div>
                        </div>
                        <span style="font-weight:500; color:#34495e;">${opt.label}</span>
                    </div>`;
    }).join('')}
            </div>
        </div>`;

    // Bind option events
    document.querySelectorAll('.option-row').forEach(row => {
        row.onclick = () => selectOption(q.id, parseInt(row.dataset.val), row, color);
    })

    elements.nextBtn.disabled = !state.answers[q.id];
};

export const selectOption = (qId, val, element, color) => {
    element.parentElement.querySelectorAll('.option-row').forEach(row => {
        row.style.borderColor = "#eee"; row.style.background = "white";
        row.querySelector('.radio-inner').style.background = "transparent";
    });
    element.style.borderColor = color;
    element.style.background = `${color}10`;
    element.querySelector('.radio-inner').style.background = color;

    state.answers[qId] = val;
    elements.nextBtn.disabled = false;
    saveTempProgress();
};

export const saveTempProgress = () => {
    if (state.currentUser) {
        localStorage.setItem(`itaca_temp_${state.currentUser.id}`, JSON.stringify({
            answers: state.answers,
            index: state.currentQuestionIndex
        }));
    }
};

export const finishSurvey = async () => {
    const niveles = ['Muy Bajo', 'Bajo', 'Medio', 'Alto', 'Muy Alto'];
    const result = {
        uuid: Math.random().toString(36).substr(2, 9).toUpperCase(),
        name: state.currentUser.name,
        area: state.currentUser.area,
        id: state.currentUser.id,
        fullAnswers: { ...state.answers },
        riesgoIntra: niveles[Math.floor(Math.random() * niveles.length)],
        estres: niveles[Math.floor(Math.random() * niveles.length)],
        date: new Date().toLocaleString()
    };

    try {
        // Guardar en la nube en lugar de local
        const { db, collection, addDoc } = await import('../firebase-config.js');
        await addDoc(collection(db, "results"), result);

        // Remover progreso temporal local
        localStorage.removeItem(`itaca_temp_${state.currentUser.id}`);

        views.result.innerHTML = `
            <div class="card" style="max-width: 600px; margin: 50px auto; text-align: center; padding: 40px; border-top: 8px solid #27ae60;">
                <div style="font-size: 50px; color: #27ae60; margin-bottom: 20px;">✔️</div>
                <h2 style="color: #2c3e50; font-size: 1.8rem;">Evaluación Finalizada y Guardada de Forma Segura en la Nube</h2>
                <p style="color: #7f8c8d; font-size: 1.1rem; line-height: 1.6; margin: 20px 0;">
                    Estimado(a) <strong>${state.currentUser.name}</strong>,<br><br>
                    Agradecemos su valiosa participación en la batería de riesgo psicosocial de <strong>Itaca Soluciones S.A.S.</strong><br><br>
                    Sus respuestas han sido centralizadas bajo estricta reserva legal. La información recolectada es fundamental para el fortalecimiento de nuestros programas de bienestar y salud ocupacional.
                </p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
                <button id="logout-finish-btn" class="btn-primary" style="padding: 15px 30px;">CERRAR SESIÓN</button>
            </div>
        `;

        document.getElementById('logout-finish-btn').onclick = () => location.reload();
        switchView('result');
    } catch (e) {
        console.error("Error guardando en Firebase: ", e);
        alert("Ocurrió un error de conexión al guardar sus respuestas. Por favor, reintente en unos momentos.");
    }
};
