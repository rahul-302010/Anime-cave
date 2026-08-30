/**
 * AniList GraphQL service - backend handles all data requests
 * file: backend/src/services/anilist.js:1
 */
const ANILIST_URL = process.env.ANILIST_API || "https://graphql.anilist.co";

async function anilistFetch(query, variables = {}) {
  const res = await fetch(ANILIST_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify({ query, variables })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AniList error ${res.status}: ${text}`);
  }
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

export async function fetchTrending(page = 1, perPage = 20) {
  const query = `
    query($page:Int,$perPage:Int){
      Page(page:$page, perPage:$perPage){
        pageInfo{ total currentPage lastPage hasNextPage }
        media(sort:POPULARITY_DESC, type:ANIME, isAdult:false){
          id
          title{ romaji english native }
          coverImage{ large extraLarge color }
          bannerImage
          format
          episodes
          duration
          status
          season
          seasonYear
          averageScore
          popularity
          genres
          description
        }
      }
    }`;
  const data = await anilistFetch(query, { page, perPage });
  return data.Page;
}

export async function searchAnime(search, page = 1, perPage = 20) {
  const query = `
    query($search:String,$page:Int,$perPage:Int){
      Page(page:$page, perPage:$perPage){
        pageInfo{ total currentPage lastPage hasNextPage }
        media(search:$search, type:ANIME, isAdult:false, sort:POPULARITY_DESC){
          id
          title{ romaji english native }
          coverImage{ large extraLarge color }
          bannerImage
          format
          episodes
          duration
          status
          season
          seasonYear
          averageScore
          popularity
          genres
          description
        }
      }
    }`;
  const data = await anilistFetch(query, { search, page, perPage });
  return data.Page;
}

export async function fetchAnimeDetail(id) {
  const query = `
    query($id:Int){
      Media(id:$id, type:ANIME){
        id
        title{ romaji english native }
        coverImage{ large extraLarge color }
        bannerImage
        format
        episodes
        duration
        status
        season
        seasonYear
        averageScore
        popularity
        genres
        description
        trailer{ id site thumbnail }
        studios(isMain:true){ nodes{ name } }
        nextAiringEpisode{ airingAt episode }
        startDate{ year month day }
        endDate{ year month day }
      }
    }`;
  const data = await anilistFetch(query, { id: Number(id) });
  return data.Media;
}
