import { useRef } from 'react';
import { useEditor } from '../../store/editorStore';
import { exportToTypeScript } from '../../utils/tsExporter';
import { importFromTypeScriptFile } from '../../utils/tsImporter';

export function ExportPanel() {
  const { dispatch, currentSets } = useEditor();
  const outputRef    = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleExport() {
    const defaultSets = currentSets.filter(s => s.column === 'default' && s.p1Name.trim());
    if (defaultSets.length > 0) {
      const names = defaultSets.map(s => `• ${s.p1Name}`).join('\n');
      const confirmed = confirm(
        `⚠️ Hay ${defaultSets.length} set(s) en columna "Default" (sin posición asignada):\n\n${names}\n\n¿Exportar de todas formas?`
      );
      if (!confirmed) return;
    }
    const ts = exportToTypeScript(currentSets);
    if (outputRef.current) outputRef.current.value = ts;
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importFromTypeScriptFile(file);
      dispatch({ type: 'IMPORT_SETS', sets: imported });
      alert(`Importados ${imported.length} sets.`);
    } catch (err) {
      alert('Error al parsear TypeScript: ' + (err as Error).message);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <div className="export-section">
      <h2>Importar / Exportar</h2>
      <div className="export-buttons">
        <button className="btn-primary" onClick={handleExport}>
          Exportar a TypeScript
        </button>
        <label className="file-label" style={{ background: '#5c35c9' }}>
          Importar TypeScript
          <input ref={fileInputRef} type="file" accept=".ts" onChange={handleImport} />
        </label>
      </div>
      <textarea
        ref={outputRef}
        placeholder="El código exportado aparecerá aquí..."
      />
    </div>
  );
}
