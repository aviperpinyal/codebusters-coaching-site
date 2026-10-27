# Codebusters Coaching Site

Coaching website for a middle school Science Olympiad **Codebusters** team (Division B). Live at **https://codebusters.perpinyal.com**.

- **Lesson decks.** Twelve slide decks, one per cipher type, each with worked examples, exam-style practice, and homework.
- **Coach answer keys.** Step-by-step solutions for every practice and homework problem.
- **Coach admin page.** Server-side login and a click-to-mark attendance table, saved on the server.
- **Lightweight stack.** Plain HTML, CSS, and JavaScript with a small dependency-free Node.js server, deployed with Docker.

## Cipher verification

A wrong ciphertext on a slide means students can't solve it, so the practice ciphers are checked by a script. `tools/verify-ciphers.js` covers all 19 practice and homework problems in lessons 1 and 2. It decrypts each Caesar, Atbash, and keyword-alphabet problem with its stated key and compares the result to the answer. For every substitution cipher, including the random-alphabet ones, it confirms the letter mapping is one-to-one and that no letter maps to itself, as the 2027 rules require. A coverage check also flags any ciphertext on a slide that isn't a known problem. That check caught a real typo in a lesson 1 example.

```bash
node tools/verify-ciphers.js
```

The script has no dependencies and exits with an error if any check fails. Lessons 3–12 are not covered yet.

## Built with

I designed this site and built it with [Claude Code](https://claude.com/claude-code), Anthropic's AI coding agent. I set the requirements and the coaching approach, reviewed the changes, and tested and deployed each release on my own home server.

Student names and attendance records live only on the server and are never stored in this repository.
