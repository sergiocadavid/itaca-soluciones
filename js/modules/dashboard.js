import { state } from '../state.js';
import { elements } from './ui.js';

export const simulate = () => {
    const niveles = ['Muy Bajo', 'Bajo', 'Medio', 'Alto', 'Muy Alto'];
    const resultadosSimulados = [];

    const cantidadASimular = Math.ceil(state.employees.length * 0.7);

    for (let i = 0; i < cantidadASimular; i++) {
        const emp = state.employees[i % state.employees.length];
        resultadosSimulados.push({
            uuid: Math.random().toString(36).substr(2, 9).toUpperCase(),
            id: emp.id,
            name: emp.name,
            area: emp.area,
            riesgoIntra: niveles[Math.floor(Math.random() * niveles.length)],
            estres: niveles[Math.floor(Math.random() * niveles.length)],
            date: new Date().toLocaleString(),
            fullAnswers: {}
        });
    }

    localStorage.setItem('itaca_results', JSON.stringify(resultadosSimulados));
    alert("¡Datos simulados con éxito!");
    actualizarVisualizaciones();
};

export const renderHeatmap = () => {
    const db = JSON.parse(localStorage.getItem('itaca_results') || '[]');
    const contenedor = document.getElementById('heatmap-container');
    if (!contenedor) return;

    // Inicializar siempre con todas las áreas disponibles en el sistema
    const resumenAreas = {};
    state.employees.forEach(emp => {
        if (!resumenAreas[emp.area]) resumenAreas[emp.area] = { total: 0, score: 0 };
    });

    // Populate data from results
    db.forEach(res => {
        if (!resumenAreas[res.area]) resumenAreas[res.area] = { total: 0, score: 0 };
        resumenAreas[res.area].total++;
        let riskVal = 0;
        switch (res.riesgoIntra) {
            case 'Muy Alto': riskVal = 100; break;
            case 'Alto': riskVal = 75; break;
            case 'Medio': riskVal = 50; break;
            case 'Bajo': riskVal = 25; break;
            case 'Muy Bajo': riskVal = 10; break;
            default: riskVal = 0;
        }
        resumenAreas[res.area].score += riskVal;
    });

    const filterVal = elements.areaFilter ? elements.areaFilter.value : 'all';

    contenedor.innerHTML = Object.keys(resumenAreas)
        .filter(area => filterVal === 'all' || area === filterVal)
        .map(area => {
            const hasData = resumenAreas[area].total > 0;
            const avgRisk = hasData ? Math.round(resumenAreas[area].score / resumenAreas[area].total) : 0;

            let color = '#bdc3c7'; // Grays for no data
            let statusText = 'Sin Datos';

            if (hasData) {
                if (avgRisk >= 75) { color = '#f44336'; statusText = 'Riesgo Crítico'; }
                else if (avgRisk >= 50) { color = '#f39c12'; statusText = 'Riesgo Medio'; }
                else { color = '#4CAF50'; statusText = 'Riesgo Bajo'; }
            }

            const width = hasData ? avgRisk : 0;

            return `
            <div style="margin-bottom: 15px; background: #f9f9f9; padding: 10px; border-radius: 5px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                    <span style="font-weight:bold;">${area}</span>
                    <span style="color:${color}; font-weight:bold; font-size:0.9rem;">${hasData ? statusText + ' (' + width + '%)' : statusText}</span>
                </div>
                <div style="background:#e0e0e0; height:12px; border-radius:6px; overflow:hidden;">
                    <div style="background:${color}; width:${width}%; height:100%; transition: width 0.8s ease-out;"></div>
                </div>
            </div>`;
        }).join('');
};

export const actualizarVisualizaciones = () => {
    initDashboard();
    renderHeatmap();
};

