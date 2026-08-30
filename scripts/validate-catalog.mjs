// =============================================================
//  Vérifie assets/data/artworks.json contre le contrat de données.
//  Usage : node scripts/validate-catalog.mjs  (ou : npm run validate)
//  Sort en code 1 si le catalogue est invalide -> utilisable en CI.
// =============================================================

import { readFile } from 'node:fs/promises';
import { validateCatalog } from '../js/core/catalog-schema.js';

const file = new URL('../assets/data/artworks.json', import.meta.url);

let doc;
try {
  doc = JSON.parse(await readFile(file, 'utf8'));
} catch (err) {
  console.error('✗ JSON illisible :', err.message);
  process.exit(1);
}

const { ok, errors } = validateCatalog(doc);
if (!ok) {
  console.error(`✗ Catalogue invalide — ${errors.length} problème(s) :`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}

console.log(`✓ Catalogue valide — ${doc.artworks.length} œuvres.`);
