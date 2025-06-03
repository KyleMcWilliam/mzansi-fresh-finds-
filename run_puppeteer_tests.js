const puppeteer = require('puppeteer');
const path = require('path');
const http = require('http');
const fs = require('fs');
const { promisify } = require('util');

const PORT = 8080; // Define a port for the server

// Promisify fs functions
const statAsync = promisify(fs.stat);
const readFileAsync = promisify(fs.readFile);

// Simple HTTP server
const server = http.createServer(async (req, res) => {
  const filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
  // Basic security: Ensure the path is within the current directory
  if (!filePath.startsWith(path.join(__dirname))) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Forbidden');
      console.log(`SERVER_FORBIDDEN_ACCESS: ${filePath}`);
      return;
  }
  // console.log(`SERVER_REQUEST: ${req.url} -> ${filePath}`); // Can be noisy

  try {
    const stats = await statAsync(filePath);
    if (stats.isDirectory()) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Directory listing forbidden');
      console.log(`SERVER_FORBIDDEN_DIR: ${filePath}`);
      return;
    }

    const data = await readFileAsync(filePath);
    let contentType = 'text/plain';
    if (filePath.endsWith('.html')) {
      contentType = 'text/html';
    } else if (filePath.endsWith('.js')) {
      contentType = 'application/javascript';
    } else if (filePath.endsWith('.css')) {
      contentType = 'text/css';
    } else if (filePath.endsWith('.json')) {
      contentType = 'application/json';
    } else if (filePath.endsWith('.svg')) {
        contentType = 'image/svg+xml';
    }


    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
    // console.log(`SERVER_SERVED: ${filePath}`); // Can be noisy
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found');
      console.log(`SERVER_NOT_FOUND: ${filePath}`);
    } else {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`Server error: ${error.message}`);
      console.error(`SERVER_ERROR: ${filePath}`, error);
    }
  }
});

(async () => {
  let browser;
  try {
    await new Promise(resolve => server.listen(PORT, 'localhost', resolve)); // Listen only on localhost
    console.log(`HTTP server started on http://localhost:${PORT}`);

    console.log('Launching browser...');
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
      ]
    });
    console.log('Browser launched.');
    const page = await browser.newPage();

    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'log' || type === 'info') {
        console.log(`PAGE_CONSOLE_LOG: ${text}`);
      } else if (type === 'warn') {
        console.warn(`PAGE_CONSOLE_WARN: ${text}`);
      } else if (type === 'error') {
        console.error(`PAGE_CONSOLE_ERROR: ${text}`);
      } else {
        console.log(`PAGE_CONSOLE_${type.toUpperCase()}: ${text}`);
      }
    });

    page.on('pageerror', error => {
        console.error(`PAGE_ERROR: ${error.message}`);
    });

    page.on('requestfailed', request => {
        if (request.url().endsWith('favicon.ico')) return;
        console.error(`PAGE_REQUEST_FAILED: ${request.url()} ${request.failure().errorText}`);
    });

    const testPageUrl = `http://localhost:${PORT}/tests/test-runner.html`;
    console.log(`Navigating to ${testPageUrl}...`);

    await page.goto(testPageUrl, { waitUntil: 'networkidle0' });

    console.log('Page loaded. Waiting for tests to complete (max 15 seconds)...');

    try {
        await page.waitForSelector('#test-summary', { timeout: 15000 });
        console.log('Test summary element detected.');
    } catch (e) {
        console.warn('Timed out waiting for #test-summary. Tests might not have completed or reported summary.');
        const bodyHandle = await page.$('body');
        if (bodyHandle) {
            const htmlContent = await page.evaluate(body => body.innerHTML, bodyHandle);
            console.log("Current body content on timeout:\n", htmlContent);
            await bodyHandle.dispose();
        }
    }

    console.log('Closing browser.');
    await browser.close();
    console.log('Browser closed.');

  } catch (error) {
    console.error('Error during Puppeteer execution:', error);
    if (browser) {
      await browser.close();
      console.log('Browser closed due to error.');
    }
    process.exitCode = 1;
  } finally {
    console.log('Closing HTTP server...');
    server.close(() => {
      console.log('HTTP server closed.');
      // Ensure process exits after server closes, respecting any error code
      // process.exit(process.exitCode || 0); // This can be problematic if node is still running other tasks.
                                           // Let the script end naturally.
    });
  }
})();
