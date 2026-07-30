fetch('https://news.google.com/rss/search?q=philippines')
.then(r => r.text())
.then(xml => {
  const titles = [...xml.matchAll(/<title>(.*?)<\/title>/gi)].map(m => m[1]).slice(1, 6);
  console.log(titles);
});
