// ==========================================
// PAPIROSSO OFFLINE - APP PRINCIPAL
// Usa localStorage en lugar de Supabase
// ==========================================

let usuarioActual = null;
let carrito = [];
let totalVentaAnterior = 0;
let clienteSeleccionado = null;
let clientesLocalesPanel = [];
let productosGlobal = [];

// ==========================================
// 2. FUNCIONES DE INTERFAZ (MODALES Y MENÚS)
// ==========================================
function toggleDropdown() {
    const dropdown = document.getElementById('user-dropdown');
    if (dropdown) dropdown.classList.toggle('hidden');
}

function abrirBuscador() {
    const modalBusqueda = document.getElementById('modal-busqueda');
    if (modalBusqueda) {
        modalBusqueda.classList.remove('hidden');
        document.getElementById('search-input').value = '';
        filtrarProductos('');
    }
}

function cerrarBuscador() {
    const modalBusqueda = document.getElementById('modal-busqueda');
    if (modalBusqueda) modalBusqueda.classList.add('hidden');
}

// ==========================================
// 3. LÓGICA DE AUTENTICACIÓN (LOGIN)
// ==========================================
async function ejecutarLogin() {
    const curpInput = document.getElementById('login-curp');
    const passwordInput = document.getElementById('login-password');
    const errorMsg = document.getElementById('login-error');

    const valorCurp = curpInput ? curpInput.value.trim() : '';
    const valorPassword = passwordInput ? passwordInput.value.trim() : '';

    if (!valorCurp || !valorPassword) {
        alert("Por favor, ingresa tu CURP y contraseña.");
        return;
    }

    // Usar la base de datos local
    const resultado = db.login(valorCurp, valorPassword);

    if (!resultado.success) {
        if (errorMsg) {
            errorMsg.innerText = resultado.error || "Error en las credenciales.";
            errorMsg.classList.remove('hidden');
        }
        alert(resultado.error || "Error en las credenciales.");
        return;
    }

    // Guardar sesión
    usuarioActual = resultado;
    if (errorMsg) errorMsg.classList.add('hidden');
    localStorage.setItem('usuario', JSON.stringify(resultado));

    alert(`¡Bienvenido! Has ingresado como: ${resultado.rol}`);

    // Redirección
    if (resultado.redirect) {
        window.location.href = resultado.redirect;
    } else {
        window.location.href = resultado.tipo === 'cliente' ? "cliente-publico.html" : "panel.html";
    }
}

function cerrarSesion() {
    usuarioActual = null;
    localStorage.removeItem('usuario');
    window.location.href = "login.html";
}

// ==========================================
// 4. NAVEGACIÓN, CONTROL DE ROLES Y PESTAÑAS
// ==========================================
function verificarPermisosPanel() {
    const sesion = localStorage.getItem('usuario');

    if (!sesion) {
        alert("No has iniciado sesión. Redirigiendo al login...");
        window.location.href = "login.html";
        return;
    }

    usuarioActual = JSON.parse(sesion);
    const rol = usuarioActual.rol.toLowerCase().trim();

    const nombreCompleto = usuarioActual.persona ? `${usuarioActual.persona.nombre} ${usuarioActual.persona.apellidos}` : "Empleado";
    const userDisplay = document.getElementById('user-display-name');
    if (userDisplay) {
        userDisplay.innerText = `${usuarioActual.rol}: ${nombreCompleto}`;
    }

    // Control de acceso según rol
    if (rol === 'administrador' || rol === 'admin') {
        switchTab('section-ventas', document.getElementById('nav-ventas'));
    } else if (rol === 'cajero') {
        ocultarElemento('nav-productos');
        ocultarElemento('nav-clientes');
        ocultarElemento('nav-text-registro');
        switchTab('section-ventas', document.getElementById('nav-ventas'));
    } else if (rol === 'almacenista') {
        ocultarElemento('nav-ventas');
        ocultarElemento('nav-clientes');
        ocultarElemento('nav-reportes');
        ocultarElemento('nav-text-registro');
        switchTab('section-productos', document.getElementById('nav-productos'));
    } else if (rol === 'visitante') {
        ocultarElemento('nav-text-registro');
        switchTab('section-ventas', document.getElementById('nav-ventas'));
    } else {
        switchTab('section-ventas', document.getElementById('nav-ventas'));
    }
}

function ocultarElemento(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
}

