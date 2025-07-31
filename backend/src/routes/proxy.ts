import { Router } from 'express';
import axios from 'axios';

const router = Router();

// Proxy endpoint for handling CORS issues with external files
router.get('/proxy', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL' });
    }

    // Fetch the file
    const response = await axios.get(url, {
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ISODocumentViewer/1.0)',
      },
    });

    // Forward headers
    const contentType = response.headers['content-type'];
    const contentLength = response.headers['content-length'];
    
    if (contentType) res.setHeader('Content-Type', contentType);
    if (contentLength) res.setHeader('Content-Length', contentLength);
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    
    // Stream the response
    response.data.pipe(res);
  } catch (error) {
    console.error('Proxy error:', error);
    if (axios.isAxiosError(error) && error.response) {
      res.status(error.response.status).json({ 
        error: `Failed to fetch resource: ${error.response.statusText}` 
      });
    } else {
      res.status(500).json({ error: 'Failed to fetch resource' });
    }
  }
});

export default router;