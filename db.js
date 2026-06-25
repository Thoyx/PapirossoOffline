// ==========================================
// BASE DE DATOS LOCAL - PAPIROSSO OFFLINE
// Simula PostgreSQL usando localStorage
// ==========================================

class Database {
    constructor() {
        this.initDatabase();
    }

    // Inicializa la base de datos con datos de ejemplo si está vacía
    initDatabase() {
        if (!localStorage.getItem('papirosso_initialized')) {
            console.log('🔧 Inicializando base de datos Papirosso...');
            
            // Tabla persona
            const personas = [
                { curp: 'ROMJ050515HDFRS091', nombre: 'José', apellidos: 'Rodríguez Martínez', correo: 'jose@papirosso.com', rfc: null, telefono: '5512345678' },
                { curp: 'ROJA980315HDFRS081', nombre: 'Alexis', apellidos: 'Rosales Juárez', correo: 'alexis@papirosso.com', rfc: null, telefono: '5587654321' },
                { curp: 'TRAB010101HLINEA01', nombre: 'Venta', apellidos: 'En Línea', correo: 'online@papirosso.com', rfc: null, telefono: null },
                { curp: 'CHOC000101HDFRRR00', nombre: 'Profesor', apellidos: 'Chocolate Admin', correo: 'prof@papirosso.com', rfc: null, telefono: null },
                { curp: 'CHOC000101HDFRRR99', nombre: 'Visitante', apellidos: 'Demo', correo: 'demo@papirosso.com', rfc: null, telefono: null }
            ];
            localStorage.setItem('papirosso_personas', JSON.stringify(personas));

            // Tabla trabajadores
            const trabajadores = [
                { curp: 'ROMJ050515HDFRS091', rol: 'Admin', sueldo: 15000, password: 'admin123' },
                { curp: 'ROJA980315HDFRS081', rol: 'Admin', sueldo: 15000, password: 'admin123' },
                { curp: 'CHOC000101HDFRRR00', rol: 'General', sueldo: 0, password: 'profesor123' },
                { curp: 'CHOC000101HDFRRR99', rol: 'visitante', sueldo: 0, password: 'demo123' }
            ];
            localStorage.setItem('papirosso_trabajadores', JSON.stringify(trabajadores));

            // Tabla cliente
            const clientes = [
                { curp: 'TRAB010101HLINEA01', password: 'cliente123' }
            ];
            localStorage.setItem('papirosso_clientes', JSON.stringify(clientes));

            // Tabla producto
            const productos = [
                { id_producto: 'P-001', nombre: 'Cuaderno Profesional 100 hojas', precio: 45.50, cant_exist: 150, descripcion: 'Cuaderno rayado de alta calidad' },
                { id_producto: 'P-002', nombre: 'Bolígrafo Azul Pilot', precio: 12.00, cant_exist: 300, descripcion: 'Bolígrafo de tinta líquida' },
                { id_producto: 'P-003', nombre: 'Lápiz HB Mirado', precio: 5.50, cant_exist: 500, descripcion: 'Lápiz de grafito' },
                { id_producto: 'P-004', nombre: 'Goma de borrar Staedtler', precio: 8.00, cant_exist: 200, descripcion: 'Goma libre de látex' },
                { id_producto: 'P-005', nombre: 'Regla 30cm transparente', precio: 15.00, cant_exist: 100, descripcion: 'Regla escolar' },
                { id_producto: 'P-006', nombre: 'Tijeras escolares', precio: 25.00, cant_exist: 80, descripcion: 'Tijeras punta roma' },
                { id_producto: 'P-007', nombre: 'Pegamento en barra', precio: 18.50, cant_exist: 120, descripcion: 'Pegamento no tóxico' },
                { id_producto: 'P-008', nombre: 'Carpeta tamaño carta', precio: 35.00, cant_exist: 0, descripcion: 'Carpeta con broche' },
                { id_producto: 'P-009', nombre: 'Marcadores Sharpie (pack 4)', precio: 89.90, cant_exist: 60, descripcion: 'Marcadores permanentes' },
                { id_producto: 'P-010', nombre: 'Resma de hojas blancas', precio: 120.00, cant_exist: 45, descripcion: '500 hojas tamaño carta' }
            ];
            localStorage.setItem('papirosso_productos', JSON.stringify(productos));

            // Tabla ventas (vacía al inicio)
            localStorage.setItem('papirosso_ventas', JSON.stringify([]));

            // Tabla detalle_venta (vacía al inicio)
            localStorage.setItem('papirosso_detalles_venta', JSON.stringify([]));

            // Marcar como inicializada
            localStorage.setItem('papirosso_initialized', 'true');
            console.log('✅ Base de datos inicializada con datos de ejemplo');
        }
    }

