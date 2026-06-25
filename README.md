# 🚀 PAPIROSSO OFFLINE - Versión Estática

## ✅ ¡Listo! Tu página web ahora es 100% estática

### ¿Qué cambió?
- ❌ **Eliminado**: Servidor backend en Render (Node.js + Express)
- ❌ **Eliminado**: Base de datos Supabase (PostgreSQL)
- ✅ **Agregado**: Base de datos local usando `localStorage` del navegador
- ✅ **Resultado**: Página web completamente estática que funciona en GitHub Pages sin servidor

---

## 🎯 Cómo funciona ahora

### Base de Datos Local (localStorage)
Todos los datos se guardan directamente en el navegador del usuario:
- **Productos**: Se almacenan en `localStorage`
- **Clientes y Trabajadores**: Se almacenan en `localStorage`
- **Ventas**: Se almacenan en `localStorage`
- **Sesión de usuario**: Se mantiene con `localStorage`

### ⚠️ Importante
Los datos son **locales a cada navegador/dispositivo**. Esto significa:
- Si registras un producto en tu computadora, NO aparecerá en otra computadora
- Las ventas realizadas en un dispositivo no se ven en otros
- Cada navegador tiene su propia "base de datos" independiente

**Para un proyecto escolar/demostración, esto es perfecto.**

---

## 🔐 Usuarios de prueba (precargados)

### 👁️ Visitante (solo lectura)
| CURP | Contraseña |
|------|------------|
| `CHOC000101HDFRRR00` | `profesor123` |
| `CHOC000101HDFRRR99` | `demo123` |

### 🛍️ Cliente (tienda pública)
| CURP | Contraseña |
|------|------------|
| `TRAB010101HLINEA01` | `cliente123` |

---

## 📦 Productos de ejemplo (precargados)

La base de datos ya viene con 10 productos de ejemplo:
1. Cuaderno Profesional 100 hojas - $45.50 (150 pzas)
2. Bolígrafo Azul Pilot - $12.00 (300 pzas)
3. Lápiz HB Mirado - $5.50 (500 pzas)
4. Goma de borrar Staedtler - $8.00 (200 pzas)
5. Regla 30cm transparente - $15.00 (100 pzas)
6. Tijeras escolares - $25.00 (80 pzas)
7. Pegamento en barra - $18.50 (120 pzas)
8. Carpeta tamaño carta - $35.00 (0 pzas - Agotado)
9. Marcadores Sharpie (pack 4) - $89.90 (60 pzas)
10. Resma de hojas blancas - $120.00 (45 pzas)

---

## 🛠️ Estructura de archivos

```
PapirossoOffline-main/
├── db.js                      ← 🆕 Base de datos local (localStorage)
├── legacy-app.js              ← 🔄 Actualizado para usar db.js
├── index.html                 ← Página de inicio
├── login.html                 ← Página de login
├── panel.html                 ← Panel de administración
├── cliente-publico.html       ← Tienda pública
├── style.css                  ← Estilos
├── index.js                   ← ⚠️ Ya no se usa (puedes eliminarlo)
├── package.json               ← ⚠️ Ya no se usa (puedes eliminarlo)
├── respaldo.sql               ← ⚠️ Respaldo de Supabase (solo referencia)
└── README.md                  ← Este archivo
```

---

## 🚀 Cómo desplegar en GitHub Pages

1. **Sube todos los archivos a tu repositorio de GitHub**
2. **Ve a Settings → Pages**
3. **Selecciona la rama `main` y carpeta `/root`**
4. **Guarda los cambios**
5. **Tu página estará disponible en**: `https://tu-usuario.github.io/PapirossoOffline/`

**¡No necesitas servidor en Render!** Todo funciona directamente desde GitHub Pages.

---

## 🔄 Reiniciar la base de datos

Si quieres borrar todos los datos y volver al estado inicial:

Abre la consola del navegador (F12) y ejecuta:
```javascript
db.reset();
location.reload();
```

---

## 📝 Notas técnicas

### Archivos que ya no necesitas
- `index.js` - Servidor Express (ya no se usa)
- `package.json` - Dependencias de Node.js (ya no se usa)
- `.env` - Variables de entorno de Supabase (ya no se usa)

### Archivos nuevos/modificados
- `db.js` - Clase Database que maneja localStorage
- `legacy-app.js` - Reescrito para usar `db` en lugar de `fetch` a la API

### Compatibilidad
- ✅ Funciona en todos los navegadores modernos
- ✅ No requiere servidor backend
- ✅ Funciona 100% offline (una vez cargado)
- ✅ Despliegue directo en GitHub Pages

---

## 🎓 Para tu presentación

### Ventajas de esta versión:
1. **Sin costos de hosting** - No necesitas Render ni Supabase
2. **Sin tiempo de inactividad** - No se "duerme" el servidor
3. **Más rápido** - No hay latencia de red para consultas
4. **Más simple** - Menos componentes que mantener
5. **100% estático** - Perfecto para GitHub Pages

### Limitaciones:
1. **Datos locales** - Cada navegador tiene su propia base de datos
2. **No hay sincronización** - Los datos no se comparten entre dispositivos
3. **Persistencia limitada** - Si el usuario borra el caché del navegador, se pierden los datos

**Para un proyecto escolar, estas limitaciones son aceptables y la ventaja de tener algo que "simplemente funciona" es enorme.**

---

## 🐛 Solución de problemas

### "No puedo iniciar sesión"
- Asegúrate de usar las CURPs exactas (mayúsculas, sin espacios)
- Verifica que `db.js` se cargue antes que `legacy-app.js` en los HTML

### "Los productos no aparecen"
- Abre la consola del navegador (F12)
- Ejecuta `db.reset()` y recarga la página

### "Las ventas no se guardan"
- Verifica que hayas iniciado sesión
- Revisa la consola del navegador para ver errores

---

## 📞 Soporte

Si tienes problemas, abre la consola del navegador (F12) y revisa los mensajes de error. La base de datos local es muy robusta y rara vez falla.

**¡Disfruta tu página web estática sin preocupaciones!** 🎉
