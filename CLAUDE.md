## Agent skills

### Issue tracker

Issues live in GitHub Issues of MonacoL/nota-bene, managed with the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Reviewed texts

A file in `contenuti/` whose frontmatter `revisione.da` names a person has passed human review: leave its text as it is, and propose any change to the user for them to make by hand. Drafts still marked `da: "nessuno, …"` are yours to edit. See the "Testi, AI e revisione umana" section of `CONTRIBUTING.md`.