    // ==========================================
    // MÉTODOS GENÉRICOS DE BASE DE DATOS
    // ==========================================

    // Obtener todos los registros de una tabla
    getAll(tabla) {
        const data = localStorage.getItem(`papirosso_${tabla}`);
        return data ? JSON.parse(data) : [];
    }

    // Guardar todos los registros de una tabla
    saveAll(tabla, data) {
        localStorage.setItem(`papirosso_${tabla}`, JSON.stringify(data));
    }

    // Buscar un registro por campo único
    findBy(tabla, campo, valor) {
        const data = this.getAll(tabla);
        return data.find(item => item[campo] === valor);
    }

    // Filtrar registros
    filterBy(tabla, campo, valor) {
        const data = this.getAll(tabla);
        return data.filter(item => item[campo] === valor);
    }

    // Insertar un registro
    insert(tabla, registro) {
        const data = this.getAll(tabla);
        data.push(registro);
        this.saveAll(tabla, data);
        return registro;
    }

    // Actualizar un registro
    update(tabla, campoClave, valorClave, camposActualizar) {
        const data = this.getAll(tabla);
        const index = data.findIndex(item => item[campoClave] === valorClave);
        
        if (index !== -1) {
            data[index] = { ...data[index], ...camposActualizar };
            this.saveAll(tabla, data);
            return data[index];
        }
        return null;
    }

    // Eliminar un registro
    delete(tabla, campoClave, valorClave) {
        const data = this.getAll(tabla);
        const filtered = data.filter(item => item[campoClave] !== valorClave);
        this.saveAll(tabla, filtered);
    }

    // ==========================================
    // MÉTODOS ESPECÍFICOS DEL SISTEMA
    // ==========================================

    // LOGIN - Buscar usuario (trabajador o cliente)
    login(curp, password) {
        const curpLimpia = curp.trim().toUpperCase();
        
        // Buscar en trabajadores
        const trabajador = this.findBy('trabajadores', 'curp', curpLimpia);
        if (trabajador && trabajador.password === password) {
            const persona = this.findBy('personas', 'curp', curpLimpia);
            let rolFinal = trabajador.rol;
            
            // Usuarios de prueba con rol restringido
            if (curpLimpia === 'CHOC000101HDFRRR00' || curpLimpia === 'CHOC000101HDFRRR99') {
                rolFinal = 'visitante';
            }
            
            return {
                success: true,
                curp: curpLimpia,
                rol: rolFinal,
                tipo: 'trabajador',
                persona: persona ? { nombre: persona.nombre, apellidos: persona.apellidos } : { nombre: 'Usuario', apellidos: 'Papirosso' },
                redirect: 'panel.html'
            };
        }

        // Buscar en clientes
        const cliente = this.findBy('clientes', 'curp', curpLimpia);
        if (cliente && cliente.password === password) {
            const persona = this.findBy('personas', 'curp', curpLimpia);
            return {
                success: true,
                curp: curpLimpia,
                rol: 'cliente',
                tipo: 'cliente',
                persona: persona ? { nombre: persona.nombre, apellidos: persona.apellidos } : { nombre: 'Cliente', apellidos: 'Papirosso' },
                redirect: 'cliente-publico.html'
            };
        }

        return { success: false, error: 'CURP o contraseña incorrectos' };
    }

    // OBTENER PRODUCTOS
    getProductos(filtro = null) {
        let productos = this.getAll('productos');
        if (filtro) {
            productos = productos.filter(p => 
                p.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
                p.id_producto.toLowerCase().includes(filtro.toLowerCase())
            );
        }
        return productos;
    }

    // CREAR PRODUCTO
    crearProducto(producto) {
        return this.insert('productos', producto);
    }

    // ACTUALIZAR STOCK
    actualizarStock(idProducto, cantidad) {
        const producto = this.findBy('productos', 'id_producto', idProducto);
        if (producto) {
            const nuevoStock = producto.cant_exist + parseInt(cantidad);
            return this.update('productos', 'id_producto', idProducto, { cant_exist: nuevoStock });
        }
        return null;
    }

