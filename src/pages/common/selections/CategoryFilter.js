import React, {useState, useMemo} from 'react'
import { connect } from 'state'
import { Selection } from './SelectionBase'

const CategoryFilter = connect((props) => {
  const { global, type, title, page_type, filterDependencies } = props
  let unique_field = type
  if (props.unique_field) {
    unique_field = props.unique_field
  }
  const {items} = global.state
  const [sortAtoZ, setSortAtoZ] = useState(false)
  const computeCountMeta = () => {
    const category_visible_counts = {}
    const category_counts = {}
    const category_unique_to_displayValue = {}
    items.forEach(item => {
      const unique_value = item[unique_field]
      category_visible_counts[unique_value] = 0
      category_unique_to_displayValue[unique_value] = item[type]
      if (unique_value in category_counts) {
        category_counts[unique_value] += 1
      } else {
        category_counts[unique_value] = 1
      }
    })
    props.visibleItemsWithoutCategoryFilter.forEach(item => {
      category_visible_counts[item[unique_field]] += 1
    })

    return {category_unique_to_displayValue,
            category_counts,
            category_visible_counts,
           }
  }
  const {category_unique_to_displayValue,
         category_counts,
         category_visible_counts,
       } = useMemo(computeCountMeta, [filterDependencies])
  const category_ordered = useMemo(() => {
    return Object.keys(category_visible_counts).sort((a,b) => {
      const alpha = a.toLowerCase() < b.toLowerCase() ? -1 : 1
      const byCount = (category_visible_counts[b] - category_visible_counts[a])
      if (sortAtoZ) {
        return alpha || byCount
      }
      return byCount || alpha
    })
  }, [filterDependencies, sortAtoZ])
  let categoryFilter = global.state['categoryFilter_'+type]
  if (! categoryFilter) {
    categoryFilter = 'all'
  }
  const updateStateAndURL = global.categoryFilter_update

  return (
    <Selection className='categoryFilter' isFilter={true} isSet={categoryFilter !== 'all'} title={title}>
      <select value={categoryFilter}
        onChange={(e) => updateStateAndURL(type, e.target.value, page_type )}>
        <option key='all' value='all'>all</option>
        {
          category_ordered.map(category => {
            let displayValue = category_unique_to_displayValue[category]
            if (! displayValue) {
              //handle when [deleted] author gets filled in
              return null
            }
            if (displayValue.length > 30) {
              displayValue = displayValue.substr(0, 30)+'...'
            }
            return (
              <option key={category} value={category}>
                ({`${category_visible_counts[category]} / ${category_counts[category]}`}) {displayValue}
              </option>
            )
          })
        }
      </select>
      <label>
        <input type='checkbox' checked={sortAtoZ} value='sort A-Z' onChange={() => setSortAtoZ(! sortAtoZ)}/>
        <span>sort a-z</span>
      </label>
    </Selection>
  )
})

export default CategoryFilter
