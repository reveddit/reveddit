import React from 'react'
import SnuOwnd from 'snuownd'
import { AUTOMOD_REMOVED_MOD_APPROVED, UNKNOWN_REMOVED } from 'pages/common/RemovedBy'
import scrollToElement from 'scroll-to-element'
import {useRef, useEffect} from 'react'
import { DateUtils } from 'react-day-picker'
import { NewWindowLink } from 'components/Misc'

const markdown = SnuOwnd.getParser()
const chrome_base = 'https://chrome.google.com/webstore/detail/'
const ff_base = 'https://addons.mozilla.org/en-US/firefox/addon/'
export const now = Math.floor(new Date()/1000)
export const getNow = () => Math.floor(new Date()/1000)

export const ext_urls = {
  rt: {
    n: 'Reveddit Real-Time',
    c: chrome_base+'reveddit-real-time/ickfhlplfbipnfahjbeongebnmojbnhm',
    f: ff_base+'reveddit-real-time/'
  },
  linker: {
    n: 'Reveddit Linker',
    c: chrome_base+'revddit-linker/jgnigeenijnjlahckhfomimnjadmkmah',
    f: ff_base+'reveddit-linker/'
  },
  q: {
    n: 'Reveddit Quarantined',
    c: chrome_base+'revddit-quarantined/cmfgeilnphkjendelakiniceinhjonfh',
    f: ff_base+'reveddit-quarantined/'
  },
  rager: {
    n: 'rAger',
    c: chrome_base+'rager/fohlpjahcdbkpcckapphhpahbiajccmj'
  }
}

export const makeDonateVisible = () => {
  document.getElementById('donate-ribbon').style.visibility = 'visible'
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

export const textSaysRemoved = (text) => {
  return removeBackslashEquals(text, REMOVED)
}

export const textSaysDeleted = (text) => {
  return removeBackslashEquals(text, DELETED)
}

const bodyRemoved = (comment) => {
  return textSaysRemoved(comment.body)
}

export const authorDeleted = (item) => {
  return textSaysDeleted(item.author)
}

export const validAuthor = (author) => {
  return author && ! textSaysDeleted(author)
}

export const commentIsDeleted = comment => {
  return textSaysDeleted(comment.body) && authorDeleted(comment)
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

export const postIsRemovedAndSelftextSaysRemoved = post => {
  return itemIsRemovedOrDeleted(post) && removeBackslashEquals(post.selftext, REMOVED)
}

export const display_post = (list, post, ps_item, isInfoPage=false) => {
  if (post.subreddit_type !== 'user' &&
        (isInfoPage ||
          (post.whitelist_status !== 'promo_adult_nsfw' && ! post.over_18 &&
            ( ! ps_item ||
              ps_item.thumbnail !== 'nsfw')))) {
    list.push(post)
  }
}

// Default thumbnails for reddit threads
export const redditThumbnails = ['self', 'default', 'image', 'nsfw']

// Parse comments
export const parse = text => markdown.render(text)

export const markdownToHTML = text => markdown.render(replaceAmpGTLT(text))

// Reddit format for scores, e.g. 12000 => 12k
export const prettyScore = score => {
  if (score >= 100000) {
    return `${(score / 1000).toFixed(0)}k`
  } else if (score >= 10000) {
    return `${(score / 1000).toFixed(1)}k`
  }

  return score
}

export const prettyFormatBigNumber = num => {
  const abs = Math.abs(num), sign = Math.sign(num)
  return abs > 999999 ?
    sign*((abs/1000000).toFixed(1)) + 'm'
    : abs > 999 ? sign*((abs/1000).toFixed(1)) + 'k' : sign*abs
}


// Retrieve, store and delete stuff in the local storage
export const get = (key, defaultValue) => {
  const value = window.localStorage.getItem(key)
  return value !== null ? JSON.parse(value) : defaultValue
}

export const put = (key, value) => window.localStorage.setItem(key, JSON.stringify(value))

export const getPrettyTimeLength = (seconds, conservative=false) => {
  const thresholds = [[60, 'second', 'seconds'], [60, 'minute', 'minutes'], [24, 'hour', 'hours'], [7, 'day', 'days'],
                   [365/12/7, 'week', 'weeks'], [12, 'month', 'months'], [10, 'year', 'years'],
                   [10, 'decade', 'decades'], [10, 'century', 'centuries'], [10, 'millenium', 'millenia']]
  if (seconds < 60) return Math.round(seconds) + ' seconds'
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
      const mathFunc = i <= 1 && conservative ? Math.round : Math.floor
      if (mathFunc(time) > 1 || mathFunc(time) == 0) {
        text = textPlural
      }
      if (i > 1 && prevUnitTime > 0) {
        let remainText = thresholds[i-1][1]
        if (prevUnitTime > 1) {
          remainText = thresholds[i-1][2]
        }
        text += ', ' + String(prevUnitTime) + ' ' + remainText
      }
      return String(mathFunc(time)) + ' ' + text
    }
    time = time / divisor
  }
}
export const getPrettyDate = (createdUTC, noAgo = false) => {
  const seconds = Math.floor((new Date).getTime()/1000)-createdUTC
  return getPrettyTimeLength(seconds) + (noAgo ? '' : ' ago')
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
      return decodeURIComponent(this.params[param])
    } else {
      return null
    }
  }
  removeBackslash(exclude = new Set()) {
    for (const key of Object.keys(this.params)) {
      let value = this.get(key)
      const newKey = key.replace(/\\|%5C/g, '')
      if (! exclude.has(newKey)) {
        value = value.replace(/\\|%5C/g, '')
      }
      if (key !== newKey) {
        this.delete(key)
      }
      this.set(newKey, value)
    }
    return this
  }
  set(param, value) {
    this.params[param] = encodeURIComponent(value).replace(/[!()*]/g, escape)
    return this
  }
  setParams(params) {
    Object.entries(params).forEach(([k, v]) => this.set(k, v))
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
      const search = queryVals.join('&')
      const extraAMP = search.slice(-1) === '.' ? '&' : ''
      return '?'+search+extraAMP
    } else {
      return ''
    }
  }
}

