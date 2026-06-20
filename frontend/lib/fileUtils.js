const TEXT_EXTENSIONS = new Set(['md', 'markdown']);

export function isTextFile(file) {
  const name = file.name || '';
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (TEXT_EXTENSIONS.has(ext)) return true;
  const type = file.type || '';
  if (type === 'text/markdown' || type === 'text/x-markdown') return true;
  return false;
}

export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(file, 'utf-8');
  });
}

function getFile(fileEntry) {
  return new Promise((resolve, reject) => {
    fileEntry.file(resolve, reject);
  });
}

async function collectEntry(entry) {
  if (entry.isFile) {
    const file = await getFile(entry);
    return isTextFile(file)
      ? [{ file, path: entry.fullPath.replace(/^\//, '') }]
      : [];
  }

  if (entry.isDirectory) {
    const result = [];
    const reader = entry.createReader();
    await new Promise((resolve) => {
      const read = () => {
        reader.readEntries(async (entries) => {
          if (entries.length === 0) {
            resolve();
            return;
          }
          for (const e of entries) {
            const sub = await collectEntry(e);
            result.push(...sub);
          }
          read();
        });
      };
      read();
    });
    return result;
  }

  return [];
}

export async function collectFilesFromDrop(items) {
  const files = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.kind !== 'file') continue;
    const entry = item.webkitGetAsEntry?.();
    if (entry) {
      const collected = await collectEntry(entry);
      files.push(...collected);
    } else {
      const file = item.getAsFile();
      if (file && isTextFile(file)) {
        files.push({ file, path: file.name });
      }
    }
  }
  return files;
}
