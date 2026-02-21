import { useRef } from 'react';
import { useEditor } from '../../store/editorStore';
import { useModal } from '../ui/Modal';
import { useToast } from '../ui/Toast';
import type { EditorSet } from '../../types/editor';

interface HomeScreenProps {
  onSelectLevel: () => void;
}

type TemplateSource = 'iden' | 'zeitthh' | 'upload';

export function HomeScreen({ onSelectLevel }: HomeScreenProps) {
  const { dispatch } = useEditor();
  const { confirm } = useModal();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeSourceRef = useRef<TemplateSource>('upload');

  async function loadTemplate(data: unknown, filename: string) {
    if (!data || typeof data !== 'object') throw new Error('Formato de plantilla inválido');
    const d = data as Record<string, unknown>;
    if (!d.level || !Array.isArray(d.sets)) throw new Error('La plantilla debe tener "level" y "sets"');

    const ok = await confirm({
      title: 'Cargar plantilla',
      message: `¿Cargar la plantilla "${filename}" para el nivel ${d.level}?\nEsto reemplazará los sets actuales de ese nivel.`,
      variant: 'warning',
      confirmLabel: 'Cargar',
    });
    if (!ok) return;

    dispatch({ type: 'SET_LEVEL', level: d.level as never });
    dispatch({ type: 'IMPORT_SETS', sets: d.sets as EditorSet[] });
    toast(`Plantilla cargada: ${(d.sets as EditorSet[]).length} sets para ${d.level}`, 'success');
    onSelectLevel();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();

      if (file.name.endsWith('.json')) {
        const data = JSON.parse(text);
        await loadTemplate(data, file.name);
      } else if (file.name.endsWith('.ts') || file.name.endsWith('.tsx')) {
        // TypeScript: try to extract JSON-like object from export
        // Simple heuristic: find first { } block after "sets"
        toast('Soporte TypeScript — función pendiente. Usa formato .json por ahora.', 'warning');
      } else {
        toast('Formato no soportado. Usa .json o .ts', 'error');
      }
    } catch (err) {
      toast('Error al cargar plantilla: ' + (err as Error).message, 'error');
    }

    e.target.value = '';
  }

  function handleTemplateBtn(source: TemplateSource) {
    activeSourceRef.current = source;
    if (source === 'iden' || source === 'zeitthh') {
      // Future: fetch from a URL
      toast(`Plantilla "${source}" — disponible próximamente.`, 'info');
      return;
    }
    fileInputRef.current?.click();
  }

  return (
    <div className="home-screen">
      <div className="home-content">
        {/* Hero */}
        <div className="home-hero">
          <img src={`${import.meta.env.BASE_URL}icons/HuntingHelperEditorLogo.svg`}
 alt="SA2 Hunting Editor" className="home-logo"
            width={64} height={64} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <h1 className="home-title">SA2 Hunting Editor</h1>
          <p className="home-subtitle">Crea y organiza sets de caza para Sonic Adventure 2</p>
        </div>

        {/* Grid: Instructions + Shortcuts */}
        <div className="home-grid">
          {/* Instructions */}
          <div className="home-card">
            <h2>¿Cómo usar?</h2>
            <ol className="home-steps">
              <li>
                <span className="step-number">1</span>
                <div><strong>Elige un nivel</strong> en el selector del panel izquierdo (Hero o Dark)</div>
              </li>
              <li>
                <span className="step-number">2</span>
                <div><strong>Crea un set</strong> con <kbd>+ Nuevo Set</kbd> o <kbd>Ctrl+N</kbd></div>
              </li>
              <li>
                <span className="step-number">3</span>
                <div><strong>Selecciona P1</strong> y añade filas de P2 / P3</div>
              </li>
              <li>
                <span className="step-number">4</span>
                <div><strong>Asigna columna</strong> (Izq / Centro / Der) arrastrando en el sidebar</div>
              </li>
              <li>
                <span className="step-number">5</span>
                <div><strong>Exporta</strong> con <kbd>Exportar</kbd> o <kbd>Ctrl+E</kbd></div>
              </li>
            </ol>
          </div>

          {/* Shortcuts */}
          <div className="home-card">
            <h2>Atajos</h2>
            <div className="shortcuts-grid">
              <kbd>Ctrl+N</kbd>   <span>Nuevo set</span>
              <kbd>Ctrl+E</kbd>   <span>Exportar</span>
              <kbd>Ctrl+Z</kbd>   <span>Deshacer</span>
              <kbd>Ctrl+Y</kbd>   <span>Rehacer</span>
              <kbd>Ctrl+Del</kbd> <span>Eliminar set activo</span>
            </div>
          </div>
        </div>

        {/* Template loader */}
        <div className="home-card home-template">
          <h2>Cargar plantilla</h2>
          <p>
            Carga sets preconfigurados listos para editar. La plantilla <strong>Iden</strong> está en inglés,
            la plantilla <strong>Zeitthh</strong> está en español.
          </p>
          <div className="home-template-buttons">
            <button className="home-tpl-btn" onClick={() => handleTemplateBtn('iden')}>
              <span className="tpl-label">Iden</span>
            </button>
            <button className="home-tpl-btn" onClick={() => handleTemplateBtn('zeitthh')}>
              <span className="tpl-label">Zeitthh</span>
            </button>
            <button className="home-tpl-btn home-tpl-btn--upload" onClick={() => handleTemplateBtn('upload')}>
              <img
                src={`${import.meta.env.BASE_URL}icons/upload.svg`}

                alt="Upload"
                width={22}
                height={22}
                className="tpl-upload-icon"
                onError={e => {
                  const el = e.target as HTMLImageElement;
                  el.replaceWith(Object.assign(document.createElementNS('http://www.w3.org/2000/svg','svg'), {
                    innerHTML: '<path d="M12 3v10m0-10L8 7m4-4l4 4M4 17v2a1 1 0 001 1h14a1 1 0 001-1v-2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
                    viewBox: '0 0 24 24', style: 'width:22px;height:22px'
                  }));
                }}
              />
            </button>
          </div>
          <p className="home-template-note">
            Formato esperado: <code>{`{ "level": "PumpkinHill", "sets": [...] }`}</code>
          </p>
          <input ref={fileInputRef} type="file" accept=".json,.ts,.tsx" style={{ display: 'none' }} onChange={handleFileChange} />
        </div>
      </div>
    </div>
  );
}