export const ifNumParseInt = (x) => {
  if (/^\d+$/.test(x)) {
    return parseInt(x)
  }
  return x
}

export const roundToX = (num, X) => {
    return +(Math.round(num + "e+"+X)  + "e-"+X);
}

export const replaceAmpGTLT = (string) => {
  return string.replace(/&amp;/g, '&').replace(/&gt;/g, '>').replace(/&lt;/g, '<')
}

export const normalizeTextForComparison = (text) => replaceAmpGTLT(text).replace(/\W/g,'')

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

export const copyLink = (e, useHref = false) => {
  e.preventDefault()
  if (useHref) {
    copyToClipboard(e.target.href)
  } else {
    copyToClipboard(getUrlWithTimestamp())
  }
  e.target.title='copied link'
}


export const jumpToHash = (hash, offset = -10) => {
  if (hash) {
    try {
      scrollToElement(hash.replace(/\\|%5C/g, ''), { offset });
    } catch (err) {
      console.warn('error in hash', hash)
    }
  }
}

export const jumpToCurrentHash = () => jumpToHash(window.location.hash)

export const jumpToCurrentHash_ifNoScroll = (prevY) => {
  if (window.scrollY === prevY) {
    jumpToCurrentHash()
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
  itemIsCollapsed(item) || item.locked || commentIsOrphaned(item) || commentIsMissingInThread(item)

export const itemIsCollapsed = (item) => {
  return item.collapsed && item.score > 0 && ! item.removed && ! item.deleted && ! item.locked
}

export const commentIsMissingInThread = (comment) => {
  return comment.missing_in_thread
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

export const shuffle = (array) => {
  var currentIndex = array.length, temporaryValue, randomIndex
  while (0 !== currentIndex) {
    randomIndex = Math.floor(Math.random() * currentIndex)
    currentIndex -= 1
    temporaryValue = array[currentIndex]
    array[currentIndex] = array[randomIndex]
    array[randomIndex] = temporaryValue
  }
  return array
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

export const archiveTimes_isCurrent = (archiveTimes) => (now - archiveTimes.updated) < 60*15

export const getRemovedMessage = (props, itemType) => {
  let removedMessage = ' before archival'
  const {archiveTimes, error, loading} = props.global.state
  if (props.retrieved_on) {
    // In August or September 2021, archive started overwriting comments after a day or two
    if ('body' in props && props.created_utc > 1629248296 && props.retrieved_on-props.created_utc > 43200) {
      removedMessage = <>Click Restore to try an alternate source. This comment may not have been archived in time or <NewWindowLink reddit='/pgzdav'>may have been overwritten</NewWindowLink> after {getPrettyTimeLength(props.retrieved_on-props.created_utc)}.</>
    } else {
      removedMessage = ' before archival,'+getRemovedWithinText(props)
    }
  } else if (loading) {
    removedMessage = ' content loading...'
  } else if (error) {
    return '[error connecting to archive, try again later]'
  } else if (archiveTimes) {
    if (archiveTimes_isCurrent(archiveTimes)) {
      removedMessage += ' The current delay is '+getPrettyTimeLength(archiveTimes.updated - archiveTimes[itemType])
    } else {
      removedMessage = ', archive currently unavailable'
    }
  }
  return <>[removed] {removedMessage}</>
}

export const getRemovedWithinText = (props) => {
  return props.retrieved_on ?
    ' within '+getPrettyTimeLength(props.retrieved_on-props.created_utc)
    : ''
}

export const postRemovedUnknownWithin = (post) => {
  return post.removed && post.removedby === UNKNOWN_REMOVED &&
    post.retrievalLatency < 300
}

const prefix_str_list = (list, prefix = '/') => {
  return list.map(x => prefix+x)
}

export const PATHS_SUB = ['v','r']
export const PATHS_STR_SUB = PATHS_SUB.join('')
export const PATHS_USER = ['y','u','user']

export const PATH_STR_SUB = '/'+PATHS_SUB[0]
export const PATH_STR_USER = '/'+PATHS_USER[0]
export const PATHS_ALT_SUB = prefix_str_list(PATHS_SUB.slice(1))
export const PATHS_ALT_USER = prefix_str_list(PATHS_USER.slice(1))
export const PATH_REDDIT_STR_SUB = '/r'
export const PATH_REDDIT_STR_USER = '/user'

const convertPathPrefix = (path, searchPrefix, replacePrefix) => path.replace(new RegExp(`^${searchPrefix}/`), replacePrefix+'/')
export const convertPathSub = (path) => convertPathPrefix(path, PATH_REDDIT_STR_SUB, PATH_STR_SUB)
export const convertPathUser = (path) => convertPathPrefix(path, PATH_REDDIT_STR_USER, PATH_STR_USER)
export const convertPathSub_reverse = (path) => convertPathPrefix(path, PATH_STR_SUB, PATH_REDDIT_STR_SUB)

export const stripHTTP = (url) => url.replace(/^https?:\/\//i,'')
export const stripRedditLikeDomain_noHTTP = (url) => url.replace(/^[^/]*(reddit\.com|removeddit\.com|ceddit\.com|unreddit\.com|snew\.github\.io|snew\.notabug\.io|politicbot\.github\.io|r\.go1dfish\.me|reve?ddit\.com)/i,'')

export const stripRedditLikeDomain = (url) => {
  const path = stripRedditLikeDomain_noHTTP(stripHTTP(url))
  if (path.match(/^\//)) {
    return convertPathUser(convertPathSub(path))
  }
  return url
}

export const matchOrIncludes = (str, search, useMatch = true) => {
  if (useMatch) {
    let result = false
    try {
      result = str.match(search)
    } catch (err) {
      return false
    }
    return result
  }
  return str.includes(search)
}

export const sortCreatedAsc = (a,b) => a.created_utc - b.created_utc

export const isEmptyObj = (x) => typeof(x) === 'object' && Object.keys(x).length === 0

export const escapeRegExp = (text) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')

export const truthyOrUndefined = (value) => value || value === undefined

const dateToEpoch = (date) => Math.floor(date/1000)

export const unitInSeconds = { s: 1, m: 60, h: 3600, d: 86400, w: 604800, M: 2628000, y: 31536000 }
export const DATE_UNIT = '-'

export const parseDateISOString = (s) => {
  let ds = s.match(/\d{1,4}/g) || []
  if (ds.length > 1 && ds[1] > 0) {
    if (ds[1].length > 2) {
      //e.g. 20100304 where ds = ['2010', '0304']
      ds = [ds[0], ...ds[1].match(/\d{1,2}/g)]
    }
    ds[1] = ds[1] - 1 // adjust month
  }
  const date = new Date(...ds)
  if (DateUtils.isDate(date)) {
    return date
  }
  return undefined
}

export const convertToEpoch = (number, unit) => {
  const now = dateToEpoch(new Date())
  if (! unit) {
    return number
  } else if (unit in unitInSeconds) {
    return now - number*unitInSeconds[unit]
  } else if (unit === DATE_UNIT) {
    const validEpoch = dateToEpoch(parseDateISOString(number))
    if (validEpoch) {
      return validEpoch
    }
  }
  return now
}

export const swapKeysAndValues = obj => Object.fromEntries(Object.entries(obj).map(a => a.reverse()))

export const formatBytes = (bytes, decimals = 1) => {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}
