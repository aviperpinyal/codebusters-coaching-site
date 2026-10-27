#!/usr/bin/env node
// Verifies the practice ciphers in the lesson decks and answer keys.
//
// For each problem below it checks that:
//   1. the ciphertext appears in every listed file, and the plaintext appears
//      in at least one (homework answers live only in the answer keys);
//   2. decrypting the ciphertext with the stated key gives the plaintext;
//   3. for substitution ciphers, the letter mapping is one-to-one and no
//      letter maps to itself, as the 2027 rules require.
// It also checks coverage: every ciphertext shown on a slide in these files
// must match a problem below, so a mistyped ciphertext cannot slip through.
//
// Run from the repo root:  node tools/verify-ciphers.js
// Exits with code 1 if any check fails. No dependencies.

'use strict';
const fs = require('fs');
const path = require('path');

const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const L1 = 'public/lessons/lesson-01-intro-caesar.html';
const L1K = 'public/lessons/answers/lesson-01-answers.html';
const L2 = 'public/lessons/lesson-02-aristocrat.html';
const L2K = 'public/lessons/answers/lesson-02-answers.html';

// K1 alphabet: keyword (deduplicated) then the rest of the alphabet forms the
// plain row; the cipher row is A–Z.
function k1Decrypt(keyword) {
  const plainRow = [...new Set(keyword + A)].join('');
  return Object.fromEntries([...A].map((c, i) => [c, plainRow[i]]));
}

const decrypt = {
  caesar: (ct, shift) => ct.replace(/[A-Z]/g, c => A[(A.indexOf(c) - shift + 26) % 26]),
  atbash: ct => ct.replace(/[A-Z]/g, c => A[25 - A.indexOf(c)]),
  k1: (ct, keyword) => { const m = k1Decrypt(keyword); return ct.replace(/[A-Z]/g, c => m[c]); },
};

// Each problem: type, key (if any), ciphertext, plaintext, files it appears in.
// `random` problems have no stated key; only the substitution checks apply.
const PROBLEMS = [
  // Lesson 1 — Caesar
  { name: 'L1 Caesar worked example', type: 'caesar', key: 3, ct: 'KHOOR ZRUOG', pt: 'HELLO WORLD', files: [L1] },
  { name: 'L1 Caesar brute-force example', type: 'caesar', key: 13, ct: 'PBQROHFGREF', pt: 'CODEBUSTERS', files: [L1] },
  { name: 'L1 Caesar practice', type: 'caesar', key: 7, ct: 'JVKLIBZALYZ PZ OLYL', pt: 'CODEBUSTERS IS HERE', files: [L1] },
  { name: 'L1 Exam Q1', type: 'caesar', key: 13, ct: 'PBQROHFGREF YBIR PBQRF', pt: 'CODEBUSTERS LOVE CODES', files: [L1, L1K] },
  { name: 'L1 HW1', type: 'caesar', key: 11, ct: 'XLAWP HTYD DELEP', pt: 'MAPLE WINS STATE', files: [L1, L1K] },
  { name: 'L1 HW3', type: 'caesar', key: 9, ct: 'YAJLCRLN FRWB', pt: 'PRACTICE WINS', files: [L1, L1K] },
  // Lesson 1 — Atbash
  { name: 'L1 Atbash example', type: 'atbash', ct: 'HVXIVG', pt: 'SECRET', files: [L1] },
  { name: 'L1 Atbash practice', type: 'atbash', ct: 'NVVG ZG GSV OLYYB ZG SZOU KZHG GSIVV', pt: 'MEET AT THE LOBBY AT HALF PAST THREE', files: [L1] },
  { name: 'L1 Exam Q2', type: 'atbash', ct: 'OVZIM GSV XRKSVI', pt: 'LEARN THE CIPHER', files: [L1, L1K] },
  { name: 'L1 HW2', type: 'atbash', ct: 'XLWVYFHGVIH MVEVI TREV FK', pt: 'CODEBUSTERS NEVER GIVE UP', files: [L1, L1K] },
  { name: 'L1 HW4', type: 'atbash', ct: 'PMLDOVWTV RH KLDVI', pt: 'KNOWLEDGE IS POWER', files: [L1, L1K] },
  // Lesson 2 — Aristocrat
  { name: 'L2 Walkthrough', type: 'random', ct: 'GTM PSALW JVBXH YBZ ISEUF BQMV GTM CNOR KBD', pt: 'THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG', files: [L2, L2K] },
  { name: 'L2 Practice', type: 'random', ct: 'DKN LDFWNUD QXJINDNL VU DKN QXWNMFLDNCL NONUD', pt: 'THE STUDENT COMPETES IN THE CODEBUSTERS EVENT', files: [L2, L2K] },
  { name: 'L2 Exam Q1', type: 'k1', key: 'WIZARD', ct: 'PDSOI ABQU VRFDZ', pt: 'MAPLE WINS TODAY', files: [L2, L2K] },
  { name: 'L2 Exam Q2', type: 'random', ct: 'RGD DTYMF JOYA LTRLGDQ RGD HXYW', pt: 'THE EARLY BIRD CATCHES THE WORM', files: [L2, L2K] },
  { name: 'L2 HW1', type: 'k1', key: 'WIZARD', ct: 'UVWFZ LDEF ABQ GBK', pt: 'STUDY HARD WIN BIG', files: [L2, L2K] },
  { name: 'L2 HW2', type: 'random', ct: 'XFA GJRA QK GLTGDAR', pt: 'THE CODE IS CRACKED', files: [L2, L2K] },
  { name: 'L2 HW3', type: 'k1', key: 'WIZARD', ct: 'QIXIE KBXI WS', pt: 'NEVER GIVE UP', files: [L2, L2K] },
  { name: 'L2 HW4', type: 'random', ct: 'JAI WXH SYIWHVW', pt: 'WIN THE CONTEST', files: [L2, L2K] },
];

