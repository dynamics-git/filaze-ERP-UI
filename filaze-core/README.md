# Filaze Development Starter

This repository is for employee development work.
Core code is consumed from your private core repository as an installable package.

Core files are synced into `src/app/shared/erp-core` after install.

## Quick setup

1. Clone this repository.
2. Run npm install.
3. Install and sync core package from your private repo tag:
   npm run core:install -- --repo <CORE_REPO_URL> --tag v1.0.0

Example:

npm run core:install -- --repo git+https://github.com/dynamics-git/filaze-ERP-UI.git --tag v1.0.0

## Update core version

npm run core:update -- --repo <CORE_REPO_URL> --tag v1.0.1

## Notes

- Keep feature work in this repository.
- Core sync target is `src/app/shared/erp-core`.
- Upgrade by tag so updates are controlled.
