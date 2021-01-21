import {useEffect} from 'react'
import { reversible } from 'utils'

export const useSort = (global, viewableItems, sortFn) => {
  const {items, localSort, localSortReverse} = global.state
  // dependencies:
  //    items.length b/c only need to sort when new items are added
  //    using viewableItems.length as a dep. would require resorting when filters change
  useEffect(() => {
    if (sortFn && viewableItems.length) {
      global.setState({items: items.sort(reversible(sortFn, localSortReverse))})
    }
  }, [items.length, localSort, localSortReverse])
  return null
}
