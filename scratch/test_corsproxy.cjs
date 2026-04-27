const https = require('https');

https.get('https://corsproxy.io/?https%3A%2F%2Fiptv-epg.org%2Ffiles%2Fepg-ph.xml', (res) => {
  console.log('Status Code:', res.statusCode);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Total length:', data.length);
    console.log('Starts with:', data.substring(0, 100));
  });
}).on('error', (err) => {
  console.log('Error:', err.message);
});
