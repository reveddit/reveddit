import SnuOwnd from 'snuownd'
import { AUTOMOD_REMOVED_MOD_APPROVED } from 'pages/common/RemovedBy'

const markdown = SnuOwnd.getParser()

// Flatten arrays one level
export const flatten = arr => arr.reduce(
  (accumulator, value) => accumulator.concat(value),
  []
)

// Take on big array and split it into an array of chunks with correct size
export const chunk = (arr, size) => {
  const chunks = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

// Change bases
export const toBase36 = number => parseInt(number, 10).toString(36)
export const toBase10 = numberString => parseInt(numberString, 36)

// Reddits way of indicating that something is deleted (the '\\' is for Reddit and the other is for pushshift)
export const isDeleted = textBody => textBody === '\\[deleted\\]' || textBody === '[deleted]'

// Reddits way of indicating that something is deleted
export const isRemoved = textBody => textBody === '\\[removed\\]' || textBody === '[removed]'

export const isComment = item => {
  return item.name.slice(0,2) === 't1'
}

export const isPost = item => {
  return item.name.slice(0,2) === 't3'
}

export const commentIsDeleted = comment => {
  return comment.body.replace(/\\/g,'') === '[deleted]' && comment.author.replace(/\\/g,'') === '[deleted]'
}

export const commentIsRemoved = comment => {
  return comment.body.replace(/\\/g,'') === '[removed]' && comment.author.replace(/\\/g,'') === '[deleted]'
}

export const itemIsRemovedOrDeleted = item => {
  if (item.name.slice(0,2) === 't1') {
    return item.body.replace(/\\/g,'') === '[removed]' && item.author.replace(/\\/g,'') === '[deleted]'
  } else if (item.name.slice(0,2) === 't3') {
    return ! item.is_robot_indexable
  }
}

export const postIsDeleted = post => {
  if (itemIsRemovedOrDeleted(post)) {
    return post.author.replace(/\\/g,'') === '[deleted]'
  }
  return false
}

export const display_post = (list, post) => {
  if (! ('whitelist_status' in post && post.whitelist_status == "promo_adult_nsfw")) {
    list.push(post)
  }
}

// Default thumbnails for reddit threads
export const redditThumbnails = ['self', 'default', 'image', 'nsfw']

// Parse comments
export const parse = text => markdown.render(text)

// Reddit format for scores, e.g. 12000 => 12k
export const prettyScore = score => {
  if (score >= 100000) {
    return `${(score / 1000).toFixed(0)}k`
  } else if (score >= 10000) {
    return `${(score / 1000).toFixed(1)}k`
  }

  return score
}

// Retrieve, store and delete stuff in the local storage
export const get = (key, defaultValue) => {
  const value = window.localStorage.getItem(key)
  return value !== null ? JSON.parse(value) : defaultValue
}

export const put = (key, value) => window.localStorage.setItem(key, JSON.stringify(value))

// Sorting for comments
export const topSort = (commentA, commentB) => {
  if (commentA.score > commentB.score) return -1
  if (commentA.score < commentB.score) return 1
  return 0
}

export const bottomSort = (commentA, commentB) => {
  if (commentA.score < commentB.score) return -1
  if (commentA.score > commentB.score) return 1
  return 0
}

export const newSort = (commentA, commentB) => {
  if (commentA.created_utc > commentB.created_utc) return -1
  if (commentA.created_utc < commentB.created_utc) return 1
  return 0
}

export const oldSort = (commentA, commentB) => {
  if (commentA.created_utc < commentB.created_utc) return -1
  if (commentA.created_utc > commentB.created_utc) return 1
  return 0
}

// Filter comments
export const showRemoved = comment => comment.removed === true
export const showDeleted = comment => comment.deleted === true
export const showRemovedAndDeleted = comment => comment.removed === true || comment.deleted === true || comment.removedby === AUTOMOD_REMOVED_MOD_APPROVED

export const getPrettyTimeLength = (seconds) => {
  const thresholds = [[60, 'second', 'seconds'], [60, 'minute', 'minutes'], [24, 'hour', 'hours'], [7, 'day', 'days'],
                   [365/12/7, 'week', 'weeks'], [12, 'month', 'months'], [10, 'year', 'years'],
                   [10, 'decade', 'decades'], [10, 'century', 'centuries'], [10, 'millenium', 'millenia']]
  if (seconds < 60) return seconds + ' seconds'
  let time = seconds
  for (var i=0; i<thresholds.length; i++) {
    let divisor = thresholds[i][0]
    let text = thresholds[i][1]
    let textPlural = thresholds[i][2]
    if (time < divisor) {
      let extra = (time - Math.floor(time))
      let prevUnitTime = Math.round(extra*thresholds[i-1][0])
      if (Math.floor(time) > 1 || Math.floor(time) == 0) {
        text = textPlural
      }
      if (i > 1 && prevUnitTime > 0) {
        let remainText = thresholds[i-1][1]
        if (prevUnitTime > 1) {
          remainText = thresholds[i-1][2]
        }
        text += ', ' + String(prevUnitTime) + ' ' + remainText
      }
      return String(Math.floor(time)) + ' ' + text
    }
    time = time / divisor
  }
}
export const getPrettyDate = (createdUTC) => {
  const seconds = Math.floor((new Date).getTime()/1000)-createdUTC
  return getPrettyTimeLength(seconds) + ' ago'
}

export const getQueryString = (queryParams) => {
  let queryVals = []
  for (var key in queryParams) {
      queryVals.push(key+'='+queryParams[key])
  }
  return '?'+queryVals.join('&')
}

export const roundToX = (num, X) => {
    return +(Math.round(num + "e+"+X)  + "e-"+X);
}

export const replaceAmpGTLT = (string) => {
  return string.replace(/&amp;/g, '&').replace(/&gt;/g, '>').replace(/&lt;/g, '<')
}
