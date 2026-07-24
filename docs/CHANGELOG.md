# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
