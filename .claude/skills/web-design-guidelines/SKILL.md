---
name: vercel-web-design-guidelines
description: Review UI code for Web Interface Guidelines compliance. Use when the user requests a design review, accessibility check, UX audit, or best-practices validation of their web UI code.
license: MIT
metadata:
  author: vercel
  version: "1.0.0"
  argument: "<file-or-pattern>"
---

# Web Interface Guidelines Review

Review files for compliance with Web Interface Guidelines.

## Usage

When invoked, this skill:

1. **Retrieves current guidelines** by fetching the latest rules from:
   `https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md`

2. **Analyzes specified files** — the user provides file paths or patterns as arguments. If no argument is specified, ask the user which files to review.

3. **Checks against all rules** in the fetched guidelines document.

4. **Reports findings** using the terse notation format (`file:line`) as defined in the fetched guidelines.

## How to Apply

- Always fetch the guidelines fresh before each review to ensure you're checking against the latest standards.
- Apply every rule from the fetched document to the files under review.
- Output results in the compact format specified by the guidelines.
