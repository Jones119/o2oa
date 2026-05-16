#!/usr/bin/env python3
import os
import subprocess
import xml.etree.ElementTree as ET

M2 = os.path.expanduser("~/.m2/repository")
BASE = "https://repo1.maven.org/maven2"

downloaded = set()
failed = set()

def download(g, a, v):
    key = f"{g}:{a}:{v}"
    if key in downloaded:
        return True
    downloaded.add(key)
    
    path = g.replace('.', '/')
    dir_path = os.path.join(M2, path, a, v)
    os.makedirs(dir_path, exist_ok=True)
    
    base = f"{BASE}/{path}/{a}/{v}/{a}-{v}"
    
    pom_path = os.path.join(dir_path, f"{a}-{v}.pom")
    jar_path = os.path.join(dir_path, f"{a}-{v}.jar")
    
    if not os.path.exists(pom_path) or os.path.getsize(pom_path) == 0:
        subprocess.run(["curl", "-sL", f"{base}.pom", "-o", pom_path], 
                       capture_output=True, timeout=30)
        if not os.path.exists(pom_path) or os.path.getsize(pom_path) == 0:
            if os.path.exists(pom_path):
                os.remove(pom_path)
            failed.add(key)
            return False
    
    if not os.path.exists(jar_path):
        subprocess.run(["curl", "-sL", f"{base}.jar", "-o", jar_path],
                       capture_output=True, timeout=120)
        if os.path.exists(jar_path) and os.path.getsize(jar_path) < 100:
            os.remove(jar_path)
    
    return True

def parse_pom(pom_path):
    try:
        tree = ET.parse(pom_path)
        root = tree.getroot()
        ns = 'http://maven.apache.org/POM/4.0.0'
        
        result = {'parent': None, 'dependencies': [], 'properties': {}}
        
        parent = root.find(f'{{{ns}}}parent')
        if parent is not None:
            pg = parent.find(f'{{{ns}}}groupId')
            pa = parent.find(f'{{{ns}}}artifactId')
            pv = parent.find(f'{{{ns}}}version')
            if pg is not None and pa is not None and pv is not None:
                result['parent'] = (pg.text, pa.text, pv.text)
        
        props = root.find(f'{{{ns}}}properties')
        if props is not None:
            for prop in props:
                name = prop.tag.replace(f'{{{ns}}}', '')
                result['properties'][name] = prop.text
        
        for dep in root.findall(f'.//{{{ns}}}dependency'):
            g = dep.find(f'{{{ns}}}groupId')
            a = dep.find(f'{{{ns}}}artifactId')
            v = dep.find(f'{{{ns}}}version')
            scope = dep.find(f'{{{ns}}}scope')
            optional = dep.find(f'{{{ns}}}optional')
            
            if g is None or a is None:
                continue
            if scope is not None and scope.text in ('test', 'provided'):
                continue
            if optional is not None and optional.text == 'true':
                continue
            
            gv = g.text
            av = a.text
            vv = v.text if v is not None else None
            
            if vv and vv.startswith('${'):
                prop_name = vv[2:-1]
                vv = result['properties'].get(prop_name, None)
            
            if vv:
                result['dependencies'].append((gv, av, vv))
        
        return result
    except:
        return None

def resolve_and_download(g, a, v, depth=0):
    if depth > 5:
        return
    
    ok = download(g, a, v)
    if not ok:
        return
    
    path = g.replace('.', '/')
    pom_path = os.path.join(M2, path, a, v, f"{a}-{v}.pom")
    
    if not os.path.exists(pom_path):
        return
    
    result = parse_pom(pom_path)
    if result is None:
        return
    
    if result['parent']:
        pg, pa, pv = result['parent']
        resolve_and_download(pg, pa, pv, depth+1)
    
    for dg, da, dv in result['dependencies']:
        resolve_and_download(dg, da, dv, depth+1)

# Parse root POM dependencyManagement
print("Parsing root POM...")
root_pom = "/workspace/o2server/pom.xml"
tree = ET.parse(root_pom)
root = tree.getroot()
ns = 'http://maven.apache.org/POM/4.0.0'

props = {}
props_el = root.find(f'{{{ns}}}properties')
if props_el is not None:
    for prop in props_el:
        name = prop.tag.replace(f'{{{ns}}}', '')
        props[name] = prop.text

# Collect all dependencies with versions from dependencyManagement
dm_versions = {}
dm = root.find(f'{{{ns}}}dependencyManagement')
if dm is not None:
    for dep in dm.findall(f'.//{{{ns}}}dependency'):
        g = dep.find(f'{{{ns}}}groupId')
        a = dep.find(f'{{{ns}}}artifactId')
        v = dep.find(f'{{{ns}}}version')
        if g is not None and a is not None and v is not None:
            vv = v.text
            if vv.startswith('${'):
                prop_name = vv[2:-1]
                vv = props.get(prop_name, vv)
            dm_versions[f"{g.text}:{a.text}"] = vv

# Now resolve all dependencies from the root POM
for dep in root.findall(f'.//{{{ns}}}dependency'):
    g = dep.find(f'{{{ns}}}groupId')
    a = dep.find(f'{{{ns}}}artifactId')
    v = dep.find(f'{{{ns}}}version')
    scope = dep.find(f'{{{ns}}}scope')
    
    if g is None or a is None:
        continue
    if scope is not None and scope.text in ('test', 'provided'):
        continue
    
    gv = g.text
    av = a.text
    key = f"{gv}:{av}"
    
    vv = v.text if v is not None else None
    if vv and vv.startswith('${'):
        prop_name = vv[2:-1]
        vv = props.get(prop_name, None)
    
    if not vv:
        vv = dm_versions.get(key, None)
    
    if vv:
        print(f"  Resolving {gv}:{av}:{vv}")
        resolve_and_download(gv, av, vv)

print(f"\nTotal artifacts downloaded: {len(downloaded)}")
print(f"Failed: {len(failed)}")
if failed:
    for f in sorted(failed)[:20]:
        print(f"  FAILED: {f}")
