#!/bin/bash

# Check if there are staged changes to package.json or CHANGELOG.md
if git diff --cached --name-only | grep -qE '^(package\.json|CHANGELOG\.md)$'; then
  echo "📦 Committing version bump..."
  git commit --no-verify -m "chore(release): bump version and update changelog" 
  echo "✅ Version committed!"
else
  echo "✅ No version changes to commit"
fi

