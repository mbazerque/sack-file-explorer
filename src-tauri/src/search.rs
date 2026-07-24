// =============================================================================
// search.rs — Motor de búsqueda de archivos ultra-rápido para Tauri v2
//
// Características:
//   · Recorrido recursivo multi-hilo via crate `ignore` (respeta .gitignore)
//   · Paralelismo real con WalkBuilder::build_parallel()
//   · Fuzzy scoring manual (character-subsequence con bonificaciones)
//   · Hard-cap de 150 resultados
//   · Tolerante a errores de permisos y symlinks rotos
// =============================================================================

use ignore::WalkBuilder;
use rayon::prelude::*;
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::sync::{Arc, Mutex};
use std::time::UNIX_EPOCH;

// -- Límite duro de resultados enviados al frontend ---------------------------
const MAX_RESULTS: usize = 150;
// Recolectamos hasta 3x para poder ordenar por score antes de recortar
const COLLECTION_CAP: usize = MAX_RESULTS * 3;

// -- Directorios ignorados siempre (adicionalmente al .gitignore) -------------
const ALWAYS_IGNORE_DIRS: &[&str] = &[
    "node_modules",
    ".git",
    "target",
    ".next",
    "dist",
    "build",
    ".cache",
    ".venv",
    "venv",
    "__pycache__",
    ".idea",
    "out",
    ".nuxt",
    ".output",
    "coverage",
    ".turbo",
    ".parcel-cache",
    "vendor",
    ".yarn",
    ".pnpm-store",
    ".svelte-kit",
    "Pods",
];

// =============================================================================
// Struct principal — serializado y enviado al frontend via IPC
// =============================================================================
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileInfo {
    /// Nombre del archivo o carpeta (sin ruta)
    pub name: String,
    /// Ruta absoluta completa
    pub path: String,
    /// Ruta relativa desde root_path
    pub relative_path: String,
    /// true si es directorio
    pub is_dir: bool,
    /// Tamaño en bytes (0 para directorios)
    pub size: u64,
    /// Timestamp Unix en milisegundos de última modificación
    pub modified_at: u64,
    /// Score de relevancia (mayor = mejor). 0 en modo substring exacto.
    pub score: i64,
}

// =============================================================================
// Fuzzy scoring: character-subsequence con bonificaciones
//
// Retorna Some(score) si todos los chars del patrón aparecen en orden
// dentro del texto. None si no hay match.
//
// Bonificaciones:
//   +30  match de prefijo completo
//   +20  carácter coincide al inicio de una "palabra" (_, -, ., /, espacio)
//   +15  carácter coincide al inicio del string
//   +5   caracteres consecutivos (streak)
//   -1   penalización por cada carácter saltado
//   -(n) penalización leve proporcional al largo del texto
// =============================================================================
fn fuzzy_score(pattern: &str, text: &str) -> Option<i64> {
    if pattern.is_empty() {
        return Some(0);
    }

    let pat: Vec<char> = pattern.to_lowercase().chars().collect();
    let txt: Vec<char> = text.to_lowercase().chars().collect();

    let mut score: i64 = 100; // base score
    let mut pat_idx = 0usize;
    let mut prev_match: Option<usize> = None;

    for (ti, &tc) in txt.iter().enumerate() {
        if pat_idx >= pat.len() {
            break;
        }
        if tc == pat[pat_idx] {
            // Bonus inicio de string
            if ti == 0 {
                score += 15;
            }
            // Bonus inicio de "palabra"
            if ti > 0 {
                let prev_c = txt[ti - 1];
                if matches!(prev_c, '_' | '-' | '.' | ' ' | '/' | '\\') {
                    score += 20;
                }
            }
            // Bonus/penalización por consecutividad
            match prev_match {
                Some(p) if ti == p + 1 => score += 5,
                Some(p) => score -= (ti - p - 1) as i64,
                None => {}
            }
            prev_match = Some(ti);
            pat_idx += 1;
        }
    }

    if pat_idx < pat.len() {
        return None; // no todos los chars del patrón fueron encontrados
    }

    // Bonus si el texto empieza exactamente con el patrón (prefix)
    if txt.iter().take(pat.len()).zip(pat.iter()).all(|(a, b)| a == b) {
        score += 30;
    }

    // Penalización proporcional a la longitud extra del texto
    score -= (txt.len() as i64 - pat.len() as i64) / 4;

    Some(score)
}

// =============================================================================
// Verifica si un directorio debe ignorarse por nombre
// =============================================================================
#[inline]
fn is_ignored_dir(name: &str) -> bool {
    ALWAYS_IGNORE_DIRS.contains(&name)
}

// =============================================================================
// Extrae (is_dir, size, modified_at) de forma segura
// =============================================================================
fn extract_meta(entry: &ignore::DirEntry) -> (bool, u64, u64) {
    match entry.metadata() {
        Ok(m) => {
            let is_dir = m.is_dir();
            let size = if is_dir { 0 } else { m.len() };
            let mtime = m
                .modified()
                .ok()
                .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
                .map(|d| d.as_millis() as u64)
                .unwrap_or(0);
            (is_dir, size, mtime)
        }
        Err(_) => (false, 0, 0),
    }
}

