# Codebusters Website — Claude Code Project

Coaching/reference website for the **Maple Middle School (District 30, Northbrook IL)** Science Olympiad Division B **Codebusters** team. The live site will be at **https://codebusters.perpinyal.com**.

Avi has coached Codebusters for two prior years (materials likely on his Google Drive). This is a content-forward site — cipher references, practice tools, and team resources for middle schoolers preparing for tournament competition.

---

## Hosting & infrastructure

Same setup as a sibling event-site project:

- **Production host**: Docker Desktop / WSL2 on a Windows 11 home server
- **Reverse proxy**: Nginx Proxy Manager (NPM) on a separate machine, fronts the public subdomains and forwards `codebusters.perpinyal.com` to the container port.
- **Container**: Docker Compose

---

## Deployment workflow

1. **On Mac**: commit changes and push to GitHub.
2. **On Windows/WSL machine** (SSH in first):
```bash
ssh <user>@<home-server>
cd ~/codebusters   # (or wherever the repo is checked out)
git pull
docker-compose up -d --build --force-recreate
```

**Server-only files (not in git):**
- `.env` on the Windows machine holds `ADMIN_PASSWORD=...`. The admin login and attendance API check it on the server. If it is missing, the admin API stays locked.
- `data/attendance.json` holds the Codebusters roster and attendance marks. It is mounted into the container as a volume, so it survives rebuilds. Edit the `students` list there to change the roster. Student names must never go into `public/` or git.

---

## Source material & reference docs

| Resource | Location | Notes |
|---|---|---|
| Official 2027 Div B Rules | `Science_Olympiad_Div_B_Rules_2027_for_Web_Secured.pdf` (this folder) | PDF-secured; Codebusters B rules on pages B14–B15 |
| Team roster & calendar | `DRAFT LIST FOR 2027 Maple Science Olympiad Calendar...xlsx` (this folder) | Coaches, participants, events |
| YouTube tutorials | [@Codebusters-sciol on YouTube](https://www.youtube.com/@Codebusters-sciol) | Video walkthroughs of cipher types |
| Prior coaching materials | Avi's Google Drive | 2 prior years of content |
| www.toubes.com/codebusters | defunct (domain for sale as of Oct 2026) | Was a popular reference; no longer available |

**Copyright note**: The Science Olympiad rules PDF is copyrighted and explicitly forbids reproduction. Do not copy rules text verbatim onto the website; paraphrase and summarize instead.

---

## Event overview (Codebusters B — 2027 rules)

**Format**: Team of up to 3 students, 50-minute written exam. No resource materials allowed — only pencils and the resource sheet provided by the event supervisor (Morse code table, letter frequencies, Porta table, Atbash table, Baconian mappings).

### Cipher types — Regional level

| Cipher | Notes |
|---|---|
| Aristocrat | Monoalphabetic substitution, K1 or random alphabet, spaces preserved |
| Patristocrat | Same as Aristocrat but spaces removed, letters grouped in 5s |
| Xenocrypt | Up to 1; Spanish plaintext encoded with K1 English keyword alphabet |
| Baconian | a/b values as letters/glyphs/formatting variations; word Baconian includes a 4-letter crib |
| Fractionated Morse | Morse code encoded as letters; 4-character crib provided |
| Cryptarithm | Base-10 math equations; find letter→digit mappings, decode a word/phrase |
| Porta Cipher | Decrypt given the key |
| Complete Columnar Transposition | ≤9 columns; crib ≥ (columns − 1) characters |
| Nihilist Cipher | Decrypt given both keys |
| Atbash | English only (not Hebrew) |
| Caesar / Shift | Basic shift cipher |
| 5×5 Checkerboard (Polybius) | Decrypt given the Polybius key |
| Homophonic Cipher | Decrypt given a crib indicating ≥3 letters of the keyword |

### Additional cipher types — State & National only

Cryptanalysis of Porta (3-letter crib), Nihilist cryptanalysis (crib ≥ 2× keyword length), 5×5 Checkerboard cryptanalysis (two 5-letter keywords + 5-char crib), Homophonic without full key (≥3 keyword letters), additional Xenocrypts (1–2 per exam).

### Scoring formula

```
Final Score = Exam Score + Timing Bonus + Special Bonus
```

- **Exam Score**: Sum of all question scores. Each question: ≤2 errors = full credit; each additional error = −100 pts (min 0). Cryptarithm: zero errors for full credit.
- **Timing Bonus**: First question is a timed Aristocrat. Bonus = `2 × (600 − seconds_to_solve)`. Must solve in ≤10 min to earn a bonus; can still answer after 10 min for exam credit.
- **Special Bonus**: Up to 3 bonus questions (at least one Homophonic). Solve with zero penalty: 1 solved = 150 pts, 2 solved = 400 pts, all 3 = 750 pts.
- **Ties**: broken by pre-selected questions (score, degree of correctness, number attempted).

---

## Development conventions

Same stack preference as Bar Mitzvah: plain Node.js, minimal dependencies, static HTML/CSS for content, Docker for production. No test suite or linter required.

When building content pages:
- Middle school audience (grades 6–9) — keep language accessible
- Cipher explanations should include worked examples
- Dark/cool color scheme TBD (contrast with the Bar Mitzvah's warm dark palette)

---

## Git & GitHub

Repo will live on GitHub (create it when the project is initialized). Claude Code commits and pushes from Mac; the Windows machine only pulls. Commit messages should be descriptive (what changed and why).
