import os
import re
import sys

# The "Luminance Elevation Protocol" Thresholds
FORBIDDEN_PATTERNS = [
    r'text-white/10\b',
    r'text-white/20\b',
    r'bg-white/10\b',
    r'bg-white/20\b',
    r'text-primary/10\b',
    r'text-primary/20\b',
]

def audit_file(filepath):
    issues = []
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        for i, line in enumerate(lines):
            for pattern in FORBIDDEN_PATTERNS:
                if re.search(pattern, line):
                    issues.append((i + 1, line.strip(), pattern))
    return issues

def main():
    root_dir = "src"
    total_issues = 0
    print("\n🔳 [MURGIA ACCESSIBILITY AUDIT] — Scanning for Low-Contrast Artifacts...")
    print("="*70)

    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if file.endswith(('.tsx', '.ts', '.css')):
                path = os.path.join(root, file)
                issues = audit_file(path)
                if issues:
                    print(f"\n📂 {path}")
                    for line_num, content, pattern in issues:
                        print(f"   [Line {line_num}] Forbidden: {pattern}")
                        print(f"   Content: {content[:80]}...")
                    total_issues += len(issues)

    print("\n" + "="*70)
    if total_issues == 0:
        print("✅ ABSOLUTE CLARITY ACHIEVED: No low-contrast violations found.")
    else:
        print(f"⚠️ AUDIT FAILED: Found {total_issues} low-contrast violations.")
        print("Action: Elevate to /40, /50, or /60 opacities according to SKILL.md.")

if __name__ == "__main__":
    main()
