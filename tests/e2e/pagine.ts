// Le pagine che esistono oggi, nelle due lingue. Ogni ticket che aggiunge pagine le aggiunge qui.
import { PROVVISORIE } from '../../src/pagine-provvisorie';

export const LINGUE = ['it', 'en'] as const;
export const PAGINE = LINGUE.flatMap((l) => [`${l}/`, ...PROVVISORIE.map((p) => `${l}/${p}/`)]);