function switchTab(tabId, botonActivado) {
    const rolActual = usuarioActual && usuarioActual.rol ? usuarioActual.rol.toLowerCase().trim() : '';

    // Protección de seguridad
    if (tabId === 'section-reportes' && rolActual !== 'admin' && rolActual !== 'administrador' && rolActual !== 'visitante') {
        alert("Acceso Denegado. Módulo reservado para Administradores.");
        return;
    }
    if (tabId === 'section-registro' && rolActual !== 'admin' && rolActual !== 'administrador') {
        alert("Acceso Denegado. Solo los administradores pueden dar de alta personal.");
        return;
    }
    if (tabId === 'section-ventas' && rolActual === 'almacenista') {
        alert("Los almacenistas no operan la caja de cobro.");
        return;
    }

    // Estilo visual
    document.querySelectorAll('.hero-nav a').forEach(btn => { if (btn) btn.classList.remove('active'); });
    if (botonActivado) botonActivado.classList.add('active');

    const contenidos = document.querySelectorAll('.tab-content');
    contenidos.forEach(c => c.classList.add('hidden'));

    const pestañaActiva = document.getElementById(tabId);
    if (pestañaActiva) pestañaActiva.classList.remove('hidden');

    // Cargar contenido de cada pestaña
    if (tabId === 'section-ventas') {
        const contenedorVentas = document.getElementById('section-ventas');
        contenedorVentas.innerHTML = `
            <h2 class="text-2xl font-extrabold tracking-tight mb-2">🛒 Punto de Venta (Módulo de Cobro)</h2>
            <p class="text-sm text-slate-500 mb-6">Genera un nuevo ticket de compra asociando artículos de la tienda.</p>
            <div class="ventas-view" style="display: grid; grid-template-columns: 1fr 350px; gap: 20px;">
                <div class="ticket-section bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div class="bg-slate-50 p-4 rounded-xl mb-6 flex justify-between items-center border border-slate-200">
                        <div>
                            <small class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cliente asignado:</small>
                            <span id="cliente-info-display" class="font-bold text-slate-800">
                                ${clienteSeleccionado ? clienteSeleccionado : 'Público General'}
                            </span>
                        </div>
                        <button class="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs py-2 px-4 rounded-lg transition" onclick="abrirModalCliente()">
                            🔍 Cambiar Cliente
                        </button>
                    </div>
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="font-bold text-slate-800 text-lg">Artículos en la venta en curso</h3>
                        <button class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-4 rounded-xl transition" onclick="abrirBuscador()">+ Agregar Producto</button>
                    </div>
                    <table class="w-full text-sm text-left border-collapse">
                        <thead class="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                            <tr>
                                <th class="py-3 px-2">Producto</th>
                                <th class="py-3 px-2">Cant.</th>
                                <th class="py-3 px-2">Precio</th>
                                <th class="py-3 px-2">Subtotal</th>
                                <th class="py-3 px-2 text-center">Remover</th>
                            </tr>
                        </thead>
                        <tbody id="ticket-body" class="divide-y divide-slate-100 text-slate-700"></tbody>
                    </table>
                </div>
                <div class="totals-section bg-slate-900 text-white p-6 rounded-2xl flex flex-col justify-between min-height-[280px] shadow-lg">
                    <div class="last-sale text-slate-400 text-xs font-semibold">Última venta procesada: $${totalVentaAnterior.toFixed(2)}</div>
                    <div class="current-total my-6">
                        <label class="block text-[11px] font-bold tracking-widest text-slate-400 uppercase">TOTAL A LIQUIDAR</label>
                        <span id="display-total" class="text-4xl font-black text-emerald-400 block mt-1">$0.00</span>
                    </div>
                    <button class="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 px-4 rounded-xl tracking-wide text-center transition" onclick="registrarVenta()">
                        🎰 REGISTRAR VENTA
                    </button>
                </div>
            </div>
        `;
        actualizarVistaTicket();
    } else if (tabId === 'section-productos') {
        irAProductos();
    } else if (tabId === 'section-clientes') {
        cargarClientesPanel();
    } else if (tabId === 'section-reportes') {
        irAReportes();
    }
}

