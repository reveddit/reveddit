import SnuOwnd from 'snuownd'
import { AUTOMOD_REMOVED_MOD_APPROVED } from 'pages/common/RemovedBy'
import scrollToElement from 'scroll-to-element'
import {useRef, useEffect} from 'react'

const markdown = SnuOwnd.getParser()
const chrome_base = 'https://chrome.google.com/webstore/detail/'
const ff_base = 'https://addons.mozilla.org/en-US/firefox/addon/'

export const ext_urls = {
  rt: {
    c: chrome_base+'reveddit-real-time/ickfhlplfbipnfahjbeongebnmojbnhm',
    f: ff_base+'reveddit-real-time/'
  },
  linker: {
    c: chrome_base+'revddit-linker/jgnigeenijnjlahckhfomimnjadmkmah',
    f: ff_base+'reveddit-linker/'
  },
  language: {
    c: chrome_base+'revddit-language-fix/fcpgnheagjkmelppbpnbpfimmmjicknj',
    f: ff_base+'reveddit-language-fix/'
  },
  q: {
    c: chrome_base+'revddit-quarantined/cmfgeilnphkjendelakiniceinhjonfh',
    f: ff_base+'reveddit-quarantined/'
  }
}

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

export const isCommentID = id => {
  return id.slice(0,2) === 't1'
}

export const isPostID = id => {
  return id.slice(0,2) === 't3'
}

const DELETED = '[deleted]'
const REMOVED = '[removed]'

const removeBackslash = (str) => {
  return str.replace(/\\/g,'')
}

const removeBackslashEquals = (str, constant) => {
  return removeBackslash(str) === constant
}

const bodyRemoved = (comment) => {
  return removeBackslashEquals(comment.body, REMOVED)
}

const authorDeleted = (item) => {
  return removeBackslashEquals(item.author, DELETED)
}

export const commentIsDeleted = comment => {
  return removeBackslashEquals(comment.body, DELETED) && authorDeleted(comment)
}

export const commentIsRemoved = comment => {
  return bodyRemoved(comment) && authorDeleted(comment)
}

export const itemIsRemovedOrDeleted = (item, checkCommentBody=true) => {
  if (item.name.slice(0,2) === 't1') {
    if (checkCommentBody) {
      return bodyRemoved(item) && authorDeleted(item)
    } else {
      return removeBackslash(item.author).match(/^\[/)
    }
  } else if (item.name.slice(0,2) === 't3') {
    return ! item.is_robot_indexable
  }
}

export const postIsDeleted = post => {
  return itemIsRemovedOrDeleted(post) && authorDeleted(post)
}

export const postIsRemoved = post => {
  return itemIsRemovedOrDeleted(post) && ! authorDeleted(post)
}

export const display_post = (list, post, ps_item, isInfoPage=false) => {
  if (post.subreddit_type !== 'user' &&
        (isInfoPage ||
          (! ('whitelist_status' in post && post.whitelist_status == "promo_adult_nsfw") &&
            ( ! ps_item ||
              ! ('thumbnail' in ps_item && ps_item.thumbnail == 'nsfw'))))) {
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

export const kFormatter = num => {
    return Math.abs(num) > 999 ? Math.sign(num)*((Math.abs(num)/1000).toFixed(1)) + 'k' : Math.sign(num)*Math.abs(num)
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
      if (thresholds[i-1][0] === prevUnitTime) {
        time += 1
        prevUnitTime = 0
      }
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

// because archive.is & older iOS safari versions do not support URLSearchParams
export class SimpleURLSearchParams {
  //?removal_status=all
  constructor(search = undefined) {
    const params = {}
    if (search !== undefined) {
      search.replace(/^\?/,'').split('&').forEach(kv => {
        const [key, value] = kv.split('=')
        if (key) {
          params[key] = value
        }
      })
    }
    this.params = params
  }
  has(param) {
    return (param in this.params)
  }
  get(param) {
    if (param in this.params) {
      return this.params[param]
    } else {
      return null
    }
  }
  set(param, value) {
    this.params[param] = value
    return this
  }
  delete(param) {
    delete this.params[param]
    return this
  }
  toString() {
    let queryVals = []
    for (var key in this.params) {
        queryVals.push(key+'='+this.params[key])
    }
    if (queryVals.length) {
      return '?'+queryVals.join('&')
    } else {
      return ''
    }
  }
}


export const roundToX = (num, X) => {
    return +(Math.round(num + "e+"+X)  + "e-"+X);
}

export const replaceAmpGTLT = (string) => {
  return string.replace(/&amp;/g, '&').replace(/&gt;/g, '>').replace(/&lt;/g, '<')
}

export const fetchWithTimeout = (url, options, timeout = 4000) => {
    return Promise.race([
        fetch(url, options),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), timeout)
        )
    ]);
}

export const reversible = (func, reverse) => {
  if (reverse) {
    return (a, b) => func(b, a)
  } else {
    return (a, b) => func(a, b)
  }
}

export const getUrlWithTimestamp = () => {
  let urlWithTimestamp = window.location.href
  if (! urlWithTimestamp.match(/[?&]before=/)) {
    const now = Math.floor(new Date()/1000)
    if (urlWithTimestamp.match(/\?/)) {
      urlWithTimestamp += '&'
    } else {
      urlWithTimestamp += '?'
    }
    urlWithTimestamp += `before=${now}`
  }
  return urlWithTimestamp
}

export const copyToClipboard = (str) => {
  const el = document.createElement('textarea')
  el.value = str
  document.body.appendChild(el)
  el.select()
  document.execCommand('copy')
  document.body.removeChild(el)
}

export const copyLink = (e) => {
  e.preventDefault()
  copyToClipboard(e.target.href)
  e.target.title='copied link'
}


export const jumpToHash = (hash) => {
  if (hash) {
    scrollToElement(hash, { offset: -10 });
  }
}

const reduceItems = (obj, val) => {
  obj[val.id] = val
  return obj
}

export const getUniqueItems = (arrayOfArrays) => {
  let map = {}
  arrayOfArrays.forEach(array => {
    if (array) {
      map = array.reduce(reduceItems, map)
    }
  })
  return Object.values(map)
}

export const sleeper = (ms) => {
  return function(x) {
    return new Promise(resolve => setTimeout(() => resolve(x), ms))
  }
}

export const promiseDelay = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const itemIsActioned = item =>
  item.removed || item.deleted || item.removedby === AUTOMOD_REMOVED_MOD_APPROVED ||
  itemIsCollapsed(item) || item.locked || commentIsOrphaned(item)

export const itemIsCollapsed = (item) => {
  return item.collapsed && item.score > 0 && ! item.removed && ! item.deleted
}

export const not = (f) => {
  return function () {
    return ! f.apply(this, arguments)
  }
}

export const commentIsOrphaned = (comment) => {
  return comment.parent_removed_label || comment.post_removed_label
}

export const getRandomInt = (max) => {
  return Math.floor(Math.random() * Math.floor(max));
}

export const usePrevious = (value) => {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

export const useFocus = () => {
    const ref = useRef(null)
    const setFocus = () => {ref.current &&  ref.current.focus()}
    return [ref, setFocus]
}

export const paramString = (params) => {
  return Object.keys(params).map(k => `${k}=${params[k]}`).join('&')
}
