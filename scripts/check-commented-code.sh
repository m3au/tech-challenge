#!/usr/bin/env sh

# Check for large blocks of commented-out code in staged files
# Blocks commits with >10 consecutive commented lines

COMMENTED_THRESHOLD=10

# Get staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx|py|java|cpp|c|h)$' || true)

if [ -z "$STAGED_FILES" ]; then
    exit 0
fi

FOUND_ISSUES=0

for file in $STAGED_FILES; do
    if [ ! -f "$file" ]; then
        continue
    fi
    
    # Check for large blocks of commented-out code
    # Count consecutive comment lines (// for JS/TS, # for Python, etc.)
    if echo "$file" | grep -qE '\.(ts|tsx|js|jsx)$'; then
        # JavaScript/TypeScript: // comments
        COMMENTED_BLOCK=$(grep -nE '^\s*//' "$file" | awk -F: '{print $1}' | awk 'NR==1{prev=$1; count=1} NR>1{if ($1==prev+1) {count++; prev=$1} else {if (count>'"$COMMENTED_THRESHOLD"') print prev-count+1"-"prev; count=1; prev=$1}} END{if (count>'"$COMMENTED_THRESHOLD"') print prev-count+1"-"prev}')
    elif echo "$file" | grep -qE '\.py$'; then
        # Python: # comments
        COMMENTED_BLOCK=$(grep -nE '^\s*#' "$file" | awk -F: '{print $1}' | awk 'NR==1{prev=$1; count=1} NR>1{if ($1==prev+1) {count++; prev=$1} else {if (count>'"$COMMENTED_THRESHOLD"') print prev-count+1"-"prev; count=1; prev=$1}} END{if (count>'"$COMMENTED_THRESHOLD"') print prev-count+1"-"prev}')
    fi
    
    if [ -n "$COMMENTED_BLOCK" ]; then
        if [ $FOUND_ISSUES -eq 0 ]; then
            echo "❌ Error: Large blocks of commented-out code detected"
            echo ""
            echo "Please delete commented-out code instead of committing it."
            echo ""
        fi
        echo "  File: $file"
        echo "    Lines with commented code: $COMMENTED_BLOCK"
        FOUND_ISSUES=1
    fi
done

if [ $FOUND_ISSUES -eq 1 ]; then
    echo ""
    echo "Please remove commented-out code before committing."
    exit 1
fi

exit 0

