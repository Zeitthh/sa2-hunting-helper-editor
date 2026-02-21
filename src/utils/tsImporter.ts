import type { EditorSet, Piece } from '../types/editor';
import { cssColorFromBootstrap } from '../data/colors';

// ─── String splitting helpers ─────────────────────────────────────────────────

export function splitTopLevelArgs(str: string): string[] {
  const args: string[] = [];
  let depth = 0;
  let current = '';
  let inStr = false;
  let strChar = '';

  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if ((c === '"' || c === "'") && (i === 0 || str[i - 1] !== '\\')) {
      if (!inStr) {
        inStr = true;
        strChar = c;
      } else if (c === strChar) {
        inStr = false;
        strChar = '';
      }
    }
    if (!inStr) {
      if (c === '(' || c === '[' || c === '{') depth++;
      if (c === ')' || c === ']' || c === '}') depth--;
      if (c === ',' && depth === 0) {
        args.push(current);
        current = '';
        continue;
      }
    }
    current += c;
  }
  if (current.trim()) args.push(current);
  return args;
}

// ─── Piece parsers ────────────────────────────────────────────────────────────

export function parsePieceArg(str: string): Piece {
  const s = str.trim();

  if (s.startsWith('{')) {
    const piece: Piece = { text: '', tags: [], color: '' };
    const textMatch = s.match(/piece\s*:\s*"([^"]*)"/);
    if (textMatch) piece.text = textMatch[1];
    const tagsMatch = s.match(/tags\s*:\s*\[(.*?)\]/);
    if (tagsMatch) {
      piece.tags = tagsMatch[1]
        .split(',')
        .map(t => t.trim().replace(/PieceTag\./g, '').toLowerCase())
        .filter(Boolean);
    }
    const colorMatch = s.match(/color\s*:\s*"([^"]*)"/);
    if (colorMatch) piece.color = colorMatch[1];
    return piece;
  }

  if (s.startsWith('newPiece')) {
    const args = s.match(/newPiece\s*\(\s*"([^"]*)"\s*,\s*"([^"]*)"\s*\)/);
    return args
      ? { text: args[1], tags: [], color: args[2] }
      : { text: '', tags: [], color: '' };
  }

  if (s.includes('isDisambiguation:')) {
    const textMatch = s.match(/piece\s*:\s*"([^"]*)"/);
    return { text: textMatch ? textMatch[1] : '', tags: ['disambiguation'], color: '' };
  }

  return { text: s.replace(/"/g, ''), tags: [], color: '' };
}

export function parseP3Arg(str: string): Piece[] {
  const s = str.trim();
  if (s.startsWith('[')) {
    const inner = s.slice(1, -1).trim();
    if (inner.startsWith('newPieces')) {
      const match = inner.match(/newPieces\s*\(\s*\[(.*?)\]\s*,\s*"([^"]*)"\s*\)/s);
      if (match) {
        const texts = match[1].split(',').map(t => t.trim().replace(/"/g, ''));
        const color = match[2];
        return texts.map(text => ({ text, tags: [], color }));
      }
    }
    return splitTopLevelArgs(inner).map(parsePieceArg);
  }
  return [parsePieceArg(s)];
}

// ─── Main import function ─────────────────────────────────────────────────────

let _importIdCounter = 10_000; // Use high range to avoid collision with editor IDs

export function parseTypeScriptContent(content: string): EditorSet[] {
  const sets: EditorSet[] = [];
  const regex =
    /sets\.addSet\s*\(\s*"([^"]*)"\s*,\s*new\s+PieceSet\s*\((.*?)\)\s*\)/gs;

  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    const p1Name = match[1];
    const argsStr = match[2];
    const restMatch = content
      .substring(match.index + match[0].length)
      .match(/^((?:\s*\.\w+\([^)]*\))*)/);
    const chainStr = restMatch ? restMatch[1] : '';

    const set: EditorSet = {
      id: _importIdCounter++,
      p1Name,
      borderColor: 'none',
      column: 'default',
      pieces: [],
      confirms: [],
    };

    // Constructor args → first piece row
    const topArgs = splitTopLevelArgs(argsStr);
    if (topArgs.length >= 2) {
      const p2 = parsePieceArg(topArgs[0].trim());
      const p3s = parseP3Arg(topArgs[1].trim());
      set.pieces.push({ p2, p3s });
    }

    // .addPieces chains
    const addPiecesRegex = /\.addPieces\s*\((.*?)\)/gs;
    let addMatch: RegExpExecArray | null;
    while ((addMatch = addPiecesRegex.exec(chainStr)) !== null) {
      const args = splitTopLevelArgs(addMatch[1]);
      if (args.length >= 2) {
        const p2 = parsePieceArg(args[0].trim());
        const p3s = parseP3Arg(args[1].trim());
        set.pieces.push({ p2, p3s });
      }
    }

    // .addConfirm
    const addConfirmRegex = /\.addConfirm\s*\(\s*"([^"]*)"\s*,\s*"([^"]*)"\s*\)/g;
    let confMatch: RegExpExecArray | null;
    while ((confMatch = addConfirmRegex.exec(chainStr)) !== null) {
      set.confirms.push({ confirmed: confMatch[1], confirmedBy: confMatch[2] });
    }

    // .setBorderColor
    const bcMatch = chainStr.match(/\.setBorderColor\s*\(\s*"([^"]*)"\s*\)/);
    if (bcMatch) set.borderColor = bcMatch[1];

    // .setColumn
    const colMatch = chainStr.match(/\.setColumn\s*\(\s*"([^"]*)"\s*\)/);
    if (colMatch) set.column = colMatch[1] as EditorSet['column'];

    // Legacy .setStyle
    const ssMatch = chainStr.match(
      /\.setStyle\s*\([^,]*,\s*[^,]*,\s*[^,]*,\s*[^,]*:\s*"([^"]*)"/,
    );
    if (ssMatch && !bcMatch) set.borderColor = cssColorFromBootstrap(ssMatch[1]);

    sets.push(set);
  }

  return sets;
}

/** Read a .ts File object and resolve with parsed sets */
export function importFromTypeScriptFile(file: File): Promise<EditorSet[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const content = (e.target as FileReader).result as string;
        resolve(parseTypeScriptContent(content));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsText(file);
  });
}
