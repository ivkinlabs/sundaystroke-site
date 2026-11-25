#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
exec node sunday/cli.ts done
