# Proyecto: Batería de Riesgo Psicosocial - Itaca Soluciones

Este proyecto implementa la Batería de Instrumentos para la Evaluación de Factores de Riesgo Psicosocial (Resolución 2764 de 2022) en una aplicación web moderna y segura.

## Características Principales

1.  **Evaluación Intralaboral, Extralaboral y Estrés**: Cuestionarios completos según la normativa.
2.  **Motor de Baremos**: Cálculo automático de riesgo (Sin Riesgo, Bajo, Medio, Alto, Muy Alto) diferenciado por **Sexo** y **Tipo de Cargo (Forma A/B)**.
3.  **Privacidad y Anonimato**: Los resultados se guardan desasociados de la identidad del trabajador (usando UUIDs), cumpliendo con la reserva legal.
4.  **Informes Automáticos**:
    *   **Informe Individual**: Descargable por el trabajador al finalizar (muestra su ID).
    *   **Informe Gerencial**: Consolidado estadístico para la empresa (muestra tendencias grupales).
5.  **Persistencia Local**: Los datos se guardan en el navegador (`LocalStorage`) permitiendo funcionar sin conexión a internet y sin servidor backend complejo.

## Estructura del Proyecto

*   `index.html`: Archivo principal. Contiene todas las vistas (Login, Consentimiento, Encuesta, Resultados, Dashboard).
*   `css/styles.css`: Estilos visuales con diseño "Glassmorphism" y tema SST.
*   `js/app.js`: Lógica de la aplicación (Navegación, Puntuación, Anonimización, Reportes).
*   `js/data.js`: Base de datos simulada de empleados y configuración de preguntas/baremos.

## Cómo Usar

1.  **Para Trabajadores**:
    *   Abrir `index.html` en un navegador (Chrome, Edge, Firefox).
    *   Ingresar una cédula válida (ej: `10101001` para Forma A, `10101004` para Forma B).
    *   Leer el consentimiento y aceptar.
    *   Responder la encuesta. Se puede usar el botón "Anterior" para corregir.
    *   Al finalizar, descargar el informe individual en PDF.

2.  **Para Administradores/Psicólogos**:
    *   En el login, ingresar la cédula administrativa: `9999`.
    *   Acceder al Dashboard para ver estadísticas en tiempo real.
    *   Usar "Control de Asistencia" para ver quiénes han respondido la encuesta (sin ver sus resultados).
    *   Usar "Simular Datos Masivos" para probar la generación de reportes con data ficticia.
    *   Descargar el "Informe Gerencial" para ver el análisis de riesgo por áreas.
    *   Usar "Borrar Todo" para limpiar la base de datos local antes de una aplicación real.

## Requisitos Técnicos

*   Navegador web moderno con soporte para ES6+ y LocalStorage.
*   No requiere instalación de software adicional ni servidores.

## Despliegue y Seguridad (IMPORTANTE)
Para cumplir con la normativa de protección de datos personales (Ley 1581 de 2012) y asegurar la confidencialidad de la información recolectada:

1.  **Cifrado HTTPS (Obligatorio)**:
    *   Al desplegar esta aplicación en un servidor web público (ej: Vercel, Netlify, AWS), **SIEMPRE** se debe configurar un certificado SSL/TLS.
    *   La URL de acceso debe comenzar estrictamente por `https://`.
    *   Esto garantiza que las respuestas viajen encriptadas desde el navegador del usuario hasta el servidor, protegiéndolas de intercepciones.

2.  **Seguridad del Navegador**:
    *   Se recomienda usar navegadores actualizados (Chrome, Edge, Firefox) para garantizar el funcionamiento correcto de las funciones de criptografía (`crypto.randomUUID`) utilizadas para la anonimización.
