// Per-device storage plus JSON export/import so data can be moved between phone and PC.
export function loadState(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function saveState(key, state) {
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    alert('Could not save — storage is full or blocked. Export a backup now.');
  }
}

export function exportState(key, state) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }));
  a.download = `${key}-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function importState(file, isValid) {
  return file.text().then((text) => {
    const data = JSON.parse(text);
    if (!isValid(data)) throw new Error('File is not a backup for this app.');
    return data;
  });
}

export function wireBackup(key, getState, isValid, onImport) {
  document.getElementById('export').onclick = () => exportState(key, getState());
  const input = document.getElementById('import-file');
  document.getElementById('import').onclick = () => input.click();
  input.onchange = () => {
    const file = input.files[0];
    input.value = '';
    if (!file || !confirm('Replace current data with this backup?')) return;
    importState(file, isValid).then(onImport).catch((err) => alert(`Import failed: ${err.message}`));
  };
}
