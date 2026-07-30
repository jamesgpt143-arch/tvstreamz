fetch('https://lite.duckduckgo.com/lite/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
  },
  body: 'q=' + encodeURIComponent('latest news philippines today')
})
.then(r => r.text())
.then(html => {
  const snippets = [...html.matchAll(/<td class='result-snippet'[^>]*>(.*?)<\/td>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').trim()).slice(0, 5);
  console.log(JSON.stringify(snippets, null, 2));
});