// Substitution checks: consistent one-to-one mapping, no letter to itself.
function substitutionErrors(ct, pt) {
  const errs = [];
  if (ct.length !== pt.length) return ['ciphertext and plaintext lengths differ'];
  const fwd = {}, back = {};
  for (let i = 0; i < ct.length; i++) {
    const c = ct[i], p = pt[i];
    if ((c === ' ') !== (p === ' ')) return ['word breaks do not line up'];
    if (c === ' ') continue;
    if (c === p) errs.push(`${c} maps to itself`);
    if (fwd[c] && fwd[c] !== p) errs.push(`cipher ${c} decodes to both ${fwd[c]} and ${p}`);
    if (back[p] && back[p] !== c) errs.push(`plain ${p} encodes as both ${back[p]} and ${c}`);
    fwd[c] = p; back[p] = c;
  }
  return [...new Set(errs)];
}

const root = path.join(__dirname, '..');
const cache = {};
const read = f => (cache[f] ??= fs.readFileSync(path.join(root, f), 'utf8'));

let failures = 0;
for (const p of PROBLEMS) {
  const errs = [];
  for (const f of p.files) {
    if (!read(f).includes(p.ct)) errs.push(`ciphertext not found in ${f}`);
  }
  if (!p.files.some(f => read(f).includes(p.pt))) errs.push('plaintext not found in any listed file');
  if (p.type in decrypt) {
    const got = decrypt[p.type](p.ct, p.key);
    if (got !== p.pt) errs.push(`decrypts to "${got}", expected "${p.pt}"`);
  }
  if (p.type === 'random' || p.type === 'k1') errs.push(...substitutionErrors(p.ct, p.pt));
  if (p.type === 'k1') {
    const m = k1Decrypt(p.key);
    const self = A.split('').filter(c => m[c] === c);
    if (self.length) errs.push(`K1 alphabet maps ${self.join(', ')} to itself`);
  }
  console.log(`${errs.length ? 'FAIL' : 'ok  '}  ${p.name}`);
  errs.forEach(e => console.log(`        ${e}`));
  failures += errs.length ? 1 : 0;
}
// Coverage: every ciphertext row on a slide must be a known problem.
const known = new Set(PROBLEMS.map(p => p.ct));
const files = [...new Set(PROBLEMS.flatMap(p => p.files))];
let unlisted = 0;
for (const f of files) {
  for (const m of read(f).matchAll(/class="row ct"[^>]*>([A-Z ]+)</g)) {
    const ct = m[1].trim();
    if (!known.has(ct)) { console.log(`FAIL  unlisted ciphertext "${ct}" in ${f}`); unlisted++; }
  }
}
failures += unlisted;
console.log(`\n${PROBLEMS.length - (failures - unlisted)}/${PROBLEMS.length} problems verified, ${unlisted} unlisted ciphertexts.`);
process.exit(failures ? 1 : 0);
