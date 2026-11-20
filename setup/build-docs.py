#!/usr/bin/env python3
"""Builds docs.html (the Plugin API docs page) from PLUGINS.md, using about.html for the site header and footer.
Run from the site folder:  python3 setup/build-docs.py     (needs: pip install markdown)
Also adds the "Docs" link to the navigation of every site page (safe to run again)."""
import re, glob, html, markdown, os
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
NAV_OLD = '<a href="download.html" data-p="download">Download</a><a href="about.html" data-p="about">About</a>'
NAV_NEW = '<a href="download.html" data-p="download">Download</a><a href="docs.html" data-p="docs">Docs</a><a href="about.html" data-p="about">About</a>'
FOOT_OLD = '<a href="download.html">Download</a><a href="about.html">About</a>'
FOOT_NEW = '<a href="download.html">Download</a><a href="docs.html">Docs</a><a href="about.html">About</a>'
for f in glob.glob('*.html'):
    s = open(f, encoding='utf-8').read(); t = s
    if 'docs.html' not in t:
        t = t.replace(NAV_OLD, NAV_NEW).replace(FOOT_OLD, FOOT_NEW)
    if t != s: open(f, 'w', encoding='utf-8').write(t)
body = markdown.markdown(open('PLUGINS.md', encoding='utf-8').read(), extensions=['fenced_code', 'tables', 'sane_lists'])
# headings get ids so people can link to a section
body = re.sub(r'<h2>(.*?)</h2>', lambda m: '<h2 id="%s">%s</h2>' % (re.sub(r'[^a-z0-9]+', '-', re.sub('<.*?>', '', m.group(1)).lower()).strip('-'), m.group(1)), body)
body = body.replace('<h1>Mosaic plugin API</h1>', '<h1>Plugin API</h1>')
about = open('about.html', encoding='utf-8').read()
head, rest = about.split('<main id="main">', 1)
foot = rest[rest.index('</main>'):]
head = re.sub(r'<title>.*?</title>', '<title>Plugin API docs · Mosaic</title>', head)
head = re.sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="How to build, test and publish a Mosaic plugin: manifest, permissions, the plugin API and the Plugin store.">', head)
head = head.replace('data-page="about"', 'data-page="docs"')
cta = '<div class="cta" style="margin-top:28px"><a class="btn pri lg" href="app.html">Open the workspace</a><span class="muted"> Settings → Plugins → Plugin store / Submit a plugin</span></div>'
page = head + '<main id="main">\n<div class="page"><div class="wrap prose doc">\n<p class="lead">Build a plugin for Mosaic, test it, and share it through the Plugin store.</p>\n' + body + '\n' + cta + '</div></div>\n' + foot
open('docs.html', 'w', encoding='utf-8').write(page)
print('docs.html written,', len(page), 'bytes')
