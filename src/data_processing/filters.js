import { REMOVAL_META, USER_REMOVED, LOCKED, COLLAPSED,
         MISSING_IN_THREAD, ORPHANED, AUTOMOD_REMOVED } from 'pages/common/RemovedBy'
import { TAG_META, QUARANTINE, MOD, ADMIN } from 'pages/common/selections/TagsFilter'
import { itemIsCollapsed, commentIsOrphaned, commentIsMissingInThread,
         postRemovedUnknownWithin } from 'utils'

const otherActions = {
  [USER_REMOVED]: true,
  [LOCKED]: true,
  [COLLAPSED]: true,
  [MISSING_IN_THREAD]: true,
  [ORPHANED]: true
}

const actions_that_are_other_and_removedBy = {[AUTOMOD_REMOVED]: true}

export const filterSelectedActions = (selectedActions) => {
  const selectedOtherActions = selectedActions.filter(a => a in otherActions || a in actions_that_are_other_and_removedBy)
  const selectedRemovedByActions = selectedActions.filter(a => ! (a in otherActions))
  return [selectedOtherActions, selectedRemovedByActions]
}

export const itemIsOneOfSelectedActions = (item, selectedOtherActions, selectedRemovedByActions) => {
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
        if (commentIsOrphaned(item)) return true
        break
      case AUTOMOD_REMOVED:
        if (postRemovedUnknownWithin(item)) return true
        break
    }
  }
  for (const type of selectedRemovedByActions) {
    if ( (! item.removedby && item.removed ) || item.removedby === type) {
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
