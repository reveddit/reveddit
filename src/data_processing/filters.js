import { REMOVAL_META, USER_REMOVED, LOCKED } from 'pages/common/RemovedBy'


export const itemIsOneOfSelectedRemovedBy = (item, gs) => {
  if (gs.removedByFilter[USER_REMOVED] && item.deleted) {
    return true
  } else if (gs.removedByFilter[LOCKED] && item.locked) {
    return true
  } else {
    for (let i = 0; i < Object.keys(REMOVAL_META).length; i++) {
      const type = Object.keys(REMOVAL_META)[i]
      if (gs.removedByFilter[type] && item.removedby && item.removedby === type) {
        return true
      }
    }
  }
  return false
}
