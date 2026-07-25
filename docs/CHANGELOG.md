# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- **Navegación Híbrida de Pestañas (Hybrid Tab Navigation)**:
  - Ampliado el ancho dinámico por pestaña: máximo de `260px` y mínimo de `140px` (`flex-1 min-w-[140px] max-w-[260px]`) para ofrecer mayor comodidad de lectura de rutas largas.
  - Habilitado scroll horizontal en la barra de pestañas (`overflow-x-auto`) con barra de desplazamiento ocultada mediante utilidad `scrollbar-none` y scroll suave por rueda de ratón (`wheel`).
  - Integrado auto-desplazamiento suave (`scrollIntoView`) que enfoca automáticamente la pestaña activa al cambiar o crear pestañas.
  - Habilitadas las capacidades ACL de ventana en Tauri v2 (`core:window:allow-minimize`, `core:window:allow-toggle-maximize`, `core:window:allow-close`, `core:window:allow-start-dragging`) en `src-tauri/capabilities/default.json`.
  - Implementada llamada directa a `getCurrentWindow().startDragging()` y `toggleMaximize()` en `onMouseDown` / `onDoubleClick` sobre áreas libres de la barra superior para garantizar el movimiento y maximizado de la ventana.
- **Rediseño de Vista Dividida (Split View)**:
  - Eliminados los títulos "Panel Izquierdo" y "Panel Derecho" de la cabecera de los paneles.
  - Se muestra únicamente la ruta actual formateada como breadcrumbs de forma compacta.
  - Integración de Split View con el sistema de pestañas (Tabs): al activar Split View, el panel izquierdo mantiene la pestaña activa y el panel derecho muestra la siguiente pestaña abierta (o crea una copia si solo hay una).
  - Al hacer click en cualquier pestaña de la barra de pestañas en Split View, se asigna esa pestaña al panel enfocado.
  - Ocultada la columna "Tipo" en modo Split View.
  - Formateo de fecha de modificación compacto (DD/MM/YY HH:mm) con prevención de saltos de línea (`whitespace-nowrap`) para mejorar el uso del espacio horizontal.

### Added
- **Barra de Título Personalizada integrada con Pestañas (Custom Titlebar)**:
  - Eliminada la barra de título nativa de Windows (`decorations: false` en `tauri.conf.json`).
  - Integrada la barra de pestañas (`TabBar`) en la parte superior de la ventana ocupando todo el ancho.
  - Habilitada la región de arrastre (`data-tauri-drag-region`) en el contenedor principal de la barra de pestañas para permitir arrastrar y mover la ventana desde los espacios vacíos.
  - Implementado el componente `WindowControls` con botones nativos para Minimizar (`appWindow.minimize()`), Maximizar/Restaurar (`appWindow.toggleMaximize()`) y Cerrar (`appWindow.close()`) ubicados en la extrema derecha.
  - Configurado `data-tauri-drag-region="false"` y manejo de eventos en pestañas y botones para evitar que las interacciones del usuario arrastren la ventana.
- **Vista Previa Rápida (Quick Preview Modal - Tecla Espacio)**:
  - Modal flotante con desenfoque de fondo (`backdrop-blur`) activado mediante la barra espaciadora (`Espacio`) sobre el archivo seleccionado.
  - Renderizado dinámico de archivos de texto/código (`.txt`, `.md`, `.json`, `.ts`, `.tsx`, `.rs`, `.css`, `.html`, `.env`, etc.) mediante comando nativo de Rust `read_file_content` con bloque `<pre><code>` y scroll independiente.
  - Visualización de imágenes (`.png`, `.jpg`, `.jpeg`, `.svg`, `.webp`, `.gif`, `.ico`) adaptadas al modal usando `convertFileSrc`.
  - Fallback con mensaje informativo y tarjeta de metadatos (nombre, ruta, tamaño, fecha de modificación) para archivos binarios o no soportados.
  - Atajos de teclado: `Espacio` o `Esc` para alternar/cerrar la vista previa y flechas `⬆ / ⬇` para navegar la lista de archivos actualizando la vista previa de forma instantánea.
