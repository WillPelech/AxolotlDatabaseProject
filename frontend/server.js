const http = require('http');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const server = http.createServer((req, res) => {
    let filePath = path.join(__dirname, 'src', req.url === '/' ? 'index.html' : req.url);
    
    // Handle environment variables in HTML files
    if (filePath.endsWith('.html')) {
        fs.readFile(filePath, 'utf8', (err, content) => {
            if (err) {
                res.writeHead(404);
                res.end('File not found');
                return;
            }
            
            // Replace environment variables
            content = content.replace('${GOOGLE_MAPS_API_KEY}', process.env.GOOGLE_MAPS_API_KEY);
            
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content);
        });
    } else {
        // Serve other files normally
        fs.readFile(filePath, (err, content) => {
            if (err) {
                res.writeHead(404);
                res.end('File not found');
                return;
            }
            
            const ext = path.extname(filePath);
            const contentType = {
                '.js': 'application/javascript',
                '.css': 'text/css',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.gif': 'image/gif',
                '.ico': 'image/x-icon'
            }[ext] || 'text/plain';
            
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        });
    }
});

const PORT = 8000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
}); 