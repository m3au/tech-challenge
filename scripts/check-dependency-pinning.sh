#!/usr/bin/env sh

# Check if package.json has unpinned dependencies (range operators: ^, ~, >=, etc.)

if [ ! -f package.json ]; then
    exit 0
fi

# Check for range operators in dependencies and devDependencies
UNPINNED=$(grep -E '"(\\^|~|>=|<=|>|<)"' package.json | grep -v "//" || true)

if [ -n "$UNPINNED" ]; then
    echo "❌ Error: Unpinned dependencies detected in package.json"
    echo ""
    echo "The following dependencies use range operators (^, ~, >=, etc.):"
    echo "$UNPINNED" | sed 's/^/  /'
    echo ""
    echo "Please pin all dependencies to exact versions (x.y.z)."
    echo "Run 'bun run pin' to automatically pin all dependencies."
    exit 1
fi

echo "✅ All dependencies are pinned to exact versions"
exit 0

