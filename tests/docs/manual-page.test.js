'use strict';

const fs = require('fs');
const path = require('path');

const htmlPath = path.resolve(__dirname, '../../docs/user/sallon-connect-manuel-savoir-ia.html');

let failures = 0;

function check(label, condition) {
  if (condition) {
    console.log(`[OK] ${label}`);
  } else {
    console.error(`[FAIL] ${label}`);
    failures++;
  }
}

// File existence
check('Le fichier HTML existe', fs.existsSync(htmlPath));

if (!fs.existsSync(htmlPath)) {
  console.error('Fichier HTML absent — tests annulés.');
  process.exit(1);
}

const html = fs.readFileSync(htmlPath, 'utf8');

// Required content
check('Contient "Manuel complet Sallon-ConnecT"', html.includes('Manuel complet Sallon-ConnecT'));
check('Contient "Travaux pratiques guidés"', html.includes('Travaux pratiques guidés'));

// 12 TP checkboxes
const tpMatches = html.match(/id="tp-\d+"/g) || [];
check('Contient au moins 12 TP (cases à cocher)', tpMatches.length >= 12);

// Interactive features
check('Contient fonction copyCode (bouton copier)', html.includes('function copyCode'));
check('Contient fonction onSearch (recherche)', html.includes('function onSearch'));
check('Contient localStorage (progression)', html.includes('localStorage'));
check('Contient fonction resetProgress', html.includes('function resetProgress'));
check('Contient accordéon FAQ', html.includes('accordion'));

// Security section
check('Contient section sécurité', html.includes('Règles de Sécurité') || html.includes('Règles absolues'));

// No secrets
check('Ne contient pas SMARTTHINGS_TOKEN=', !html.includes('SMARTTHINGS_TOKEN='));
check('Ne contient pas "Bearer "', !html.includes('Bearer '));
check('Ne contient pas "IMEI"', !html.includes('IMEI'));
check('Ne contient pas de chemin personnel C:\\\\Users\\\\', !html.includes('C:\\Users\\'));
check('Ne contient pas de .env réel (contenu de variable)', !(/SMARTTHINGS_TOKEN=\w{10,}/.test(html)));

// Style SAVOIR_IA palette
check('Contient la palette navy #0A2540', html.includes('#0A2540'));
check('Contient la couleur cyan #38BDF8', html.includes('#38BDF8'));

// Responsive / no CDN
check('Aucun CDN externe (fonts.googleapis.com)', !html.includes('fonts.googleapis.com'));
check('Aucun CDN externe (cdn.jsdelivr.net)', !html.includes('cdn.jsdelivr.net'));
check('Aucun CDN externe (unpkg.com)', !html.includes('unpkg.com'));

if (failures > 0) {
  console.error(`\n${failures} vérification(s) échouée(s).`);
  process.exit(1);
}

console.log('\nManuel HTML : toutes les vérifications passées.');
