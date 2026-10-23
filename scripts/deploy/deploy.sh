#!/usr/bin/env bash
# Builds the committed HEAD and publishes it to pet.lvlove.wang (ssh host aliyun-bj2).
# Each build goes to releases/<commit>; `current` is switched atomically, the last five stay.
# Roll back: ssh aliyun-bj2 'sudo ln -sfn releases/<commit> /var/www/pet.lvlove.wang/current'
set -euo pipefail

HOST="${DEPLOY_HOST:-aliyun-bj2}"
SITE="${DEPLOY_SITE:-/var/www/pet.lvlove.wang}"
KEEP=5

cd "$(dirname "$0")/../.."
if [ -n "$(git status --porcelain)" ]; then
  echo "Uncommitted changes: deploy only committed work." >&2
  exit 1
fi
REV="$(git rev-parse --short HEAD)"

npm run build

echo "Publishing $REV to $HOST:$SITE"
tar -C dist -czf - . | ssh "$HOST" "set -e
  sudo mkdir -p '$SITE/releases/$REV'
  sudo tar -C '$SITE/releases/$REV' -xzf -
  sudo chown -R root:root '$SITE/releases/$REV'
  sudo find '$SITE/releases/$REV' -type d -exec chmod 755 {} +
  sudo find '$SITE/releases/$REV' -type f -exec chmod 644 {} +
  sudo ln -sfn 'releases/$REV' '$SITE/current.next'
  sudo mv -T '$SITE/current.next' '$SITE/current'
  cd '$SITE/releases' && ls -1t | tail -n +$((KEEP + 1)) | xargs -r sudo rm -rf --"

echo "Live: $REV"
