# File Explorer 📂

> Un explorador de archivos ultrarrápido, nativo y moderno construido con **Tauri v2**, **Rust** y **React**.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tauri v2](https://img.shields.io/badge/Tauri-v2-blue?logo=tauri)](https://tauri.app/)
[![Rust](https://img.shields.io/badge/Rust-2021-orange?logo=rust)](https://www.rust-lang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-v3-38B2AC?logo=tailwindcss)](https://tailwindcss.com/)

---

## 🌟 Características Clave

- ⚡ **Alto Rendimiento Nativo**: Backend en Rust superligero que consulta el sistema de archivos de forma inmediata y con un consumo mínimo de memoria.
- 🎨 **UI Moderna Estilo Developer**: Interfaz limpia en modo oscuro con sombras suaves, animaciones fluidas e iconos representativos por tipo de archivo (`lucide-react`).
- 🧭 **Navegación Intuitiva e Historial**:
  - Botones **Atrás (`<`)**, **Adelante (`>`)** y **Subir Nivel (`⬆`)**.
  - Barra de ruta interactiva con atajo <kbd>Ctrl + L</kbd>.
  - Sidebar con accesos rápidos a **Home**, **Documentos**, **Descargas** y **Disco Local (C:)**.
- 📊 **Tabla Interactiva de Archivos**:
  - Columnas completas: **Nombre**, **Última modificación**, **Tipo** y **Tamaño**.
  - **Ordenamiento por columnas**: Haz clic en los encabezados para ordenar de forma ascendente o descendente.
  - **Navegación por doble clic**: Abre carpetas de forma instantánea.
  - **Selección visual de elementos**: Resaltado claro al seleccionar archivos o carpetas.
- 🖱️ **Menú Contextual (Clic Derecho)**:
  - **Copiar ruta**: Copia la ruta absoluta al portapapeles.
  - **Abrir en terminal**: Inicia la consola del sistema (PowerShell/CMD) directamente en la carpeta seleccionada.
  - **Eliminar**: Elimina archivos o directorios tras confirmación previa.
- ⌨️ **Atajos de Teclado Esenciales**:
  - <kbd>Backspace</kbd>: Volver al directorio anterior.
  - <kbd>F5</kbd>: Refrescar el directorio actual.
  - <kbd>Ctrl + L</kbd>: Enfocar la barra de direcciones.
  - <kbd>Escape</kbd>: Cerrar el menú contextual emergente.
- 📌 **Footer de Estado Fijo**: Muestra el total de elementos (carpetas/archivos) y detalles completos del ítem seleccionado.

---

## 🛠️ Tech Stack

| Tecnología | Descripción |
| :--- | :--- |
| **[Tauri v2](https://tauri.app/)** | Framework de aplicaciones de escritorio ligero e híper rápido |
| **[Rust](https://www.rust-lang.org/)** | Lógica de backend nativa, lectura eficiente de I/O y comandos de sistema |
| **[React 19](https://react.dev/)** | Biblioteca de UI para interfaces de usuario declarativas y reactivas |
| **[TypeScript](https://www.typescriptlang.org/)** | Tipado estático y seguridad en el código frontend |
| **[Tailwind CSS](https://tailwindcss.com/)** | Estilizado moderno y flexible con modo oscuro |
| **[Lucide Icons](https://lucide.dev/)** | Conjunto de iconos vectoriales para representaciones de archivos |

---

## 🚀 Guía de Instalación y Desarrollo Local

### Requisitos Previos

Asegúrate de contar con los siguientes elementos instalados en tu sistema:

1. **Node.js** (versión `>= 18.0.0` recomendada)
2. **Rust & Cargo** (versión reciente recomendada via [rustup](https://rustup.rs/))
3. **Prerrequisitos de Tauri** según tu sistema operativo (Ver [Guía de Prerrequisitos de Tauri](https://tauri.app/start/prerequisites/))

### Pasos para Ejecutar en Modo Desarrollo

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/tu-usuario/file-explorer.git
   cd file-explorer
   ```

2. **Instalar dependencias de NPM:**
   ```bash
   npm install
   ```

3. **Ejecutar el servidor de desarrollo de Tauri:**
   ```bash
   npm run tauri dev
   ```

4. **Compilar para producción (Bundle ejecutable):**
   ```bash
   npm run tauri build
   ```

---

## 🤝 Cómo Contribuir (Open Source)

¡Las contribuciones son enormemente bienvenidas! Si deseas agregar nuevas funcionalidades, solucionar algún error o mejorar la documentación:

1. Haz un **Fork** de este repositorio.
2. Crea tu rama de características (`git checkout -b feature/nueva-caracteristica`).
3. Realiza tus cambios y confirma los mensajes siguiendo [Conventional Commits](https://www.conventionalcommits.org/) (`git commit -m 'feat: agregar nueva funcionalidad'`).
4. Haz Push a la rama (`git push origin feature/nueva-caracteristica`).
5. Abre un **Pull Request** explicando detalladamente los cambios propuestos.

---

## 📄 Licencia

Este proyecto se encuentra bajo la Licencia **MIT**. Consulta el archivo [LICENSE](LICENSE) para más información.
