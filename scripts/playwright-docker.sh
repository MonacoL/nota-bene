#!/bin/sh
# Lancia Playwright nell'immagine Docker ufficiale, la stessa della CI, così gli screenshot
# coincidono con le baseline. Usa node_modules e dist/ già presenti: prima serve `npm ci && npm run build`.
# Esempi: scripts/playwright-docker.sh
#         scripts/playwright-docker.sh --update-snapshots=changed
#         scripts/playwright-docker.sh --project="*-webkit"
set -eu
# Sempre il demone Docker locale, anche se nel terminale è attivo un contesto remoto:
# il volume con la repo esiste solo su questa macchina. Per sceglierne un altro: NOTA_BENE_DOCKER_CONTEXT=<nome>.
export DOCKER_CONTEXT="${NOTA_BENE_DOCKER_CONTEXT:-default}"
VERSIONE=$(node -p "require('@playwright/test/package.json').version")
exec docker run --rm --init --ipc=host \
  --user "$(id -u):$(id -g)" -e HOME=/tmp -e CI \
  -v "$PWD":/work -w /work \
  "mcr.microsoft.com/playwright:v${VERSIONE}-noble" \
  npx playwright test "$@"
