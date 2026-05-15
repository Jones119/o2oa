#!/usr/bin/env python3
import re
import os
import sys

def find_matching_brace(text, start):
    count = 1
    i = start
    in_str = False
    str_ch = None
    while i < len(text) and count > 0:
        c = text[i]
        if in_str:
            if c == '\\':
                i += 2
                continue
            if c == str_ch:
                in_str = False
        else:
            if c in ('"', "'"):
                in_str = True
                str_ch = c
            elif c == '{':
                count += 1
            elif c == '}':
                count -= 1
        i += 1
    return i - 1 if count == 0 else -1

def convert_str_template(content):
    if 'STR."' not in content:
        return content, False
    result = []
    pos = 0
    changed = False
    while pos < len(content):
        idx = content.find('STR."', pos)
        if idx == -1:
            result.append(content[pos:])
            break
        result.append(content[pos:idx])
        template_start = idx + 5
        parts = []
        cur = template_start
        while cur < len(content):
            c = content[cur]
            if c == '\\' and cur + 1 < len(content) and content[cur + 1] == '{':
                brace_start = cur + 2
                brace_end = find_matching_brace(content, brace_start)
                if brace_end == -1:
                    break
                expr = content[brace_start:brace_end].strip()
                parts.append(('expr', expr))
                cur = brace_end + 1
                continue
            if c == '"':
                parts.append(('end', None))
                cur += 1
                break
            next_embed = content.find('\\{', cur)
            next_quote = content.find('"', cur)
            if next_embed == -1 and next_quote == -1:
                parts.append(('text', content[cur:]))
                cur = len(content)
                break
            candidates = []
            if next_embed != -1:
                candidates.append(next_embed)
            if next_quote != -1:
                candidates.append(next_quote)
            end = min(candidates)
            if end > cur:
                parts.append(('text', content[cur:end]))
            cur = end
        concat_parts = []
        for ptype, pval in parts:
            if ptype == 'text':
                escaped = pval.replace('\\', '\\\\').replace('"', '\\"')
                concat_parts.append(f'"{escaped}"')
            elif ptype == 'expr':
                if pval.strip():
                    needs_parens = False
                    depth = 0
                    for ch in pval:
                        if ch == '(':
                            depth += 1
                        elif ch == ')':
                            depth -= 1
                        elif ch == '?' and depth == 0:
                            needs_parens = True
                            break
                    if needs_parens:
                        concat_parts.append(f'({pval})')
                    else:
                        concat_parts.append(pval)
        if concat_parts:
            replacement = ' + '.join(concat_parts)
            result.append(replacement)
            changed = True
        else:
            result.append('""')
            changed = True
        pos = cur
    return ''.join(result), changed

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    new_content, changed = convert_str_template(content)
    if changed:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
    return changed

def main():
    root_dir = sys.argv[1] if len(sys.argv) > 1 else '.'
    count = 0
    for dirpath, dirnames, filenames in os.walk(root_dir):
        for filename in filenames:
            if filename.endswith('.java'):
                filepath = os.path.join(dirpath, filename)
                if process_file(filepath):
                    count += 1
                    print(f'Converted: {filepath}')
    print(f'\nTotal files converted: {count}')

if __name__ == '__main__':
    main()
