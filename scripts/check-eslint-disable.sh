#!/usr/bin/env sh

# Check that eslint-disable comments include reasons
# Check that no global disables are in config files

STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM || true)

if [ -z "$STAGED_FILES" ]; then
    exit 0
fi

FOUND_ISSUES=0

for file in $STAGED_FILES; do
    if [ ! -f "$file" ]; then
        continue
    fi
    
    # Check for eslint-disable without reason
    # Pattern: eslint-disable[-next-line] without comment after it
    if grep -nE 'eslint-disable(?:-next-line)?\s*$' "$file" >/dev/null 2>&1; then
        if [ $FOUND_ISSUES -eq 0 ]; then
            echo "❌ Error: eslint-disable comments without reasons detected"
            echo ""
            echo "All eslint-disable comments must include a reason."
            echo "Example: eslint-disable-next-line sonarjs/complexity -- Complex logic required"
            echo ""
        fi
        echo "  File: $file"
        grep -nE 'eslint-disable(?:-next-line)?\s*$' "$file" | sed 's/^/    Line /'
        FOUND_ISSUES=1
    fi
    
    # Check for global eslint-disable in config files (not allowed)
    if echo "$file" | grep -qE '(eslint\.config\.|\.eslintrc)'; then
        if grep -qE 'eslint-disable' "$file"; then
            if [ $FOUND_ISSUES -eq 0 ]; then
                echo "❌ Error: eslint-disable in config files detected"
                echo ""
                echo "Never disable eslint rules globally in config files."
                echo "Place disable comments in the file where needed."
                echo ""
            fi
            echo "  File: $file"
            grep -n 'eslint-disable' "$file" | sed 's/^/    Line /'
            FOUND_ISSUES=1
        fi
    fi
    
    # Check for multiple rule disables in one comment (should be separate)
    if grep -nE 'eslint-disable.*,.*--' "$file" >/dev/null 2>&1; then
        if [ $FOUND_ISSUES -eq 0 ]; then
            echo "❌ Error: Multiple eslint-disable rules in one comment detected"
            echo ""
            echo "Never disable multiple rules in one comment."
            echo "Use separate eslint-disable comments for each rule."
            echo ""
        fi
        echo "  File: $file"
        grep -nE 'eslint-disable.*,.*--' "$file" | sed 's/^/    Line /'
        FOUND_ISSUES=1
    fi
done

if [ $FOUND_ISSUES -eq 1 ]; then
    exit 1
fi

exit 0

