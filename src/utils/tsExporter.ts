import type { EditorSet, Piece } from '../types/editor';

function tsPiece(p: Piece): string {
  if (!p.text && p.tags.length === 0 && !p.color) return '""';
  if (!p.tags.length && !p.color) return `"${p.text}"`;
  let obj = `{ piece: "${p.text}", tags: [${p.tags.map(t => `PieceTag.${t.toUpperCase()}`).join(', ')}]`;
  if (p.color) obj += `, color: "${p.color}"`;
  obj += ' }';
  return obj;
}

function tsP3s(arr: Piece[]): string {
  if (arr.length === 1) return tsPiece(arr[0]);
  return '[' + arr.map(tsPiece).join(', ') + ']';
}

export function exportToTypeScript(sets: EditorSet[]): string {
  const hasTags = sets.some(set =>
    set.pieces.some(row => row.p2.tags.length > 0 || row.p3s.some(p3 => p3.tags.length > 0)),
  );

  // ── Imports ──────────────────────────────────────────────────────────────
  let ts = `import { PieceSet, PieceSets${hasTags ? ', PieceTag' : ''} } from "../../PieceSetV2";\n`;
  ts += `import Code from "../../Code";\n\n`;

  // ── Boilerplate ───────────────────────────────────────────────────────────
  ts += `const sets: PieceSets = new PieceSets();\n\n`;

  // ── Sets ──────────────────────────────────────────────────────────────────
  sets.forEach(set => {
    if (!set.p1Name.trim()) return;
    const f = set.pieces[0];
    ts += `sets.addSet("${set.p1Name}", new PieceSet(${tsPiece(f.p2)}, ${tsP3s(f.p3s)}))`;

    for (let i = 1; i < set.pieces.length; i++) {
      const r = set.pieces[i];
      ts += `\n\t.addPieces(${tsPiece(r.p2)}, ${tsP3s(r.p3s)})`;
    }
    if (set.borderColor && set.borderColor !== 'none') {
      ts += `\n\t.setBorderColor("${set.borderColor}")`;
    }
    if (set.column && set.column !== 'default') {
      ts += `\n\t.setColumn("${set.column}")`;
    }
    ts += ';\n\n';
  });

  // ── Codes footer ──────────────────────────────────────────────────────────
  ts += `const codes: Code[] = [];\n`;
  ts += `for (const key of sets.keys()) {\n`;
  ts += `\tconst set = sets.get(key);\n`;
  ts += `\tif (set?.code) {\n`;
  ts += `\t\tcodes.push({ piece: key, code: set.code });\n`;
  ts += `\t}\n`;
  ts += `}\n\n`;
  ts += `export { sets, codes };\n`;

  return ts;
}
