import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = process.env.PORT || 10000;
const DIST_DIR = path.join(process.cwd(), 'dist');

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url);

                                   if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
                                         filePath = path.join(DIST_DIR, 'index.html');
                                   }

                                   const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

                                   fs.readFile(filePath, (err, content) => {
                                         if (err) {
                                                 res.writeHead(500);
                                                 res.end('Server Error');
                                         } else {
                                                 res.writeHead(200, { 'Content-Type': contentType });
                                                 res.end(content, 'utf-8');
                                         }
                                   });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
