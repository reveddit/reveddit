import { REMOVAL_META, USER_REMOVED, LOCKED } from 'pages/common/RemovedBy'
import { TAG_META, QUARANTINE, MOD, ADMIN } from 'pages/common/selections/TagsFilter'

export const itemIsOneOfSelectedRemovedBy = (item, gs) => {
  if (gs.removedByFilter[USER_REMOVED] && item.deleted) {
    return true
  } else if (gs.removedByFilter[LOCKED] && item.locked) {
    return true
  } else {
    const filters = Object.keys(gs.removedByFilter)
    for (let i = 0; i < filters.length; i++) {
      const type = filters[i]
      if (item.removedby && item.removedby === type) {
        return true
      }
    }
  }
  return false
}

export const itemIsOneOfSelectedTags = (item, gs) => {
  const setTags = Object.keys(gs.tagsFilter)
  for (let i = 0; i < setTags.length; i++) {
    const type = setTags[i]
    if (TAG_META[type].values.includes(item[TAG_META[type].field])) {
      return true
    }
  }
  return false
}
