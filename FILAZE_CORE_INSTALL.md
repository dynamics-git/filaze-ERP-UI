# Filaze Core Install Guide

This is the single command guide for core package usage.

## 1) Employee Daily Command

Run this to install core from local artifact and keep current import compatibility:

```bash
npm run core:install -- --syncToSrc true
```

## 2) Core Release Update Command (Lead/Owner Only)

Run this only when publishing a new approved core version:

```bash
npm run core:update -- --refreshFromGit true --repo git+https://github.com/dynamics-git/filaze-ERP-UI.git --ref <TAG_OR_COMMIT> --syncToSrc true
```

Example with commit:

```bash
npm run core:update -- --refreshFromGit true --repo git+https://github.com/dynamics-git/filaze-ERP-UI.git --ref 6bc2efb3481185f0f13f6af402096e14611d6300 --syncToSrc true
```

## 3) Rules

1. Never use mutable refs like main, master, develop.
2. Use a release tag or commit SHA for updates.
3. Employees normally run only the daily command.

## 4) Internet Down Behavior

1. Daily employee install still works from local artifact.
2. New core release refresh requires internet.