    // REGISTRAR VENTA
    registrarVenta(ventaData) {
        const ventas = this.getAll('ventas');
        const detalles = this.getAll('detalles_venta');
        
        // Generar folio
        const folioVenta = `#VTA-2026-${Math.floor(Math.random() * 999)}`;
        
        // Determinar trabajador
        const trabajadorFinal = ventaData.curp_trabajador || 'TRAB010101HLINEA01';
        
        // Crear venta
        const nuevaVenta = {
            id_venta: folioVenta,
            fecha: new Date().toISOString(),
            precio_total: parseFloat(ventaData.precio_total),
            curp_cliente: ventaData.curp_cliente,
            curp_trabajador: trabajadorFinal
        };
        
        ventas.push(nuevaVenta);
        this.saveAll('ventas', ventas);
        
        // Procesar detalles
        for (const item of ventaData.detalles) {
            const producto = this.findBy('productos', 'id_producto', item.id_producto);
            
            if (!producto) {
                throw new Error(`Producto ${item.id_producto} no encontrado`);
            }
            
            if (producto.cant_exist < item.cantidad) {
                throw new Error(`Stock insuficiente para ${item.nombre}. Quedan: ${producto.cant_exist}`);
            }
            
            // Actualizar stock
            this.update('productos', 'id_producto', item.id_producto, {
                cant_exist: producto.cant_exist - item.cantidad
            });
            
            // Crear detalle
            const nuevoDetalle = {
                id_venta: folioVenta,
                id_detalle: Math.floor(Math.random() * 1000000),
                id_producto: item.id_producto,
                cantidad: item.cantidad,
                precio_unitario: parseFloat(item.precio)
            };
            
            detalles.push(nuevoDetalle);
        }
        
        this.saveAll('detalles_venta', detalles);
        
        return { id_venta: folioVenta };
    }

    // OBTENER VENTAS POR CLIENTE
    getVentasPorCliente(curp) {
        return this.filterBy('ventas', 'curp_cliente', curp.trim().toUpperCase())
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    }

    // OBTENER DETALLES DE VENTA
    getDetallesVenta(idVenta) {
        return this.filterBy('detalles_venta', 'id_venta', idVenta);
    }

    // OBTENER TODAS LAS VENTAS (REPORTES)
    getAllVentas() {
        return this.getAll('ventas').sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    }

    // OBTENER CLIENTES
    getClientes() {
        const clientes = this.getAll('clientes');
        return clientes.map(c => {
            const persona = this.findBy('personas', 'curp', c.curp);
            return {
                curp: c.curp,
                password: c.password,
                persona: persona ? { nombre: persona.nombre, apellidos: persona.apellidos } : null
            };
        });
    }

    // REGISTRAR NUEVO USUARIO
    registrarUsuario(userData) {
        const curpLimpia = userData.curp.trim().toUpperCase();
        
        // Verificar si la persona ya existe
        let persona = this.findBy('personas', 'curp', curpLimpia);
        
        if (!persona) {
            persona = {
                curp: curpLimpia,
                nombre: userData.nombre,
                apellidos: userData.apellidos,
                correo: userData.correo,
                rfc: null,
                telefono: null
            };
            this.insert('personas', persona);
        }
        
        if (userData.tipo === 'trabajador') {
            // Verificar si ya es trabajador
            const yaEsTrabajador = this.findBy('trabajadores', 'curp', curpLimpia);
            if (yaEsTrabajador) {
                throw new Error('Esta persona ya se encuentra registrada como Trabajador');
            }
            
            this.insert('trabajadores', {
                curp: curpLimpia,
                rol: userData.rol,
                sueldo: parseFloat(userData.sueldo),
                password: userData.password
            });
        } else {
            // Verificar si ya es cliente
            const yaEsCliente = this.findBy('clientes', 'curp', curpLimpia);
            if (yaEsCliente) {
                throw new Error('Esta persona ya se encuentra registrada como Cliente');
            }
            
            this.insert('clientes', {
                curp: curpLimpia,
                password: userData.password
            });
        }
        
        return { success: true, message: `Registro completado exitosamente como ${userData.tipo}` };
    }

    // RESET - Reiniciar base de datos
    reset() {
        localStorage.removeItem('papirosso_initialized');
        localStorage.removeItem('papirosso_personas');
        localStorage.removeItem('papirosso_trabajadores');
        localStorage.removeItem('papirosso_clientes');
        localStorage.removeItem('papirosso_productos');
        localStorage.removeItem('papirosso_ventas');
        localStorage.removeItem('papirosso_detalles_venta');
        this.initDatabase();
    }
}

// Crear instancia global de la base de datos
const db = new Database();