// =============================================================================
// Comando Tauri: search_files
//
// Parámetros:
//   query     — Término de búsqueda (se ignoran espacios externos)
//   root_path — Directorio raíz desde el que buscar recursivamente
//   use_fuzzy — true → fuzzy con score; false → substring case-insensitive
//
// Retorna: Vec<FileInfo> ordenado, limitado a MAX_RESULTS (150).
// =============================================================================
#[tauri::command]
pub async fn search_files(
    query: String,
    root_path: String,
    use_fuzzy: bool,
) -> Result<Vec<FileInfo>, String> {
    // -- Validaciones previas -------------------------------------------------
    let root = Path::new(&root_path);

    if !root.exists() {
        return Err(format!("El directorio raíz no existe: {}", root_path));
    }
    if !root.is_dir() {
        return Err(format!(
            "La ruta indicada no es un directorio: {}",
            root_path
        ));
    }

    let query = query.trim().to_string();
    if query.is_empty() {
        return Ok(Vec::new());
    }

    let query_lower = query.to_lowercase();

    // -- Ejecutar en thread bloqueante (no bloquea el runtime async) ----------
    let results = tokio::task::spawn_blocking(move || {
        let found: Arc<Mutex<Vec<FileInfo>>> = Arc::new(Mutex::new(Vec::new()));

        // -- Configurar el walker ---------------------------------------------
        // WalkBuilder respeta automáticamente:
        //   · .gitignore en cualquier directorio padre
        //   · .ignore
        //   · .git/info/exclude
        //   · gitignore global del usuario
        let num_threads = num_cpus::get().clamp(2, 8);

        let walker = WalkBuilder::new(&root_path)
            .hidden(false)           // incluir archivos ocultos (controlamos nosotros)
            .git_ignore(true)        // respetar .gitignore
            .git_global(true)        // respetar gitignore global
            .git_exclude(true)       // respetar .git/info/exclude
            .ignore(true)            // respetar .ignore
            .follow_links(false)     // no seguir symlinks (evita loops infinitos)
            .same_file_system(true)  // no cruzar montajes distintos (ej. NFS)
            .threads(num_threads)
            .filter_entry(|e| {
                // Poda temprana: si es un directorio en la blacklist,
                // WalkBuilder no descenderá en él (más eficiente que filtrar después)
                if e.file_type().map(|ft| ft.is_dir()).unwrap_or(false) {
                    let name = e.file_name().to_string_lossy();
                    if is_ignored_dir(name.as_ref()) {
                        return false;
                    }
                }
                true
            })
            .build_parallel();

        // -- Recorrido paralelo -----------------------------------------------
        walker.run(|| {
            let found_ref = Arc::clone(&found);
            let q = query.clone();
            let ql = query_lower.clone();
            let rp = root_path.clone();

            Box::new(move |result| {
                use ignore::WalkState;

                // Fast-path: si ya tenemos suficientes, salir
                {
                    if found_ref.lock().unwrap().len() >= COLLECTION_CAP {
                        return WalkState::Quit;
                    }
                }

                let entry = match result {
                    Ok(e) => e,
                    Err(_) => return WalkState::Continue, // permiso denegado → continuar
                };

                // Saltar la raíz misma
                if entry.path() == Path::new(&rp) {
                    return WalkState::Continue;
                }

                // Saltar entradas sin tipo de archivo (raro, pero posible)
                if entry.file_type().is_none() {
                    return WalkState::Continue;
                }

                let file_name = entry.file_name().to_string_lossy().to_string();

                // -- Matching -------------------------------------------------
                let score: i64 = if use_fuzzy {
                    match fuzzy_score(&q, &file_name) {
                        Some(s) => s,
                        None => return WalkState::Continue,
                    }
                } else {
                    if file_name.to_lowercase().contains(&ql) {
                        0
                    } else {
                        return WalkState::Continue;
                    }
                };

                // -- Extraer metadatos ----------------------------------------
                let (is_dir, size, modified_at) = extract_meta(&entry);
                let abs_path = entry.path().to_string_lossy().to_string();
                let relative_path = entry
                    .path()
                    .strip_prefix(&rp)
                    .unwrap_or(entry.path())
                    .to_string_lossy()
                    .to_string();

                found_ref.lock().unwrap().push(FileInfo {
                    name: file_name,
                    path: abs_path,
                    relative_path,
                    is_dir,
                    size,
                    modified_at,
                    score,
                });

                WalkState::Continue
            })
        });

        // -- Post-procesado ---------------------------------------------------
        let mut results = Arc::try_unwrap(found)
            .expect("no other Arc owners after walk")
            .into_inner()
            .expect("mutex should not be poisoned");

        if use_fuzzy {
            // Mayor score primero; empate → alfabético por nombre
            results.par_sort_unstable_by(|a, b| {
                b.score.cmp(&a.score).then_with(|| a.name.cmp(&b.name))
            });
        } else {
            // Directorios primero, luego alfabético insensible a mayúsculas
            results.par_sort_unstable_by(|a, b| {
                b.is_dir
                    .cmp(&a.is_dir)
                    .then_with(|| a.name.to_lowercase().cmp(&b.name.to_lowercase()))
            });
        }

        results.truncate(MAX_RESULTS);
        results
    })
    .await
    .map_err(|e| format!("Error en la tarea de búsqueda: {e}"))?;

    Ok(results)
}