// ==========================================
// 5. GESTIÓN DE PRODUCTOS E INVENTARIO
// ==========================================
async function irAProductos() {
    const tablaBody = document.getElementById('inventario-tabla-body');
    const productGrid = document.getElementById('product-grid');
    const btnContainer = document.getElementById('btn-nuevo-producto-container');

    const data = db.getProductos();

    // Panel de administración
    if (tablaBody) {
        const rol = usuarioActual ? usuarioActual.rol.toLowerCase() : '';
        const puedeAgregar = (rol === 'admin' || rol === 'administrador' || rol === 'almacenista');

        if (btnContainer) {
            btnContainer.innerHTML = puedeAgregar ? `<button class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition" onclick="abrirModalProducto()">+ Nuevo Producto</button>` : '';
        }

        tablaBody.innerHTML = data.map(p => `
            <tr class="hover:bg-slate-50 transition border-b border-slate-100">
                <td class="px-6 py-4"><span class="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md font-mono font-bold text-xs">${p.id_producto}</span></td>
                <td class="px-6 py-4 font-semibold text-slate-800">${p.nombre}</td>
                <td class="px-6 py-4 font-medium text-slate-600">$${parseFloat(p.precio).toFixed(2)}</td>
                <td class="px-6 py-4"><span class="font-bold ${p.cant_exist <= 5 ? 'text-rose-600 bg-rose-50 px-2 py-0.5 rounded' : 'text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded'}">${p.cant_exist} pzas</span></td>
                <td class="px-6 py-4">
                    <button onclick="reabastecerProducto('${p.id_producto}')" 
                    class="ml-2 px-2 py-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all text-xs font-semibold">
                    Agregar Stock
                    </button>
                </td>
            </tr>`).join('');
    }

    // Tienda pública
    if (productGrid) {
        if (!data || data.length === 0) {
            productGrid.innerHTML = '<p class="text-slate-400 text-center col-span-full">No hay productos disponibles por el momento.</p>';
            return;
        }

        productGrid.innerHTML = data.map(p => {
            const sinStock = p.cant_exist <= 0;
            const nombreSeguro = p.nombre.replace(/'/g, "\\'");

            return `
            <div class="product-card ${sinStock ? 'opacity-60' : ''}" style="background: white; border: 1px solid #e2e8f0; padding: 20px; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); flex-direction: column; display: flex; justify-content: space-between;">
                <div>
                    <span style="font-size: 0.75rem; color: #94a3b8; font-family: monospace; font-weight: bold;">${p.id_producto}</span>
                    <h3 style="margin: 4px 0; font-size: 1.1rem; font-weight: 600; color: #1e293b;">${p.nombre}</h3>
                    <p style="font-size: 1.25rem; font-weight: 800; color: #0f172a; margin: 8px 0;">$${parseFloat(p.precio).toFixed(2)}</p>
                </div>
                <div style="margin-top: 12px;">
                    <p style="font-size: 0.8rem; margin-bottom: 8px; font-weight: 600; color: ${sinStock ? '#ef4444' : '#16a34a'}">
                        ${sinStock ? '❌ Agotado' : `📦 Stock: ${p.cant_exist} pzas`}
                    </p>
                    <button onclick="añadirAlCarritoPublico('${p.id_producto}', '${nombreSeguro}', ${p.precio}, ${p.cant_exist})"
                        ${sinStock ? 'disabled' : ''}
                        class="btn-confirm" 
                        style="width: 100%; padding: 10px; font-size: 0.85rem; cursor: ${sinStock ? 'not-allowed' : 'pointer'}; background: ${sinStock ? '#cbd5e1' : ''}; color: ${sinStock ? '#64748b' : ''}; border: none; border-radius: 8px; font-weight: bold;">
                        ${sinStock ? 'Sin existencias' : '🛒 Añadir al carrito'}
                    </button>
                </div>
            </div>`;
        }).join('');
    }
}

async function filtrarProductos(termino) {
    let data = db.getProductos();

    if (termino) {
        data = data.filter(p => p.nombre.toLowerCase().includes(termino.toLowerCase()));
    }

    const body = document.getElementById('search-results-body');
    if (body) {
        if (data.length === 0) {
            body.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-slate-400">Sin coincidencias en catálogo</td></tr>';
            return;
        }
        body.innerHTML = data.map(p => `
            <tr class="hover:bg-slate-50 border-b border-slate-100 transition">
                <td class="p-3 font-mono text-xs font-bold text-slate-500">${p.id_producto}</td>
                <td class="p-3 font-semibold text-slate-800">${p.nombre}</td>
                <td class="p-3 font-medium text-slate-600">$${parseFloat(p.precio).toFixed(2)}</td>
                <td class="p-3 font-bold ${p.cant_exist <= 5 ? 'text-red-500' : 'text-emerald-600'}">${p.cant_exist}</td>
                <td class="p-3"><button class="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-1.5 px-3 rounded-lg transition" onclick="añadirAlCarrito('${p.id_producto}', '${p.nombre}', ${p.precio}, ${p.cant_exist})">Añadir</button></td>
            </tr>
        `).join('');
    }
}

function abrirModalProducto() {
    document.getElementById('modal-nuevo-producto').classList.remove('hidden');
}

function cerrarModalProducto() {
    document.getElementById('modal-nuevo-producto').classList.add('hidden');
    document.getElementById('reg-nombre').value = '';
    document.getElementById('reg-precio').value = '';
    document.getElementById('reg-stock').value = '';
}

async function guardarProductoBD() {
    const nombre = document.getElementById('reg-nombre').value.trim();
    const precio = parseFloat(document.getElementById('reg-precio').value);
    const stock = parseInt(document.getElementById('reg-stock').value);

    if (!nombre || isNaN(precio) || isNaN(stock)) {
        return alert("Por favor, llena todos los campos correctamente.");
    }

    const idManual = "P-" + Math.floor(Math.random() * 999);

    try {
        db.crearProducto({
            id_producto: idManual,
            nombre: nombre,
            precio: precio,
            cant_exist: stock,
            descripcion: ''
        });

        alert("Producto registrado exitosamente con ID: " + idManual);
        cerrarModalProducto();
        irAProductos();

    } catch (err) {
        alert("Error al guardar: " + err.message);
    }
}

// ==========================================
// 6. LÓGICA DE PUNTO DE VENTA Y CARRITO
// ==========================================
function añadirAlCarrito(id, nombre, precio, stockDisponible) {
    const stockMax = parseInt(stockDisponible);
    if (stockMax <= 0) {
        alert("❌ Este producto no tiene existencias.");
        return;
    }

    const index = carrito.findIndex(item => item.id_producto === id);

    if (index !== -1) {
        if (carrito[index].cantidad + 1 > stockMax) {
            alert("⚠️ No puedes exceder el stock disponible.");
            return;
        }
        carrito[index].cantidad++;
    } else {
        carrito.push({
            id_producto: id,
            nombre: nombre,
            precio: parseFloat(precio),
            cantidad: 1,
            stockMax: stockMax
        });
    }

    const modal = document.getElementById('modal-busqueda');
    if (modal) modal.classList.add('hidden');
    actualizarVistaTicket();
    actualizarInterfazCarritoPublico();
}

function actualizarVistaTicket() {
    const body = document.getElementById('ticket-body');
    const displayTotal = document.getElementById('display-total');

    if (!body) return;

    if (carrito.length === 0) {
        body.innerHTML = '<tr><td colspan="5" class="py-8 text-center text-slate-400 font-medium">🛒 El ticket está vacío.</td></tr>';
        if (displayTotal) displayTotal.innerText = "$0.00";
        return;
    }

    let sumaTotal = 0;
    body.innerHTML = carrito.map((item, idx) => {
        const subtotal = item.precio * item.cantidad;
        sumaTotal += subtotal;
        return `
            <tr class="border-b border-slate-100">
                <td class="py-3 px-2 font-semibold text-slate-800">${item.nombre}</td>
                <td class="py-3 px-2">
                    <div class="flex items-center gap-2">
                        <button onclick="cambiarCantidad(${idx}, -1)" class="bg-slate-100 hover:bg-slate-200 w-6 h-6 rounded font-bold">-</button>
                        <span class="w-4 text-center font-bold">${item.cantidad}</span>
                        <button onclick="cambiarCantidad(${idx}, 1)" class="bg-slate-100 hover:bg-slate-200 w-6 h-6 rounded font-bold">+</button>
                    </div>
                </td>
                <td class="py-3 px-2 text-slate-500">$${parseFloat(item.precio).toFixed(2)}</td>
                <td class="py-3 px-2 font-bold text-slate-800">$${subtotal.toFixed(2)}</td>
                <td class="py-3 px-2 text-center">
                    <button onclick="quitarDelCarrito(${idx})" class="text-rose-500 hover:text-rose-700 font-bold">✖</button>
                </td>
            </tr>
        `;
    }).join('');

    if (displayTotal) displayTotal.innerText = `$${sumaTotal.toFixed(2)}`;
}

function quitarDelCarrito(index) {
    carrito.splice(index, 1);
    actualizarVistaTicket();
    actualizarInterfazCarritoPublico();
}

function cambiarCantidad(idx, delta) {
    if (!carrito[idx]) return;
    const nuevoValor = carrito[idx].cantidad + delta;
    if (nuevoValor <= 0) {
        quitarDelCarrito(idx);
    } else {
        carrito[idx].cantidad = nuevoValor;
        actualizarVistaTicket();
        actualizarInterfazCarritoPublico();
    }
}

async function registrarVenta() {
    if (carrito.length === 0) return alert("El ticket está vacío.");

    // Verificar permisos
    if (usuarioActual) {
        const rol = usuarioActual.rol.toLowerCase().trim();
        if (rol === 'visitante' || rol === 'general') {
            return alert("🚫 Acceso denegado: Tu cuenta tiene un rol de solo lectura.");
        }
    }

    try {
        const totalVenta = parseFloat(document.getElementById('display-total').innerText.replace('$', '').replace(',', ''));

        const detallesFormateados = carrito.map(item => ({
            id_producto: item.id_producto,
            nombre: item.nombre,
            precio: parseFloat(item.precio),
            cantidad: parseInt(item.cantidad)
        }));

        const ventaData = {
            precio_total: totalVenta,
            curp_cliente: clienteSeleccionado,
            curp_trabajador: usuarioActual ? usuarioActual.curp : 'TRAB010101HLINEA01',
            detalles: detallesFormateados
        };

        const resultado = db.registrarVenta(ventaData);

        totalVentaAnterior = totalVenta;
        alert("✅ Venta registrada: " + resultado.id_venta);
        carrito = [];
        actualizarVistaTicket();

        // Recargar productos para actualizar stock
        irAProductos();

    } catch (err) {
        console.error("Error completo:", err);
        alert("No se pudo registrar: " + err.message);
    }
}

async function reabastecerProducto(id_producto) {
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    
    if (!usuario || usuario.rol !== 'Admin') {
        return alert("🚫 Acceso denegado: Solo el Administrador puede reabastecer stock.");
    }

    const cantidad = prompt("¿Cuántas piezas vas a agregar al inventario?");
    if (!cantidad || isNaN(cantidad)) return;

    try {
        db.actualizarStock(id_producto, cantidad);
        alert("Inventario actualizado.");
        irAProductos();
    } catch (err) {
        alert("Error al actualizar: " + err.message);
    }
}

// ==========================================
// 7. HISTORIAL Y REPORTES FINANCIEROS
// ==========================================
async function irAReportes() {
    const tablaBody = document.getElementById('reportes-tabla-body');
    if (!tablaBody) return;

    const rolUsuario = usuarioActual ? usuarioActual.rol : '';

    if (rolUsuario !== 'Admin' && rolUsuario !== 'visitante') {
        tablaBody.innerHTML = '<tr><td colspan="4" class="p-6 text-center text-red-500">No tienes autorización para ver reportes.</td></tr>';
        return;
    }

    try {
        const data = db.getAllVentas();

        if (data.length === 0) {
            tablaBody.innerHTML = '<tr><td colspan="4" class="p-6 text-center text-slate-400 font-medium">No hay ventas registradas.</td></tr>';
            return;
        }

        tablaBody.innerHTML = data.map(v => `
            <tr class="hover:bg-slate-50 border-b border-slate-100 transition">
                <td class="px-6 py-4 font-bold text-blue-600">${v.id_venta}</td>
                <td class="px-6 py-4 text-slate-500">${new Date(v.fecha).toLocaleDateString()}</td>
                <td class="px-6 py-4 font-extrabold text-emerald-600">$${parseFloat(v.precio_total).toFixed(2)}</td>
                <td class="px-6 py-4"><code class="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-mono">${v.curp_trabajador}</code></td>
            </tr>`).join('');
    } catch (e) {
        console.error("Error al cargar reportes", e);
        tablaBody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-red-500">${e.message}</td></tr>`;
    }
}

// ==========================================
// 8. CONTROL DE CLIENTES
// ==========================================
async function abrirModalCliente() {
    document.getElementById('modal-cliente').classList.remove('hidden');
    const clientes = db.getClientes();
    renderizarListaClientesModal(clientes);
}

function renderizarListaClientesModal(clientes) {
    const body = document.getElementById('lista-clientes-body');
    if (!body) return;

    if (!clientes || clientes.length === 0) {
        body.innerHTML = '<tr><td colspan="3" class="p-4 text-center text-slate-400">No hay clientes dados de alta</td></tr>';
        return;
    }

    body.innerHTML = clientes.map(c => {
        const nombreDisplay = c.persona ? `${c.persona.nombre} ${c.persona.apellidos}` : "Sin nombre";
        return `
            <tr class="border-b border-slate-100 hover:bg-slate-50 transition">
                <td class="p-3 font-semibold text-slate-800">${nombreDisplay}</td>
                <td class="p-3 font-mono text-xs text-slate-500">${c.curp}</td>
                <td class="p-3 text-right"><button class="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-1.5 px-3 rounded-lg transition" onclick="fijarCliente('${c.curp}', '${c.persona?.nombre || 'Cliente'}')">Elegir</button></td>
            </tr>
        `;
    }).join('');
}

function fijarCliente(curp, nombre) {
    clienteSeleccionado = curp;
    const infoDisplay = document.getElementById('cliente-info-display');
    if (infoDisplay) infoDisplay.innerText = `Cliente: ${nombre} (${curp})`;
    cerrarModalCliente();
}

function seleccionarClienteNull() {
    clienteSeleccionado = null;
    const infoDisplay = document.getElementById('cliente-info-display');
    if (infoDisplay) infoDisplay.innerText = "Público General";
    cerrarModalCliente();
}

function cerrarModalCliente() {
    document.getElementById('modal-cliente').classList.add('hidden');
}

async function filtrarClientes(termino) {
    const todosLosClientes = db.getClientes();

    if (!termino.trim()) {
        renderizarListaClientesModal(todosLosClientes);
        return;
    }

    const busqueda = termino.toLowerCase();
    const clientesFiltrados = todosLosClientes.filter(c => {
        const nombre = (c.persona?.nombre || "").toLowerCase();
        const apellidos = (c.persona?.apellidos || "").toLowerCase();
        const curp = (c.curp || "").toLowerCase();
        return nombre.includes(busqueda) || apellidos.includes(busqueda) || curp.includes(busqueda);
    });

    renderizarListaClientesModal(clientesFiltrados);
}

async function cargarClientesPanel() {
    const tablaBody = document.getElementById('clientes-tabla-body');
    if (!tablaBody) return;

    try {
        clientesLocalesPanel = db.getClientes();
        renderizarClientesEnPanel(clientesLocalesPanel);
    } catch (e) {
        console.error("Error cargando clientes del panel", e);
        tablaBody.innerHTML = '<tr><td colspan="3" class="p-4 text-center text-red-500">Error al consultar el directorio de clientes.</td></tr>';
    }
}

function renderizarClientesEnPanel(lista) {
    const tablaBody = document.getElementById('clientes-tabla-body');
    if (!tablaBody) return;

    if (!lista || lista.length === 0) {
        tablaBody.innerHTML = '<tr><td colspan="3" style="padding:20px; text-align:center;" class="text-slate-400">No se encontraron clientes registrados</td></tr>';
        return;
    }
    tablaBody.innerHTML = lista.map(c => `
        <tr class="border-b border-slate-100 hover:bg-slate-50 transition">
            <td class="px-6 py-4 font-semibold text-slate-800">${c.persona ? c.persona.nombre + ' ' + c.persona.apellidos : 'Sin Nombre'}</td>
            <td class="px-6 py-4"><code class="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-mono">${c.curp}</code></td>
            <td class="px-6 py-4 text-slate-500 font-mono text-sm">${c.password || '—'}</td>
        </tr>`).join('');
}

function filtrarClientesPanel(termino) {
    const busqueda = termino.toLowerCase().trim();
    const filtrados = clientesLocalesPanel.filter(c => {
        const nombreStr = c.persona ? `${c.persona.nombre} ${c.persona.apellidos}`.toLowerCase() : '';
        return nombreStr.includes(busqueda) || c.curp.toLowerCase().includes(busqueda);
    });
    renderizarClientesEnPanel(filtrados);
}

// ==========================================
// 9. FORMULARIO DE ALTA
// ==========================================
function toggleCamposRegistro() {
    const tipo = document.getElementById('alta-tipo').value;
    const camposTrabajador = document.getElementById('campos-trabajador');

    document.getElementById('alta-password').required = true;

    if (tipo === 'trabajador') {
        camposTrabajador.classList.remove('hidden');
        document.getElementById('alta-rol').required = true;
        document.getElementById('alta-sueldo').required = true;
    } else {
        camposTrabajador.classList.add('hidden');
        document.getElementById('alta-rol').required = false;
        document.getElementById('alta-sueldo').required = false;
    }
}

async function guardarNuevoUsuario(event) {
    event.preventDefault();

    const tipo = document.getElementById('alta-tipo').value;
    const curp = document.getElementById('alta-curp').value.trim().toUpperCase();
    const nombre = document.getElementById('alta-nombre').value.trim();
    const apellidos = document.getElementById('alta-apellidos').value.trim();
    const password = document.getElementById('alta-password').value;
    const correo = document.getElementById('alta-correo').value.trim();

    if (curp.length !== 18) {
        return alert("La CURP debe tener exactamente 18 caracteres.");
    }

    const payload = {
        tipo: tipo,
        curp: curp,
        nombre: nombre,
        apellidos: apellidos,
        password: password,
        correo: correo
    };

    if (tipo === 'trabajador') {
        payload.rol = document.getElementById('alta-rol').value;
        payload.sueldo = parseFloat(document.getElementById('alta-sueldo').value);
    }

    try {
        const resultado = db.registrarUsuario(payload);
        alert(`¡Éxito! Nuevo ${tipo} registrado correctamente.`);
        document.getElementById('form-alta-usuario').reset();
        toggleCamposRegistro();
    } catch (err) {
        alert("No se pudo registrar: " + err.message);
    }
}

// ==========================================
// 10. TIENDA PÚBLICA
// ==========================================
function verificarSesionPublica() {
    const sesion = localStorage.getItem('usuario');
    const loginLink = document.getElementById('nav-login-text');
    const userDisplay = document.getElementById('nav-user-curp');
    const btnSalir = document.getElementById('btn-cerrar-sesion-publico');
    const checkoutBtn = document.getElementById('checkout-button');

    if (sesion) {
        const usuario = JSON.parse(sesion);

        if (loginLink) loginLink.classList.add('hidden');
        if (userDisplay) {
            userDisplay.innerText = `👤 ${usuario.curp}`;
            userDisplay.classList.remove('hidden');
        }
        if (btnSalir) btnSalir.classList.remove('hidden');
    }

    if (checkoutBtn) {
        checkoutBtn.onclick = function () {
            const sesionActiva = localStorage.getItem('usuario');
            if (!sesionActiva) {
                alert("🚫 Acción denegada: Debes iniciar sesión con tu CURP para poder finalizar una compra.");
                window.location.href = "login.html";
            } else {
                procesarCompraPublica();
            }
        };
    }
}

async function procesarCompraPublica() {
    const sesion = localStorage.getItem('usuario');
    if (!sesion) return;

    const usuarioCliente = JSON.parse(sesion);

    // Candado de solo lectura
    if (usuarioCliente.curp === 'CHOC000101HDFRRR99') {
        alert("🚫 Modo Demostración: Este usuario solo tiene permisos de LECTURA.");
        return;
    }

    if (carrito.length === 0) return alert("El carrito está vacío.");

    try {
        const detallesFormateados = carrito.map(item => ({
            id_producto: item.id_producto,
            nombre: item.nombre,
            precio: parseFloat(item.precio),
            cantidad: parseInt(item.cantidad)
        }));

        const totalTexto = document.getElementById('cart-total').innerText;
        const totalVenta = parseFloat(totalTexto.replace('$', '').replace('Total: ', '').trim());

        const ventaData = {
            precio_total: totalVenta,
            curp_cliente: usuarioCliente.curp,
            curp_trabajador: null,
            detalles: detallesFormateados
        };

        const resultado = db.registrarVenta(ventaData);

        alert("🛒 ¡Compra en línea registrada con éxito! Folio: " + resultado.id_venta);

        carrito = [];
        const cartItemsContainer = document.getElementById('cart-items');
        if (cartItemsContainer) cartItemsContainer.innerHTML = "Tu carrito está vacío";

        const cartTotalContainer = document.getElementById('cart-total');
        if (cartTotalContainer) cartTotalContainer.innerText = "$0.00";

        irAProductos();

        setTimeout(async () => {
            await cargarHistorialComprasPublico();
            const listaCards = document.getElementById('compras-cliente-lista-cards');
            if (listaCards) {
                const primerBoton = listaCards.querySelector('button');
                if (primerBoton) primerBoton.click();
            }
        }, 500);

    } catch (err) {
        alert("No se pudo procesar la compra: " + err.message);
    }
}

async function cargarHistorialComprasPublico() {
    const listaCards = document.getElementById('compras-cliente-lista-cards');
    if (!listaCards) return;

    const curpElement = document.getElementById('nav-user-curp');
    let rawCurp = (usuarioActual && usuarioActual.curp) ? usuarioActual.curp : (curpElement ? curpElement.innerText : "");
    let rawCurpLimpio = rawCurp.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

    if (!rawCurpLimpio || rawCurpLimpio === "INVITADO") {
        listaCards.innerHTML = '<p>Inicia sesión para ver tus compras.</p>';
        return;
    }

    try {
        const ventas = db.getVentasPorCliente(rawCurpLimpio);

        if (!ventas || ventas.length === 0) {
            listaCards.innerHTML = '<p>No tienes compras registradas.</p>';
            return;
        }

        listaCards.innerHTML = ventas.map(v => {
            const totalNumero = Number(v.precio_total);
            return `
                <button onclick="verDetalleCompraPublica('${encodeURIComponent(v.id_venta)}')" 
                    style="width: 100%; text-align: left; padding: 12px; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 8px; cursor: pointer;">
                    <div style="font-weight: 800;">Folio: ${v.id_venta}</div>
                    <div style="font-size: 0.75rem; color: #64748b; font-weight: bold;">$${totalNumero.toFixed(2)}</div>
                </button>
            `;
        }).join('');

    } catch (e) {
        console.error("Error al cargar:", e);
        listaCards.innerHTML = '<p style="color:red;">Error al cargar historial.</p>';
    }
}

async function verDetalleCompraPublica(idVentaCodificado) {
    const bodyDetalle = document.getElementById('panel-detalle-productos-body');
    const totalGrisDisplay = document.getElementById('panel-detalle-total');

    try {
        const idVenta = decodeURIComponent(idVentaCodificado);
        const detalles = db.getDetallesVenta(idVenta);

        let sumaTotalAcumulada = 0;

        bodyDetalle.innerHTML = detalles.map(d => {
            const prod = productosGlobal.find(p => p.id_producto === d.id_producto);
            const nombreMostrar = prod ? prod.nombre : d.id_producto;

            const precioUnitario = prod ? parseFloat(prod.precio || 0) : parseFloat(d.precio_unitario || d.precio || 0);
            const cantidad = parseInt(d.cantidad || 0);
            const subtotalReal = precioUnitario * cantidad;

            sumaTotalAcumulada += subtotalReal;

            return `
                <tr>
                    <td style="padding: 6px 8px;">${nombreMostrar}</td>
                    <td style="padding: 6px 8px; text-align: center;">${cantidad}</td>
                    <td style="padding: 6px 8px; text-align: right;">$${subtotalReal.toFixed(2)}</td>
                </tr>
            `;
        }).join('');

        if (totalGrisDisplay) {
            totalGrisDisplay.innerHTML = `$${sumaTotalAcumulada.toFixed(2)}`;
        }

    } catch (e) {
        console.error(e);
        alert("No se pudo cargar el detalle.");
    }
}

async function cargarProductosGlobal() {
    productosGlobal = db.getProductos();
}

// ==========================================
// 11. INTERFAZ CARRITO PÚBLICO
// ==========================================
function añadirAlCarritoPublico(id, nombre, precio, stock) {
    añadirAlCarrito(id, nombre, precio, stock);
    actualizarInterfazCarritoPublico();
}

function actualizarInterfazCarritoPublico() {
    const contenedor = document.getElementById('cart-items');
    const displayTotal = document.getElementById('cart-total');

    if (!contenedor) return;

    if (carrito.length === 0) {
        contenedor.innerHTML = '<p style="color: #94a3b8; text-align: center; margin-top: 20px;">Tu carrito está vacío</p>';
        if (displayTotal) displayTotal.innerText = "$0.00";
        return;
    }

    let total = 0;
    contenedor.innerHTML = carrito.map((item, index) => {
        total += (item.precio * item.cantidad);
        return `
            <div style="display: flex; align-items: center; justify-content: space-between; background: #ffffff; padding: 12px; border-radius: 12px; margin-bottom: 10px; border: 1px solid #e2e8f0; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                <div style="flex: 1;">
                    <div style="font-weight: 700; font-size: 0.9rem; color: #1e293b;">${item.nombre}</div>
                    <div style="font-size: 0.8rem; color: #64748b;">$${item.precio} c/u</div>
                </div>
                
                <div style="display: flex; align-items: center; gap: 8px; background: #f8fafc; padding: 4px; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <button onclick="cambiarCantidadCarritoPublico(${index}, -1)" style="border: none; background: white; width: 24px; height: 24px; border-radius: 6px; cursor: pointer; font-weight: bold; color: #475569; box-shadow: 0 1px 1px rgba(0,0,0,0.1);">-</button>
                    
                    <span style="font-weight: 800; font-size: 0.9rem; min-width: 24px; text-align: center; color: #0f172a;">
                        ${item.cantidad}
                    </span>
                    
                    <button onclick="cambiarCantidadCarritoPublico(${index}, 1)" style="border: none; background: white; width: 24px; height: 24px; border-radius: 6px; cursor: pointer; font-weight: bold; color: #475569; box-shadow: 0 1px 1px rgba(0,0,0,0.1);">+</button>
                </div>
                
                <button onclick="quitarProductoPublico(${index})" style="margin-left: 10px; color: #ef4444; cursor: pointer; border:none; background:none; font-size: 0.8rem;">✖</button>
            </div>
        `;
    }).join('');

    if (displayTotal) displayTotal.innerText = `$${total.toFixed(2)}`;
}

function cambiarCantidadCarritoPublico(index, delta) {
    const item = carrito[index];
    if (!item) return;

    const nuevaCantidad = item.cantidad + delta;

    if (nuevaCantidad <= 0) {
        carrito.splice(index, 1);
    } else {
        if (item.stockMax && nuevaCantidad > item.stockMax) {
            alert("No hay más existencias disponibles.");
            return;
        }
        carrito[index].cantidad = nuevaCantidad;
    }

    actualizarInterfazCarritoPublico();
}

function quitarProductoPublico(index) {
    carrito.splice(index, 1);
    actualizarInterfazCarritoPublico();
}

// ==========================================
// 12. EASTER EGG - SANS
// ==========================================
const musicaSans = new Audio('musicaeaster/toby fox - UNDERTALE Soundtrack - 72 Song That Might Play When You Fight Sans.mp3');
musicaSans.loop = true;

// ==========================================
// 13. INICIALIZACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Cargar productos global
    cargarProductosGlobal();

    // Verificar sesión pública
    if (typeof verificarSesionPublica === 'function') verificarSesionPublica();
    if (typeof cargarHistorialComprasPublico === 'function') cargarHistorialComprasPublico();

    // Buscador de productos
    const publicSearchInput = document.getElementById('public-search');
    if (publicSearchInput) {
        publicSearchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            const tarjetas = document.querySelectorAll('#product-grid > div');

            tarjetas.forEach(tarjeta => {
                const nombreProducto = tarjeta.querySelector('h3').textContent.toLowerCase();
                const idProducto = tarjeta.querySelector('span').textContent.toLowerCase();

                if (nombreProducto.includes(query) || idProducto.includes(query)) {
                    tarjeta.style.display = 'flex';
                } else {
                    tarjeta.style.display = 'none';
                }
            });
        });
    }

    // Easter egg
    const buscadorPublico = document.getElementById('public-search');
    const easterEggBtn = document.getElementById('easter-egg-trigger');
    const modalSans = document.getElementById('easter-egg-modal');
    const btnCerrarSans = document.getElementById('close-easter-egg');

    if (buscadorPublico) {
        buscadorPublico.addEventListener('input', (e) => {
            const texto = e.target.value.toLowerCase().trim();

            if (texto === 'mortadela') {
                if (easterEggBtn) easterEggBtn.classList.remove('hidden');
            } else {
                if (easterEggBtn) easterEggBtn.classList.add('hidden');
                if (modalSans) modalSans.classList.add('hidden');
                musicaSans.pause();
                musicaSans.currentTime = 0;
            }
        });
    }

    if (easterEggBtn) {
        easterEggBtn.addEventListener('click', () => {
            if (modalSans) modalSans.classList.remove('hidden');
            musicaSans.play().catch(error => console.log("Audio bloqueado:", error));
        });
    }

    if (btnCerrarSans) {
        btnCerrarSans.addEventListener('click', () => {
            if (modalSans) modalSans.classList.add('hidden');
            musicaSans.pause();
            musicaSans.currentTime = 0;
        });
    }
});
