const STORAGE_KEY = 'anime_ranking_order';
const BACKUP_IMPORTED_KEY = 'anime_ranking_backup_imported';

export function exportBackup(): void {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    alert('No ranking data to export');
    return;
  }

  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `anime-ranking-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importBackup(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result as string;
        // Validate JSON structure
        const parsed = JSON.parse(data);
        if (!Array.isArray(parsed)) {
          throw new Error('Invalid backup format');
        }
        localStorage.setItem(STORAGE_KEY, data);
        localStorage.setItem(BACKUP_IMPORTED_KEY, 'true');
        resolve(true);
      } catch {
        alert('Invalid backup file. Please select a valid JSON backup.');
        resolve(false);
      }
    };
    reader.onerror = () => {
      alert('Failed to read file');
      resolve(false);
    };
    reader.readAsText(file);
  });
}
