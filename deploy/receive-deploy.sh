#!/usr/bin/env bash

set -Eeuo pipefail

readonly APP_ROOT="/opt/form-fitness"
readonly LOCK_FILE="/tmp/form-fitness-deploy.lock"

staging_dir=""

cleanup() {
  if [[ -n "$staging_dir" && -d "$staging_dir" ]]; then
    rm -rf -- "$staging_dir"
  fi
}

trap cleanup EXIT

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  echo "Another FORM deployment is already running." >&2
  exit 1
fi

staging_dir="$(mktemp -d /tmp/form-fitness-release.XXXXXX)"
tar --no-same-owner --no-same-permissions -xzf - -C "$staging_dir"

for required_file in package.json compose.yaml Dockerfile; do
  if [[ ! -f "$staging_dir/$required_file" ]]; then
    echo "Release is missing $required_file." >&2
    exit 1
  fi
done

rsync -a --delete \
  --exclude='.env' \
  --exclude='.git/' \
  --exclude='backups/' \
  "$staging_dir/" "$APP_ROOT/"

cd "$APP_ROOT"
sudo docker compose up -d --build --remove-orphans
sudo docker compose ps
