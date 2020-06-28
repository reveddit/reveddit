import { REMOVAL_META, USER_REMOVED, LOCKED, COLLAPSED, MISSING_IN_THREAD, ORPHANED } from 'pages/common/RemovedBy'
import { TAG_META, QUARANTINE, MOD, ADMIN } from 'pages/common/selections/TagsFilter'
import { itemIsCollapsed, commentIsOrphaned, commentIsMissingInThread } from 'utils'
export const itemIsOneOfSelectedRemovedBy = (item, gs) => {
  if (gs.removedByFilter[USER_REMOVED] && item.deleted) {
    return true
  } else if (gs.removedByFilter[LOCKED] && item.locked) {
    return true
  } else if (gs.removedByFilter[COLLAPSED] && itemIsCollapsed(item)) {
    return true
  } else if (gs.removedByFilter[MISSING_IN_THREAD] && commentIsMissingInThread(item)) {
    return true
  } else if (gs.removedByFilter[ORPHANED] && commentIsOrphaned(item)) {
    return true
  } else {
    const filters = Object.keys(gs.removedByFilter)
    for (let i = 0; i < filters.length; i++) {
      const type = filters[i]
      if ( (! item.removedby && item.removed ) || item.removedby === type) {
        return true
      }
    }
  }
  return false
}

export const itemIsOneOfSelectedTags = (item, gs) => {
  const {moderators, moderated_subreddits} = gs
  const subreddit_lc = item.subreddit.toLowerCase()
  const setTags = Object.keys(gs.tagsFilter)
  for (let i = 0; i < setTags.length; i++) {
    const type = setTags[i]
    if (TAG_META[type].values.includes(item[TAG_META[type].field])) {
      return true
    } else if (type === MOD && ((moderators[subreddit_lc] || {})[item.author] || moderated_subreddits[subreddit_lc])) {
      return true
    }
  }
  return false
}
