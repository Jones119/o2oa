#!/usr/bin/env python3
import os
import re

BASE_DIR = "/workspace/o2server"

JPA_OBJECT_FIELD_NAMES = {'id', 'createTime', 'updateTime', 'sequence'}
SLICE_JPA_OBJECT_FIELD_NAMES = {'distributeFactor'}
STORAGE_OBJECT_FIELD_NAMES = {'encryptKey'}

INHERITED_FIELD_NAMES = JPA_OBJECT_FIELD_NAMES | SLICE_JPA_OBJECT_FIELD_NAMES | STORAGE_OBJECT_FIELD_NAMES

PARENT_METAMODEL_MAP = {
    'SliceJpaObject': ('SliceJpaObject_', 'com.x.base.core.entity'),
    'StorageObject': ('StorageObject_', 'com.x.base.core.entity'),
    'DataItem': ('SliceJpaObject_', 'com.x.base.core.entity'),
    'Item': ('SliceJpaObject_', 'com.x.base.core.entity'),
    'JpaObject': ('JpaObject_', 'com.x.base.core.entity'),
}

SKIP_CLASSES = {'JpaObject', 'SliceJpaObject', 'StorageObject'}

def find_entity_files():
    entities = []
    for root, dirs, files in os.walk(BASE_DIR):
        for f in files:
            if f.endswith('.java') and not f.endswith('_Test.java'):
                path = os.path.join(root, f)
                class_name = f[:-5]
                if class_name in SKIP_CLASSES:
                    continue
                try:
                    with open(path, 'r', encoding='utf-8') as fh:
                        content = fh.read()
                    if '@Entity' in content or '@MappedSuperclass' in content:
                        if f.endswith('_.java'):
                            continue
                        entities.append((path, content))
                except:
                    pass
    return entities

def get_parent_class(content):
    extends_match = re.search(r'extends\s+(\w+)', content)
    if extends_match:
        return extends_match.group(1)
    return None

def parse_entity(path, content):
    package_match = re.search(r'package\s+([\w.]+);', content)
    if not package_match:
        return None
    package = package_match.group(1)
    
    class_match = re.search(r'public\s+(?:abstract\s+)?class\s+(\w+)', content)
    if not class_match:
        return None
    class_name = class_match.group(1)
    
    is_entity = '@Entity' in content
    is_mapped_super = '@MappedSuperclass' in content
    
    if not is_entity and not is_mapped_super:
        return None
    
    all_imports = {}
    wildcard_packages = []
    for imp_match in re.finditer(r'import\s+([\w.]+(?:\.\*)?)\s*;', content):
        imp = imp_match.group(1)
        simple = imp.rsplit('.', 1)[-1]
        if simple == '*':
            pkg = imp[:-2]
            wildcard_packages.append(pkg)
            pkg_rel = pkg.replace('.', '/')
            for root_dir, dirs, files in os.walk(BASE_DIR):
                candidate = os.path.join(root_dir, 'src', 'main', 'java', pkg_rel)
                if os.path.isdir(candidate):
                    for f in os.listdir(candidate):
                        if f.endswith('.java') and not f.endswith('_.java'):
                            cls_name = f[:-5]
                            all_imports[cls_name] = f'{pkg}.{cls_name}'
                    break
        else:
            all_imports[simple] = imp
    
    parent = get_parent_class(content)
    
    fields = []
    
    lines = content.split('\n')
    skip_next_field = False
    for line in lines:
        stripped = line.strip()
        
        if '@Transient' in stripped:
            skip_next_field = True
            continue
        
        if stripped.startswith('private ') and not stripped.startswith('private static') and not stripped.startswith('private static final'):
            if skip_next_field:
                skip_next_field = False
                continue
            skip_next_field = False
            
            field_match = re.match(r'\s*private\s+([\w<>,\s\[\]]+?)\s+(\w+)\s*[;=]', stripped)
            if field_match:
                field_type_raw = field_match.group(1).strip()
                field_name = field_match.group(2)
                
                if field_name == 'serialVersionUID':
                    continue
                
                if field_name in INHERITED_FIELD_NAMES:
                    continue
                
                is_list = field_type_raw.startswith('List<')
                is_map = field_type_raw.startswith('Map<') or field_type_raw.startswith('LinkedHashMap<') or field_type_raw.startswith('HashMap<')
                
                if is_map:
                    continue
                
                if is_list:
                    inner_match = re.match(r'List<(\w+)>', field_type_raw)
                    if inner_match:
                        inner_type = inner_match.group(1)
                        existing_names = [f[0] for f in fields]
                        if field_name not in existing_names:
                            fields.append((field_name, inner_type, True))
                    continue
                
                java_type = map_type(field_type_raw, all_imports)
                if java_type:
                    existing_names = [f[0] for f in fields]
                    if field_name not in existing_names:
                        fields.append((field_name, java_type, False))
        else:
            if not stripped.startswith('@') and not stripped.startswith('//') and not stripped.startswith('/*') and not stripped.startswith('*'):
                skip_next_field = False
    
    parent_meta = None
    if parent in PARENT_METAMODEL_MAP:
        parent_meta = PARENT_METAMODEL_MAP[parent]
    
    return {
        'package': package,
        'class_name': class_name,
        'fields': fields,
        'path': path,
        'all_imports': all_imports,
        'parent': parent,
        'parent_meta': parent_meta,
    }

