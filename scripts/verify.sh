#!/usr/bin/env bash
set -euo pipefail

npm run contract:generate
npm run typecheck
npm test
npm run build