export const initDashboard = () => {
    const db = JSON.parse(localStorage.getItem('itaca_results') || '[]');
    const stat = document.getElementById('participation-stat');
    const detail = document.getElementById('participation-detail');

    if (stat) {
        const porcentaje = state.employees.length > 0 ? Math.round((db.length / state.employees.length) * 100) : 0;
        stat.textContent = `${porcentaje}%`;
        if (detail) detail.textContent = `${db.length} de ${state.employees.length} evaluados`;
    }

    const intraLevel = document.getElementById('intra-risk-level');
    const stressLevel = document.getElementById('stress-risk-level');

    if (db.length > 0 && intraLevel && stressLevel) {
        const getMode = (arr) => {
            if (!arr || arr.length === 0) return 'Medio';
            const counts = arr.reduce((acc, val) => { acc[val] = (acc[val] || 0) + 1; return acc; }, {});
            return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
        };

        const validIntra = db.filter(r => r.riesgoIntra).map(r => r.riesgoIntra);
        const validStress = db.filter(r => r.estres).map(r => r.estres);

        const modeIntra = validIntra.length ? getMode(validIntra) : 'Pendiente';
        const modeStress = validStress.length ? getMode(validStress) : 'Pendiente';

        const applyRiskStyle = (el, val) => {
            el.textContent = val;
            el.className = 'risk-level'; // reset
            if (val === 'Alto' || val === 'Muy Alto') el.classList.add('risk-high');
            else if (val === 'Medio') el.classList.add('risk-med');
            else if (val === 'Pendiente') { el.classList.remove('risk-low'); }
            else el.classList.add('risk-low');
        };

        applyRiskStyle(intraLevel, modeIntra);
        applyRiskStyle(stressLevel, modeStress);
    }

    renderHeatmap();
};

export const renderParticipationTable = () => {
    const section = document.getElementById('participation-section');
    if (!section) return;
    section.classList.remove('hidden');

    const log = JSON.parse(localStorage.getItem('itaca_participation_log') || '[]');
    const tbody = document.getElementById('participation-table-body');

    tbody.innerHTML = state.employees.map(emp => `
        <tr>
            <td style="padding:10px; border-bottom:1px solid #eee;">${emp.id}</td>
            <td>${emp.name}</td>
            <td style="color:${log.includes(emp.id) ? '#27ae60' : '#e74c3c'}; font-weight:bold;">
                ${log.includes(emp.id) ? '● COMPLETADO' : '○ PENDIENTE'}
            </td>
        </tr>`).join('');
};

export const downloadGeneralReport = () => {
    const db = JSON.parse(localStorage.getItem('itaca_results') || '[]');
    if (db.length === 0) return alert("No hay datos");

    let csv = "\uFEFFFecha;Nombre;Area;Puntaje\n";
    db.forEach(r => {
        csv += `${r.date};${r.name};${r.area};Completado\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = "Informe_General_Itaca.csv";
    link.click();
};

export const renderResultsTable = () => {
    const pin = prompt("🔐 PIN DE ESPECIALISTA (1234):");
    if (pin !== "1234") return;
    document.getElementById('individual-results-section').classList.remove('hidden');
    const db = JSON.parse(localStorage.getItem('itaca_results') || '[]');
    document.getElementById('individual-results-body').innerHTML = db.map(r => `
        <tr><td>${r.date}</td><td>${r.name}</td><td>${r.area}</td><td><button data-uuid="${r.uuid}" class="btn-audit" style="background:#3498db; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Ver Todo</button></td></tr>`).join('');

    document.querySelectorAll('.btn-audit').forEach(btn => {
        btn.onclick = () => verDetalleAudit(btn.dataset.uuid);
    });
};

export const verDetalleAudit = (uuid) => {
    const db = JSON.parse(localStorage.getItem('itaca_results') || '[]');
    const res = db.find(x => x.uuid === uuid);
    if (!res) return;

    const pool = [
        ...state.surveyConfig.forms.A,
        ...state.surveyConfig.forms.B,
        ...state.surveyConfig.forms.extralaboral,
        ...state.surveyConfig.forms.stress
    ];

    let reporte = `📋 AUDITORÍA TOTAL: ${res.name}\n==============================\n\n`;

    Object.entries(res.fullAnswers).forEach(([id, val]) => {
        const q = pool.find(p => p.id === id);
        const opt = state.surveyConfig.options.find(o => o.value === val);
        reporte += `Pregunta: ${q ? q.text : id}\nRespuesta: ${opt ? opt.label : val}\n\n`;
    });

    alert(reporte);
};
