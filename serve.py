#!/usr/bin/env python3
"""Threaded static file server with HTTP Range support (needed for smooth <video> playback).

`python3 -m http.server` is single-threaded and ignores Range headers, which makes
browsers fall back to downloading the whole file before they can buffer/play smoothly.
"""
import os
import re
import sys
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

class RangeHTTPRequestHandler(SimpleHTTPRequestHandler):
    def send_head(self):
        path = self.translate_path(self.path)
        if os.path.isdir(path) or not os.path.exists(path):
            return super().send_head()

        range_header = self.headers.get('Range')
        if not range_header:
            f = super().send_head()
            return f

        file_size = os.path.getsize(path)
        m = re.match(r'bytes=(\d*)-(\d*)', range_header)
        if not m:
            self.send_response(416)
            self.end_headers()
            return None

        start_s, end_s = m.groups()
        start = int(start_s) if start_s else 0
        end = int(end_s) if end_s else file_size - 1
        end = min(end, file_size - 1)
        if start > end or start >= file_size:
            self.send_response(416)
            self.send_header('Content-Range', f'bytes */{file_size}')
            self.end_headers()
            return None

        length = end - start + 1
        f = open(path, 'rb')
        f.seek(start)

        ctype = self.guess_type(path)
        self.send_response(206)
        self.send_header('Content-type', ctype)
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Content-Range', f'bytes {start}-{end}/{file_size}')
        self.send_header('Content-Length', str(length))
        self.end_headers()

        self._range_length = length
        return f

    def copyfile(self, source, outputfile):
        length = getattr(self, '_range_length', None)
        if length is None:
            return super().copyfile(source, outputfile)
        remaining = length
        bufsize = 64 * 1024
        while remaining > 0:
            chunk = source.read(min(bufsize, remaining))
            if not chunk:
                break
            outputfile.write(chunk)
            remaining -= len(chunk)

    def guess_type(self, path):
        if path.endswith('.mp4'):
            return 'video/mp4'
        return super().guess_type(path)

port = int(sys.argv[1]) if len(sys.argv) > 1 else 4137
ThreadingHTTPServer(("", port), RangeHTTPRequestHandler).serve_forever()
