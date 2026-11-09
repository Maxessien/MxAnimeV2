
export const MEDIA_BY_MAL_ID_QUERY = `
  query ($idMal: Int) {
    Media (idMal: $idMal, type: ANIME) {
      id
      idMal
      format
      episodes
      status
      description(asHtml: false)
      coverImage {
        extraLarge
        large
        medium
      }
      status
      title {
        romaji
        english
        native
        userPreferred
      }
      startDate {
        year
        month
        day
      }
      airingSchedule(notYetAired: false, perPage: 50) {
        nodes {
          id
          episode
          airingAt
          timeUntilAiring
        }
      }
      endDate {
        year
        month
        day
      }
      nextAiringEpisode {
        id
        airingAt
        timeUntilAiring
        episode
        mediaId
      }
      trailer {
        id
        site
        thumbnail
      }
      relations {
        edges {
          id
          relationType
          node {
            id
            idMal
            type
            format
            title {
              romaji
              english
              native
              userPreferred
            }
          }
        }
      }
      siteUrl
    }
  }
`;

export const PREQUEL_MINIMAL_QUERY = `
  query ($id: Int) {
    Media (id: $id, type: ANIME) {
      id
      idMal
      format
      relations {
        edges {
          relationType
          node {
            id
            idMal
            type
            format
          }
        }
      }
    }
  }
`;

export const RECENTLY_AIRED = `
  query ($airingAt_lesser: Int, $page: Int, $perPage: Int, $airingAt_greater: Int = 0) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        total
        perPage
        currentPage
        lastPage
        hasNextPage
      }
      airingSchedules(airingAt_lesser: $airingAt_lesser, airingAt_greater: $airingAt_greater, sort: TIME_DESC) {
        id
        episode
        airingAt
        timeUntilAiring
        media {
          id
          idMal
          format
          description(asHtml: false)
          title { romaji english }
          coverImage { large }
          startDate {year}
        }
      }
    }
  }
`;