def map_type(field_type, all_imports):
    field_type = field_type.strip()
    
    simple_map = {
        'String': 'String',
        'Integer': 'Integer',
        'int': 'Integer',
        'Long': 'Long',
        'long': 'Long',
        'Double': 'Double',
        'double': 'Double',
        'Float': 'Float',
        'float': 'Float',
        'Boolean': 'Boolean',
        'boolean': 'Boolean',
        'Date': 'java.util.Date',
        'BigDecimal': 'java.math.BigDecimal',
        'byte[]': 'byte[]',
    }
    
    if field_type in simple_map:
        return simple_map[field_type]
    
    if field_type in all_imports:
        return all_imports[field_type]
    
    if field_type[0].isupper():
        return field_type
    
    return None

def generate_metamodel(entity_info):
    if not entity_info:
        return None
    
    package = entity_info['package']
    class_name = entity_info['class_name']
    fields = entity_info['fields']
    all_imports = entity_info['all_imports']
    parent_meta = entity_info['parent_meta']
    
    imports_needed = set()
    imports_needed.add('jakarta.persistence.metamodel.SingularAttribute')
    imports_needed.add('jakarta.persistence.metamodel.StaticMetamodel')
    
    has_list = any(f[2] for f in fields)
    if has_list:
        imports_needed.add('jakarta.persistence.metamodel.ListAttribute')
    
    for _, ftype, is_list in fields:
        if is_list:
            continue
        if ftype.startswith('java.'):
            imports_needed.add(ftype)
        elif '.' in ftype:
            imports_needed.add(ftype)
        elif ftype in all_imports:
            imports_needed.add(all_imports[ftype])
    
    extends_clause = ''
    if parent_meta:
        parent_class_name, parent_package = parent_meta
        if parent_package != package:
            imports_needed.add(f'{parent_package}.{parent_class_name}')
        extends_clause = f' extends {parent_class_name}'
    
    sorted_imports = sorted(imports_needed)
    
    lines = []
    lines.append(f'package {package};')
    lines.append('')
    for imp in sorted_imports:
        lines.append(f'import {imp};')
    lines.append('')
    lines.append(f'@StaticMetamodel({class_name}.class)')
    lines.append(f'public class {class_name}_{extends_clause} {{')
    for fname, ftype, is_list in fields:
        simple_type = ftype.rsplit('.', 1)[-1] if '.' in ftype else ftype
        if is_list:
            lines.append(f'\tpublic static volatile ListAttribute<{class_name}, {simple_type}> {fname};')
        else:
            lines.append(f'\tpublic static volatile SingularAttribute<{class_name}, {simple_type}> {fname};')
    lines.append('}')
    
    return '\n'.join(lines)

def main():
    print("Scanning entity classes...")
    entities = find_entity_files()
    print(f"Found {len(entities)} entity/mappedSuperclass classes")
    
    created = 0
    skipped = 0
    
    for path, content in entities:
        info = parse_entity(path, content)
        if not info:
            continue
        
        metamodel_code = generate_metamodel(info)
        if not metamodel_code:
            skipped += 1
            continue
        
        dir_path = os.path.dirname(path)
        metamodel_path = os.path.join(dir_path, f"{info['class_name']}_.java")
        
        with open(metamodel_path, 'w', encoding='utf-8') as f:
            f.write(metamodel_code)
        created += 1
        ext = f" extends {info['parent_meta'][0]}" if info['parent_meta'] else ""
        print(f"  Generated: {info['package']}.{info['class_name']}_{ext} ({len(info['fields'])} fields)")
    
    print(f"\nDone: Generated {created} metamodel classes, Skipped {skipped}")

if __name__ == '__main__':
    main()
