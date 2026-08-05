# Manual de Operaciones y Contrataciones

Manual web interno para el equipo de ventas y operaciones: tarifario, paquetes, salones, personal y políticas en un solo lugar, fácil de leer y con **precios y paquetes editables** en el navegador.

Los archivos Markdown (`01`–`04`) se mantienen como referencia histórica. La **fuente de verdad** del manual web es:

```text
web/data/seed.json
```

## Despliegue en Vercel

El sitio vive en la carpeta `web/`. El repo incluye `vercel.json` para copiarla al output del deploy.

En el dashboard de Vercel (si el 404 sigue):

1. **Project → Settings → General → Root Directory** → deja vacío (raíz del repo) **o** pon `web` y borra el `buildCommand` custom.
2. Framework Preset: **Other**.
3. Redeploy.

URL esperada: la raíz del dominio (con `vercel.json`) o `/web/` si solo se publica el repo estático.

## Cómo abrirlo (local)

**No abras el HTML con doble clic (`file://`).** Hay que servirlo por HTTP.

Desde esta carpeta:

```bash
cd web
python3 -m http.server 8080
```

Luego abre en el navegador:

```text
http://localhost:8080
```

Alternativa:

```bash
npx --yes serve web
```

### Solo lectura (tablets / sala de ventas)

```text
http://localhost:8080/?edit=0
```

Así el personal no deja cambios locales en un equipo compartido.

## Qué incluye

| Sección | Contenido |
| --- | --- |
| **Inicio** | Accesos rápidos, fees, no negociables, invitado adicional, escala de paquetes |
| **Salones** | Diamond / Revolution: capacidad, $/hr, hora extra, horarios |
| **Paquetes** | Matriz por día, cards, detalle con inclusiones |
| **Baby Shower** | Básico / Completo, horarios, prioridad sábados |
| **A la carta** | Todos los servicios con precios |
| **Personal** | Escalones 4 / 6 / 8 staff |
| **Políticas** | Negociables, intercambios, descuentos |
| **Edición / Backup** | Exportar, importar y restaurar borradores |

## Editar precios y paquetes

1. Activa **Modo edición** (arriba a la derecha).
2. Cambia precios en **A la carta**, **detalle de paquete** o **Salones**.
3. En el detalle de un paquete puedes **agregar o quitar servicios**, **duplicar** una variante o **restaurar** defaults.
4. Los cambios se guardan solo en **este navegador** (`localStorage`).
5. En **Edición / Backup** exporta el JSON para respaldarlo o proponerlo al catálogo oficial.

### Tarifas oficiales

1. Gerente edita y exporta (o edita `web/data/seed.json` directo).
2. Se actualiza el seed en el repo.
3. El resto del equipo recarga y, si hace falta, usa **Restaurar todo al seed**.

## Estructura

```text
web/
  index.html
  css/
  js/
  data/seed.json   ← catálogo oficial
```

## Notas

- Todos los paquetes llevan **18% Service Fee + 7% Tax** por defecto (negociables con criterio comercial).
- El **precio por hora del salón** (mín. 4 h) **no es negociable**.
- Deluxe solo aplica a **Salón Diamond**.
- Capacidades: Diamond 200 / Revolution 70; el esquema de personal escala hasta 200 invitados.
