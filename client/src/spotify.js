import axios from "axios";

// Map for localStorage
const LOCALSTORAGE_KEYS = {
  accessToken: 'spotify_access_token',
  refreshToken: 'spotify_refresh_token',
  expireTime: 'spotify_token_expire_time',
  timestamp: 'spotify_token_timestamp',
}

// Map to retreive the values
const LOCALSTORAGE_VALUES = {
  accessToken: window.localStorage.getItem(LOCALSTORAGE_KEYS.accessToken),
  refreshToken: window.localStorage.getItem(LOCALSTORAGE_KEYS.refreshToken),
  expireTime: window.localStorage.getItem(LOCALSTORAGE_KEYS.expireTime),
  timestamp: window.localStorage.getItem(LOCALSTORAGE_KEYS.timestamp),
};

/**
 * Clear out localStorage items we've set and reload page
 * @returns {void}
 */
export const logout = () => {
  // Clear all localStorage items
  for (const property in LOCALSTORAGE_KEYS) {
    window.localStorage.removeItem(LOCALSTORAGE_KEYS[property]);
  }
  // Navigate home
  window.location = window.location.origin;
};

/**
 * We will check if the amount of time that has passed between the timestamp in localStorage and now is greater than the expiration time of 3600 seconds
 * @returns {boolean} Wheter or not the access token in localStorage has expired
 */
const hasTokenExpired = () => {
  const { accessToken, timestamp, expireTime } = LOCALSTORAGE_VALUES;

  if (!accessToken || !timestamp) {
    return false;
  }
  const millisecondsElapsed = Date.now() - Number(timestamp);

  return (millisecondsElapsed / 1000) > Number(expireTime);
}

/**
 * Use the refresh token in localStorage to hit the /refres_token endpoint in the Node app, then update values in localStorage with data from response
 * @returns {void}
 */
const refreshToken = async () => {
  try {
    // Logout if there's no refresh token stored or we've managed to get into a reload infinite loop
    if (LOCALSTORAGE_VALUES.refreshToken || LOCALSTORAGE_VALUES.refreshToken === 'undefined' || (Date.now() - Number(LOCALSTORAGE_VALUES.timestamp) / 1000) < 1000) {
      console.error('No refresh token available');
      logout();
    }

    // Use '/refresh_token' endpoint from the Node app
    const { data } = await axios.get(`refresh_token?refresh_token=${LOCALSTORAGE_VALUES.refreshToken}`);

    // Update localStorage
    window.localStorage.setItem(LOCALSTORAGE_KEYS.accessToken, data.access_token);
    window.localStorage.setItem(LOCALSTORAGE_KEYS.timestamp, Date.now());

    // Reload page for localStorage updates to reflect
    window.location.reload();
  } catch (e) {
    console.error(e);
  }
};

/**
 * Handling logic for retrieving the Spotify access token from localStorage or URL query params
 * @returns {string} A spotify access token
 */
const getAccessToken = () => {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const queryParams = {
    [LOCALSTORAGE_KEYS.accessToken]: urlParams.get('access_token'),
    [LOCALSTORAGE_KEYS.refreshToken]: urlParams.get('refresh_token'),
    [LOCALSTORAGE_KEYS.expireTime]: urlParams.get('expires_in'),
  };
  const hasErr = urlParams.get('error');

  // If error OR token in localStorage has expired, refresh token
  if (hasErr || hasTokenExpired() || LOCALSTORAGE_VALUES.accessToken === 'undefined') {
    refreshToken();
  }

  // If there's a valid access token, use that
  if (LOCALSTORAGE_VALUES.accessToken && LOCALSTORAGE_VALUES.accessToken !== 'undefined') {
    return LOCALSTORAGE_VALUES.accessToken;
  }

  // If there's a token in URL query params, user is logging in for the first time
  if (queryParams[LOCALSTORAGE_KEYS.accessToken]) {
    // Store query params in localStorage
    for (const property in queryParams) {
      window.localStorage.setItem(property, queryParams[property]);
    }
    // Then set timestamp
    window.localStorage.setItem(LOCALSTORAGE_KEYS.timestamp, Date.now());
    //Return access token from the query params
    return queryParams[LOCALSTORAGE_KEYS.accessToken];
  }

  // If none of the above are met then:
  return false;
};

export const accessToken = getAccessToken();

/**
 * Settin gup Axios global request headers
 */

axios.defaults.baseURL = 'https://api.spotify.com/v1';
axios.defaults.headers['Authorization'] = `Bearer ${accessToken}`;
axios.defaults.headers['Content-Type'] = 'application/json';

/**
 * Getting the current users profile
 * @returns {Promise}
 */
export const getCurrentUserProfile = () => axios.get('/me');

/**
 * Getting a list of the Users playlists
 * @returns {Promise}
 */
export const getCurrentUserPlaylist = (limit = 20) => {
  return axios.get(`/me/playlists?limit=${limit}`);
};

/**
 * Getting the Users top Artists and Tracks
 * @param {string} time_range - 'short_term' last 4 weeks 'medium_term' last 6 months 'long_term' several years of data and including all of the new data as it becomes available. Default is 'short_term'
 * @returns {Promise}
 */
export const getTopArtists = (time_range = 'short_term') => {
  return axios.get(`/me/top/artists?time_range=${time_range}`);
};

/**
 * Getting the Users Top Tracks
 * @param {string} time_range - 'short_term' last 4 weeks 'medium_term' last 6 months 'long_term' several years of data and including all of the new data as it becomes available. Default is 'short_term'
 * @returns {Promise}
 */
export const getTopTracks = (time_range = 'short_term') => {
  return axios.get(`/me/top/tracks?time_range=${time_range}`);
};

/**
 * Getting a single playlist by ID
 * @param {string} playlist_id is the Spotify ID of the playlist
 * @returns {Promise}
 */
export const getPlaylistById = playlist_id => {
  return axios.get(`/playlists/${playlist_id}`);
};

/**
 * Adding endpoint to get audio features for the tracks.
 * @param {string} ids which will be separated by comma for the tracks
 * @returns {Promise}
 */
export const getAudioFeatForTracks = ids => {
  return axios.get(`/audio-features?ids=${ids}`);
};