import { REMOVAL_META, USER_REMOVED, LOCKED, COLLAPSED,
         MISSING_IN_THREAD, ORPHANED, AUTOMOD_REMOVED,
         MOD_OR_AUTOMOD_REMOVED, UNKNOWN_REMOVED, ANTI_EVIL_REMOVED,
       } from 'pages/common/RemovedBy'
import { TAG_META, QUARANTINE, MOD, ADMIN } from 'pages/common/selections/TagsFilter'
import { itemIsCollapsed, commentIsOrphaned, commentIsMissingInThread,
         postRemovedUnknownWithin } from 'utils'

const otherActions = {
  [USER_REMOVED]: 1,
  [LOCKED]: 1,
  [COLLAPSED]: 1,
  [MISSING_IN_THREAD]: 1,
  [ORPHANED]: 1,
  [ANTI_EVIL_REMOVED]: 1,
}

const actions_that_are_other_and_removedBy = {[AUTOMOD_REMOVED]: 1}

const actions_that_are_unknown_without_archive_data = {
  [MOD_OR_AUTOMOD_REMOVED]: 1,
  [AUTOMOD_REMOVED]: 1,
  [UNKNOWN_REMOVED]: 1,
}

export const filterSelectedActions = (selectedActions) => {
  const selectedOtherActions = selectedActions.filter(a => a in otherActions || a in actions_that_are_other_and_removedBy)
  const selectedRemovedByActions = selectedActions.filter(a => ! (a in otherActions))
  return [selectedOtherActions, selectedRemovedByActions]
}

export const itemIsOneOfSelectedActions = (item, selectedOtherActions, selectedRemovedByActions, exclude_action = undefined) => {
  for (const action of selectedOtherActions) {
    switch(action) {
      case USER_REMOVED:
        if (item.deleted) return true
        break
      case LOCKED:
        if (item.locked) return true
        break
      case COLLAPSED:
        if (itemIsCollapsed(item)) return true
        break
      case MISSING_IN_THREAD:
        if (commentIsMissingInThread(item)) return true
        break
      case ORPHANED:
        if (commentIsOrphaned(item) && (! exclude_action || ! item.removed) ) return true
        break
      case AUTOMOD_REMOVED:
        if (postRemovedUnknownWithin(item)) return true
        break
      case ANTI_EVIL_REMOVED:
        if (item.removedby_evil) return true
        break
    }
  }
  for (const type of selectedRemovedByActions) {
    if ( (! item.removedby && item.removed && type in actions_that_are_unknown_without_archive_data) || item.removedby === type) {
      return true
    }
  }
  return false
}

export const itemIsOneOfSelectedTags = (item, gs) => {
  const {moderators, moderated_subreddits} = gs
  const subreddit_lc = item.subreddit.toLowerCase()
  for (const type of Object.keys(gs.tagsFilter)) {
    if (TAG_META[type].values.includes(item[TAG_META[type].field])) {
      return true
    } else if (type === MOD && ((moderators[subreddit_lc] || {})[item.author] || moderated_subreddits[subreddit_lc])) {
      return true
    }
  }
  return false
}
