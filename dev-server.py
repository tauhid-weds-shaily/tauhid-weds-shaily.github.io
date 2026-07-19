#!/usr/bin/env python3
"""
Local dev server that mimics GitHub Pages:
any path that doesn't match a real file serves 404.html (status 404),
with the browser URL preserved — exactly how personalized /invite/<code>
links behave in production.

Usage:  python3 dev-server.py        (then open http://localhost:8000)
Not needed in production — GitHub Pages does this natively.
"""
import http.server
import os

PORT = 8000
ROOT = os.path.dirname(os.path.abspath(__file__))


class PagesHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def send_error(self, code, message=None, explain=None):
        # Serve 404.html for unknown paths, like GitHub Pages does.
        if code == 404:
            page = os.path.join(ROOT, "404.html")
            if os.path.isfile(page):
                with open(page, "rb") as f:
                    body = f.read()
                self.send_response(404)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
                return
        super().send_error(code, message, explain)


if __name__ == "__main__":
    with http.server.ThreadingHTTPServer(("", PORT), PagesHandler) as httpd:
        print(f"Serving on http://localhost:{PORT} (GitHub Pages 404 emulation on)")
        httpd.serve_forever()
