const http = require('http');

const PORT = 3003;

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);
  
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', message: 'Firecrawl service is healthy' }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ Firecrawl service running on port ${PORT}!`);
  console.log(`📝 Health: http://localhost:${PORT}/health\n`);
});

server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});
