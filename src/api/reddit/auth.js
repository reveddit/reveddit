import {www_reddit, www_reddit_slash} from 'api/reddit'
import {getCustomClientID, extensionIsInstalled, reddit_API_rules_changed} from 'utils'

// Token for reddit API
let token, expires

let client_id = REDDIT_API_CLIENT_ID

const getToken = async () => {
  // already have an unexpired token
  if (token !== undefined && expires > Date.now()/1000) {
    return Promise.resolve(token)
  }
  const user_client_id = getCustomClientID()
  // use user-set client ID if it exists and is non-empty, otherwise use Reveddit client ID
  client_id = user_client_id || client_id
  if (await extensionIsInstalled()) {
    console.log('extension >3.0 is installed')
    if (reddit_API_rules_changed && ! user_client_id) {
      return null
    }
  } else {
    console.log('extension >3.0 is NOT installed')
  }
  // Headers for getting reddit api token
  const tokenInit = {
    headers: {
      Authorization: 'Basic '+window.btoa(client_id+':'),
      'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
    },
    method: 'POST',
    body: `grant_type=${encodeURIComponent('https://oauth.reddit.com/grants/installed_client')}&device_id=DO_NOT_TRACK_THIS_DEVICE`
  }

  return window.fetch(www_reddit+'/api/v1/access_token', tokenInit)
    .then(response => response.json())
    .then(response => {
      token = response.access_token
      expires = Date.now()/1000 + response.expires_in - 1
      return token
    })
}

// Get header for general api calls
export const getAuth = async (host) => {
  if (host === www_reddit_slash) {
    return {}
  }
  const token = await getToken()
  if (token) {
    return {
        headers: {
          Authorization: `bearer ${token}`,
          'Accept-Language': 'en',
        }
    }
  }
  return {}
}
