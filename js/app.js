document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'https://raw.githubusercontent.com/Demuch31/jjba-stands-api/0.0.1/stands-api.json';
    const IMG_BASE_URL = 'https://raw.githubusercontent.com/Demuch31/jjba-stands-api/0.0.1/';

    const searchForm = document.getElementById('searchForm');
    const standInput = document.getElementById('standInput');
    const btnRandom = document.getElementById('btnRandom');
    const tagButtons = document.querySelectorAll('.tag-btn');

    const statusBar = document.getElementById('statusBar');
    const statusBadge = document.getElementById('statusBadge');
    const statusTime = document.getElementById('statusTime');
    const statusMessage = document.getElementById('statusMessage');
    const standResult = document.getElementById('standResult');

    const catalogGrid = document.getElementById('catalogGrid');
    const totalStandsCount = document.getElementById('totalStandsCount');
    const filterText = document.getElementById('filterText');
    const filterPower = document.getElementById('filterPower');
    const filterType = document.getElementById('filterType');

    let standsList = [];

    const gradeWidths = {
        A: 100,
        B: 80,
        C: 60,
        D: 40,
        E: 20
    };

    // Mensajes personalizados según el código de error de la petición
    const httpErrorMessages = {
        400: {
            title: 'Consulta no válida (Código 400)',
            detail: 'Debes escribir el nombre de un Stand, el nombre de su usuario o un número de registro válido.'
        },
        401: {
            title: 'Acceso no autorizado (Código 401)',
            detail: 'No se tienen permisos para consultar este recurso en el servidor.'
        },
        403: {
            title: 'Consulta restringida (Código 403)',
            detail: 'El servidor rechazó el acceso al recurso solicitado.'
        },
        404: {
            title: 'Stand no encontrado (Código 404)',
            detail: 'No existe un Stand con ese nombre, usuario o identificador en los registros.'
        },
        408: {
            title: 'Tiempo de espera agotado (Código 408)',
            detail: 'La petición tardó demasiado tiempo en responder. Intenta buscar nuevamente.'
        },
        429: {
            title: 'Límite de peticiones excedido (Código 429)',
            detail: 'Has realizado demasiadas consultas en poco tiempo. Espera unos segundos e intenta de nuevo.'
        },
        500: {
            title: 'Error interno del servidor (Código 500)',
            detail: 'El servicio de datos de Stands tuvo un problema interno al procesar la solicitud.'
        },
        503: {
            title: 'Servicio no disponible (Código 503)',
            detail: 'El servidor de la API se encuentra en mantenimiento o fuera de línea temporalmente.'
        }
    };

    // Eventos del buscador
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        buscarStand(standInput.value);
    });

    btnRandom.addEventListener('click', () => {
        if (standsList.length === 0) return;
        const randomItem = standsList[Math.floor(Math.random() * standsList.length)];
        standInput.value = randomItem.name;
        buscarStand(randomItem.name);
    });

    tagButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const query = btn.getAttribute('data-query');
            standInput.value = query;
            buscarStand(query);
        });
    });

    // Función principal de consulta a la API
    async function buscarStand(rawQuery) {
        const query = (rawQuery || '').trim();

        // Validación de entrada vacía o inválida (Error 400)
        if (!query) {
            actualizarEstado(400, 0, 'Consulta vacía');
            mostrarError(400);
            return;
        }

        standResult.innerHTML = '<div class="loading-box">Consultando datos del Stand...</div>';
        const inicio = performance.now();

        try {
            const response = await fetch(API_URL);
            const duracion = Math.round(performance.now() - inicio);

            if (!response.ok) {
                actualizarEstado(response.status, duracion, 'Error en la respuesta del servidor');
                mostrarError(response.status);
                return;
            }

            const data = await response.json();
            standsList = Array.isArray(data) ? data : [];

            const termino = query.toLowerCase();
            const standEncontrado = standsList.find(item =>
                String(item.id) === termino ||
                item.name.toLowerCase().includes(termino) ||
                item.user.toLowerCase().includes(termino)
            );

            // Si no existe coincidencia, tratamos la respuesta como un 404 de recurso inexistente
            if (!standEncontrado) {
                actualizarEstado(404, duracion, `Sin coincidencias para "${query}"`);
                mostrarError(404, `No existe un Stand ni usuario registrado bajo el nombre "${query}". Verifica cómo está escrito o prueba desde el catálogo inferior.`);
                return;
            }

            actualizarEstado(200, duracion, `Stand localizado: ${standEncontrado.name}`);
            renderizarFichaStand(standEncontrado);

        } catch (err) {
            const duracion = Math.round(performance.now() - inicio);
            actualizarEstado('RED', duracion, 'Fallo de conexión con la API');
            mostrarError('NETWORK');
        }
    }

    function actualizarEstado(codigo, ms, mensaje) {
        statusBar.classList.remove('hidden');
        statusBadge.textContent = codigo;
        statusTime.textContent = `${ms} ms`;
        statusMessage.textContent = mensaje;

        if (codigo === 200) {
            statusBadge.className = 'status-badge badge-ok';
        } else if (codigo === 400) {
            statusBadge.className = 'status-badge badge-warn';
        } else {
            statusBadge.className = 'status-badge badge-error';
        }
    }

    function mostrarError(codigo, detallePersonalizado) {
        if (codigo === 'NETWORK') {
            standResult.innerHTML = `
                <div class="error-box">
                    <h3>No se pudo conectar con el servidor</h3>
                    <p>La petición a la API falló por un problema de red o falta de conexión a internet.</p>
                    <span class="error-code-tag">Estado: Error de conexión</span>
                </div>
            `;
            return;
        }

        const infoError = httpErrorMessages[codigo] || {
            title: `Error en la petición (Código ${codigo})`,
            detail: 'Ocurrió un inconveniente inesperado al consultar la información del Stand.'
        };

        standResult.innerHTML = `
            <div class="error-box">
                <h3>${infoError.title}</h3>
                <p>${detallePersonalizado || infoError.detail}</p>
                <span class="error-code-tag">Código HTTP: ${codigo}</span>
            </div>
        `;
    }

    function renderizarFichaStand(stand) {
        const imgUrl = `${IMG_BASE_URL}${stand.image}`;
        const partes = (stand.part || []).map(p => `<span class="meta-chip">${p}</span>`).join('');
        const tipos = (stand.type || []).map(t => `<span class="meta-chip">${t}</span>`).join('');

        const etiquetasStats = {
            'destructive-power': 'Poder destructivo',
            'speed': 'Velocidad',
            'range': 'Rango',
            'stamina': 'Persistencia',
            'precision': 'Precisión',
            'potential': 'Potencial'
        };

        const statsHtml = Object.entries(etiquetasStats).map(([clave, nombre]) => {
            const rango = (stand.stats?.[clave] || 'C').toUpperCase();
            const porcentaje = gradeWidths[rango] || 50;
            return `
                <div class="stat-card">
                    <div class="stat-head">
                        <span>${nombre}</span>
                        <span class="stat-grade grade-${rango}">${rango}</span>
                    </div>
                    <div class="bar-track">
                        <div class="bar-fill" style="width: ${porcentaje}%"></div>
                    </div>
                </div>
            `;
        }).join('');

        const listaHabilidades = [
            ...(stand.abilities || []).map(a => ({ titulo: a.name, desc: a.description })),
            ...(stand.techniques || []).map(t => ({ titulo: `Técnica: ${t.name}`, desc: t.description }))
        ];

        const habilidadesHtml = listaHabilidades.map(item => `
            <div class="ability-item">
                <h4>${item.titulo}</h4>
                <p>${item.desc}</p>
            </div>
        `).join('');

        const referencia = stand.namesake
            ? `Referencia (${stand.namesake.type}): ${stand.namesake.reference}`
            : 'Sin referencia registrada';

        standResult.innerHTML = `
            <article class="stand-detail">
                <div class="stand-image-col">
                    <img src="${imgUrl}" alt="${stand.name}">
                    <div class="stand-ref">${referencia}</div>
                </div>
                <div class="stand-info-col">
                    <div class="stand-header">
                        <div>
                            <span class="stand-title">${stand.name}</span>
                            <span class="stand-id">#${String(stand.id).padStart(2, '0')}</span>
                        </div>
                        <span class="stand-user">Usuario: ${stand.user}</span>
                    </div>

                    <div class="meta-row">
                        ${partes}
                        ${tipos}
                    </div>

                    <div class="stats-grid">
                        ${statsHtml}
                    </div>

                    <div class="abilities-grid">
                        ${habilidadesHtml}
                    </div>
                </div>
            </article>
        `;
    }

    // Carga y filtrado del catálogo inferior
    async function cargarCatalogo() {
        try {
            const res = await fetch(API_URL);
            if (!res.ok) {
                throw new Error(`Código ${res.status}`);
            }
            standsList = await res.json();
            renderizarCatalogo();
        } catch (err) {
            catalogGrid.innerHTML = `
                <div class="error-box" style="grid-column: 1 / -1;">
                    <h3>No se pudo cargar el catálogo de Stands</h3>
                    <p>Verifica tu conexión a internet o el estado del servidor (${err.message}).</p>
                </div>
            `;
        }
    }

    function renderizarCatalogo() {
        const texto = filterText.value.trim().toLowerCase();
        const poder = filterPower.value;
        const tipo = filterType.value;

        const filtrados = standsList.filter(stand => {
            const coincideTexto = !texto ||
                stand.name.toLowerCase().includes(texto) ||
                stand.user.toLowerCase().includes(texto);

            const coincidePoder = poder === 'ALL' ||
                (stand.stats?.['destructive-power'] || '').toUpperCase() === poder;

            const coincideTipo = tipo === 'ALL' ||
                (stand.type || []).some(t => t.toLowerCase() === tipo.toLowerCase());

            return coincideTexto && coincidePoder && coincideTipo;
        });

        totalStandsCount.textContent = `${filtrados.length} de ${standsList.length} registros`;

        if (filtrados.length === 0) {
            catalogGrid.innerHTML = '<div class="empty-msg" style="grid-column: 1 / -1;">No existe ningún Stand que coincida con los filtros seleccionados.</div>';
            return;
        }

        catalogGrid.innerHTML = filtrados.map(stand => {
            const pwr = (stand.stats?.['destructive-power'] || 'C').toUpperCase();
            const spd = (stand.stats?.['speed'] || 'C').toUpperCase();
            return `
                <div class="catalog-card" data-name="${stand.name.replace(/"/g, '&quot;')}">
                    <img src="${IMG_BASE_URL}${stand.image}" alt="${stand.name}" loading="lazy">
                    <h3>${stand.name}</h3>
                    <span class="catalog-user">${stand.user}</span>
                    <div class="catalog-stats">
                        <span>Poder: <strong class="grade-${pwr}">${pwr}</strong></span>
                        <span>Velocidad: <strong class="grade-${spd}">${spd}</strong></span>
                    </div>
                </div>
            `;
        }).join('');

        catalogGrid.querySelectorAll('.catalog-card').forEach(card => {
            card.addEventListener('click', () => {
                const nombre = card.getAttribute('data-name');
                standInput.value = nombre;
                buscarStand(nombre);
                document.getElementById('buscador').scrollIntoView({ behavior: 'smooth' });
            });
        });
    }

    filterText.addEventListener('input', renderizarCatalogo);
    filterPower.addEventListener('change', renderizarCatalogo);
    filterType.addEventListener('change', renderizarCatalogo);

    // Carga inicial
    buscarStand('Star Platinum');
    cargarCatalogo();
});
