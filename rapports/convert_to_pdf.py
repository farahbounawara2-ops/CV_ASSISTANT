import os
import re
import subprocess
import markdown

script_dir = os.path.dirname(os.path.abspath(__file__))
md_path = os.path.join(script_dir, "rapport-academique-cv-assistant.md")
html_path = os.path.join(script_dir, "rapport-academique-cv-assistant.html")
pdf_path = os.path.join(script_dir, "rapport-academique-cv-assistant.pdf")

with open(md_path, "r", encoding="utf-8") as f:
    md_content = f.read()

# Preprocess mermaid diagrams before markdown processing
# Convert ```mermaid ... ``` to <div class="mermaid">...</div>
def replace_mermaid(match):
    code = match.group(1).strip()
    return f'<div class="mermaid">\n{code}\n</div>'

processed_md = re.sub(r'```mermaid\s*\n(.*?)\n```', replace_mermaid, md_content, flags=re.DOTALL)

# Convert Markdown to HTML
html_body = markdown.markdown(
    processed_md,
    extensions=['extra', 'toc', 'sane_lists']
)

# Build full academic HTML template
full_html = f"""<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>Rapport Académique : CV Tailor AI</title>
  
  <!-- MathJax for rendering LaTeX formulas -->
  <script>
  window.MathJax = {{
    tex: {{
      inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
      displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']]
    }},
    svg: {{
      fontCache: 'global'
    }}
  }};
  </script>
  <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>

  <!-- Mermaid.js for diagrams -->
  <script type="module">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
    mermaid.initialize({{
      startOnLoad: true,
      theme: 'neutral',
      themeVariables: {{
        primaryColor: '#eff6ff',
        primaryBorderColor: '#3b82f6',
        primaryTextColor: '#1e293b',
        lineColor: '#2563eb'
      }}
    }});
  </script>

  <style>
    @page {{
      size: A4 portrait;
      margin: 18mm 16mm 18mm 16mm;
    }}
    
    * {{
      box-sizing: border-box;
    }}

    body {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.55;
      color: #1e293b;
      background-color: #ffffff;
      margin: 0;
      padding: 0;
    }}

    h1, h2, h3, h4, h5, h6 {{
      color: #0f172a;
      font-weight: 700;
      page-break-after: avoid;
    }}

    h1 {{
      font-size: 20pt;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 6px;
      margin-top: 0;
      margin-bottom: 12px;
      color: #0f172a;
    }}

    h2 {{
      font-size: 14pt;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
      margin-top: 22px;
      margin-bottom: 10px;
      color: #1e3a8a;
      page-break-after: avoid;
    }}

    h3 {{
      font-size: 11.5pt;
      margin-top: 16px;
      margin-bottom: 6px;
      color: #1e40af;
      page-break-after: avoid;
    }}

    h4 {{
      font-size: 10.5pt;
      margin-top: 12px;
      margin-bottom: 4px;
      color: #334155;
      page-break-after: avoid;
    }}

    p {{
      margin-top: 0;
      margin-bottom: 8px;
      text-align: justify;
    }}

    ul, ol {{
      margin-top: 0;
      margin-bottom: 10px;
      padding-left: 20px;
    }}

    li {{
      margin-bottom: 3px;
    }}

    hr {{
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 18px 0;
    }}

    code {{
      font-family: Consolas, "Courier New", monospace;
      font-size: 8.5pt;
      background-color: #f1f5f9;
      color: #0f172a;
      padding: 1.5px 4px;
      border-radius: 3px;
      border: 1px solid #e2e8f0;
    }}

    pre {{
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 12px;
      overflow-x: auto;
      font-size: 8pt;
      line-height: 1.4;
      page-break-inside: avoid;
      margin-bottom: 12px;
    }}

    pre code {{
      background-color: transparent;
      padding: 0;
      border: none;
      color: #1e293b;
    }}

    table {{
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      font-size: 8.5pt;
      page-break-inside: avoid;
    }}

    th, td {{
      border: 1px solid #cbd5e1;
      padding: 6px 8px;
      text-align: left;
    }}

    th {{
      background-color: #f1f5f9;
      color: #0f172a;
      font-weight: 600;
    }}

    tr:nth-child(even) {{
      background-color: #f8fafc;
    }}

    blockquote {{
      margin: 10px 0;
      padding: 6px 12px;
      border-left: 3.5px solid #2563eb;
      background-color: #eff6ff;
      color: #1e3a8a;
      page-break-inside: avoid;
    }}

    .mermaid {{
      display: flex;
      justify-content: center;
      margin: 14px 0;
      background-color: #f8fafc;
      padding: 12px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      page-break-inside: avoid;
    }}

    a {{
      color: #2563eb;
      text-decoration: none;
    }}

    a:hover {{
      text-decoration: underline;
    }}
  </style>
</head>
<body>
{html_body}
</body>
</html>"""

with open(html_path, "w", encoding="utf-8") as f:
    f.write(full_html)

print(f"Generated HTML successfully: {html_path}")

# Run Edge headless to print PDF
edge_candidates = [
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
]
edge_path = next((p for p in edge_candidates if os.path.exists(p)), None)

if not edge_path:
    raise RuntimeError("Microsoft Edge executable not found for PDF rendering.")

cmd = [
    edge_path,
    "--headless",
    "--disable-gpu",
    "--no-pdf-header-footer",
    "--virtual-time-budget=8000",
    "--run-all-compositor-stages-before-draw",
    f"--print-to-pdf={pdf_path}",
    html_path
]

print("Executing Microsoft Edge headless PDF compiler...")
res = subprocess.run(cmd, capture_output=True, text=True)

if os.path.exists(pdf_path) and os.path.getsize(pdf_path) > 0:
    print(f"SUCCESS: Created PDF at {pdf_path} ({os.path.getsize(pdf_path)} bytes)")
else:
    print(f"PDF creation failed. Stdout: {res.stdout}, Stderr: {res.stderr}")
