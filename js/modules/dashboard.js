import { state } from '../state.js';
import { elements } from './ui.js';

let cachedDb = null;

const fetchResults = async (force = false) => {
    if (cachedDb && !force) return cachedDb;
    try {
        const { db, collection, getDocs } = await import('../firebase-config.js');
        const querySnapshot = await getDocs(collection(db, "results"));
        const results = [];
        querySnapshot.forEach((doc) => {
            results.push({ _docId: doc.id, ...doc.data() });
        });
        cachedDb = results;
        return results;
    } catch (e) {
        console.error("Error obteniendo resultados de Firebase: ", e);
        return [];
    }
};

export const simulate = async () => {
    const { db, collection, addDoc } = await import('../firebase-config.js');
    const niveles = ['Muy Bajo', 'Bajo', 'Medio', 'Alto', 'Muy Alto'];
    const cantidadASimular = Math.ceil(state.employees.length * 0.7);

    alert("Simulando datos y subiendo a la nube... Esto puede tardar unos segundos.");

    try {
        for (let i = 0; i < cantidadASimular; i++) {
            const emp = state.employees[i % state.employees.length];
            const result = {
                uuid: Math.random().toString(36).substr(2, 9).toUpperCase(),
                id: emp.id,
                name: emp.name,
                area: emp.area,
                riesgoIntra: niveles[Math.floor(Math.random() * niveles.length)],
                estres: niveles[Math.floor(Math.random() * niveles.length)],
                date: new Date().toLocaleString(),
                fullAnswers: {}
            };
            await addDoc(collection(db, "results"), result);
        }
        alert("¡Datos simulados en la nube con éxito!");
        await fetchResults(true); // Force refresh
        actualizarVisualizaciones();
    } catch (e) {
        console.error("Error al simular:", e);
        alert("Ocurrió un error en la simulación.");
    }
};

export const renderHeatmap = async () => {
    const dbData = await fetchResults();
    const contenedor = document.getElementById('heatmap-container');
    if (!contenedor) return;

    // Inicializar siempre con todas las áreas disponibles en el sistema
    const resumenAreas = {};
    state.employees.forEach(emp => {
        if (!resumenAreas[emp.area]) resumenAreas[emp.area] = { total: 0, score: 0 };
    });

    // Populate data from results
    dbData.forEach(res => {
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

export const actualizarVisualizaciones = async () => {
    // Forzamos recarga si es necesario
    await initDashboard();
};

export const initDashboard = async () => {
    const dbData = await fetchResults();
    const stat = document.getElementById('participation-stat');
    const detail = document.getElementById('participation-detail');

    if (stat) {
        const porcentaje = state.employees.length > 0 ? Math.round((dbData.length / state.employees.length) * 100) : 0;
        stat.textContent = `${porcentaje}%`;
        if (detail) detail.textContent = `${dbData.length} de ${state.employees.length} evaluados`;
    }

    const intraLevel = document.getElementById('intra-risk-level');
    const stressLevel = document.getElementById('stress-risk-level');

    if (dbData.length > 0 && intraLevel && stressLevel) {
        const getMode = (arr) => {
            if (!arr || arr.length === 0) return 'Medio';
            const counts = arr.reduce((acc, val) => { acc[val] = (acc[val] || 0) + 1; return acc; }, {});
            return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
        };

        const validIntra = dbData.filter(r => r.riesgoIntra).map(r => r.riesgoIntra);
        const validStress = dbData.filter(r => r.estres).map(r => r.estres);

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

    await renderHeatmap();
};

export const renderParticipationTable = async () => {
    const section = document.getElementById('participation-section');
    if (!section) return;
    section.classList.remove('hidden');

    const dbData = await fetchResults();
    const participacionesIds = dbData.map(r => String(r.id));

    const tbody = document.getElementById('participation-table-body');

    tbody.innerHTML = state.employees.map(emp => `
        <tr>
            <td style="padding:10px; border-bottom:1px solid #eee;">${emp.id}</td>
            <td>${emp.name}</td>
            <td style="color:${participacionesIds.includes(String(emp.id)) ? '#27ae60' : '#e74c3c'}; font-weight:bold;">
                ${participacionesIds.includes(String(emp.id)) ? '● COMPLETADO' : '○ PENDIENTE'}
            </td>
        </tr>`).join('');
};

export const downloadGeneralReport = async () => {
    const dbData = await fetchResults();
    if (dbData.length === 0) return alert("No hay datos en la nube");

    let csv = "\uFEFFFecha;Nombre;Area;Puntaje\n";
    dbData.forEach(r => {
        csv += `${r.date};${r.name};${r.area};Completado\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = "Informe_General_Itaca.csv";
    link.click();
};

export const renderResultsTable = async () => {
    const pin = prompt("🔐 PIN DE ESPECIALISTA (1234):");
    if (pin !== "1234") return;

    document.getElementById('individual-results-section').classList.remove('hidden');
    const dbData = await fetchResults();

    document.getElementById('individual-results-body').innerHTML = dbData.map(r => `
        <tr><td>${r.date}</td><td>${r.name}</td><td>${r.area}</td><td><button data-uuid="${r.uuid}" class="btn-audit" style="background:#3498db; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Ver Todo</button></td></tr>`).join('');

    document.querySelectorAll('.btn-audit').forEach(btn => {
        btn.onclick = () => verDetalleAudit(btn.dataset.uuid);
    });
};

export const verDetalleAudit = async (uuid) => {
    const dbData = await fetchResults();
    const res = dbData.find(x => x.uuid === uuid);
    if (!res) return;

    const pool = [
        ...state.surveyConfig.forms.A,
        ...state.surveyConfig.forms.B,
        ...state.surveyConfig.forms.extralaboral,
        ...state.surveyConfig.forms.stress
    ];

    let reporte = `📋 AUDITORÍA TOTAL: ${res.name}\n==============================\n\n`;

    Object.entries(res.fullAnswers || {}).forEach(([id, val]) => {
        const q = pool.find(p => p.id === id);
        const opt = state.surveyConfig.options.find(o => o.value === val);
        reporte += `Pregunta: ${q ? q.text : id}\nRespuesta: ${opt ? opt.label : val}\n\n`;
    });

    alert(reporte);
};