- **Navegación en Vista Dividida / Panel Doble (Split View / Dual-pane)**:
  - Soporte para vista dividida con dos paneles independientes de exploración (`leftPanel` y `rightPanel`) con navegación, búsqueda y selecciones aisladas.
  - Indicador visual del panel activo con resaltado de borde sutil (`ring-1 ring-blue-500/50`) y cambio reactivo al hacer clic en cualquiera de los dos paneles.
  - Botón "Split View" en la Navbar y atajo de teclado global `Ctrl + \` para alternar la vista dividida.
  - Acciones entre paneles en el Menú Contextual (clic derecho) con iconos Lucide:
    - **Copiar al otro panel** (`ArrowRight`): Copia archivos/carpetas directamente al directorio activo del otro panel mediante comando nativo de Rust `copy_item`.
    - **Mover al otro panel** (`MoveRight`): Mueve archivos/carpetas directamente al directorio activo del otro panel mediante comando nativo de Rust `move_item`.

## [v0.2.0] - 2026-07-24

### Added
- **Sistema de Navegación Multi-Pestañas (`TabContext` & `TabBar`)**:
  - Contexto de pestañas con estado aislado por pestaña (`currentPath`, `history`, `historyIndex`, `searchQuery`, `isFuzzy`).
  - Barra de pestañas (`TabBar.tsx`) con diseño prolijo estilo browser, iconos representativos según tipo de directorio, títulos dinámicos y botón `+` para crear nuevas pestañas.
  - Botón de cierre `x` para cerrar pestañas individuales (visible cuando hay más de una pestaña activa).
  - Atajos globales de teclado: `Ctrl+T` (crear nueva pestaña), `Ctrl+W` (cerrar pestaña activa) y `Ctrl+Tab` / `Ctrl+Shift+Tab` (ciclar entre pestañas).
- **Motor de Búsqueda Ultra-Rápido en Rust (`search_files`)**:
  - Algoritmo multi-hilo respaldado por `ignore::WalkBuilder` con filtrado inteligente de `.gitignore`, `.ignore`, `.git/info/exclude` y carpetas de desarrollo (`node_modules`, `target`, `dist`, `.next`, etc.).
  - Poda temprana de directorios ignorados y soporte de Fuzzy Search con algoritmo custom de scoring por coincidencias fragmentadas/secuenciales.
  - Límite de seguridad de 150 resultados para evitar sobrecargar la memoria y el canal IPC de Tauri v2.
- **UI de Búsqueda Interactiva (React + Tailwind)**:
  - Barra de búsqueda integrada en el Navbar con debounce automático de ~250ms.
  - Atajos de teclado globales `Ctrl+F` / `Ctrl+P` para enfocar la barra de búsqueda y `Esc` para cancelar y limpiar la búsqueda.
  - Toggle UI para cambiar dinámicamente entre **Fuzzy Search** y **Búsqueda Exacta (Substring)**.
  - Tabla de resultados adaptativa con columna de **Ruta Relativa** (`relative_path`), indicador de **Relevancia** (`score`) y estado de carga optimizado.

## [v0.1.0] - 2026-07-24

### Added
- **Navegación Interactiva sin Modales**: Barra de direcciones inteligente con atajo `Ctrl+L`, botones de navegación (Atrás `<`, Adelante `>`, Subir Nivel `⬆`) e historial centralizado mediante el hook `useNavigation`.
- **Sidebar de Acceso Rápido**: Accesos directos a carpetas del sistema (Home, Documentos, Descargas, Disco C:) con iconos representativos.
- **Tabla Interactiva de Archivos**:
  - Columnas completas: **Nombre**, **Última modificación**, **Tipo** y **Tamaño**.
  - Ordenamiento por columnas al hacer clic en los encabezados (ascendente/descendente con flechas indicadoras).
  - Navegación por doble clic para abrir directorios.
  - Selección de fila visual con resaltado y detalles del elemento en el footer.
  - Iconos por extensión de archivo utilizando `lucide-react`.
- **Menú Contextual (Clic Derecho)**:
  - Opciones para *Copiar ruta*, *Abrir carpeta en terminal* (PowerShell/CMD) y *Eliminar*.
- **Atajos de Teclado**:
  - `Backspace` para ir al directorio anterior.
  - `F5` para refrescar el contenido de la carpeta actual.
  - `Escape` para cerrar el menú contextual.
- **Backend Nativo en Rust (`src-tauri/src/lib.rs`)**:
  - Estructura `FileItem` con metadatos de archivos (`name`, `is_dir`, `size`, `modified_at`).
  - Comandos Rust IPC `scan_directory`, `open_in_terminal` y `delete_item`.
  - Configuración de permisos Tauri v2 (`capabilities/default.json` con `dialog:default`).
- **Footer de Estado Fijo**: Indicador con el total de elementos, número de carpetas/archivos y detalles del elemento seleccionado.
- **Documentación Open Source**: `README.md` profesional con badges, arquitectura y guía de contribución.
