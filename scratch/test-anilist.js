import fetch from 'node-fetch';

const query = `
  query ($page: Int, $perPage: Int, $search: String, $sort: [MediaSort], $genre: String) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        currentPage
        hasNextPage
        lastPage
      }
      media(search: $search, type: ANIME, sort: $sort, genre: $genre) {
        idMal
        id
        title {
          romaji
          english
        }
        coverImage {
          large
        }
        description(asHtml: false)
        format
        status
        averageScore
        genres
        episodes
      }
    }
  }
`;

const variables = {
  page: 1,
  perPage: 5,
  search: "by the grace of gods",
  sort: ["POPULARITY_DESC"]
};

fetch('https://graphql.anilist.co', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query, variables })
})
.then(res => res.json())
.then(data => console.log(JSON.stringify(data, null, 2)))
.catch(err => console.error(err));
