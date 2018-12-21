import React from 'react'
import { withRouter } from 'react-router';
import { connect } from 'state'

class CategoryFilter extends React.Component {

  componentDidMount() {
    const queryParams = new URLSearchParams(this.props.location.search)
    const type = this.props.type
    if (queryParams.get(type)) {
      this.props.global.setCategoryFilter(type, queryParams.get(type))
    }
  }

  updateStateAndURL = (event) => {
    const value = event.target.value
    const type = this.props.type
    this.props.global.setCategoryFilter(type, value)
    const queryParams = new URLSearchParams(this.props.location.search)
    if (value !== 'all') {
      queryParams.set(type, value)
    } else {
      queryParams.delete(type)
    }
    let to = `${this.props.location.pathname}?${queryParams.toString()}`
    this.props.history.push(to)
  }

  render() {
    const category_visible_counts = {}
    const category_counts = {}
    const category_unique_to_displayValue = {}

    const { type, title } = this.props
    let unique_field = type
    if (this.props.unique_field) {
      unique_field = this.props.unique_field
    }
    this.props.allItems.forEach(item => {
      const unique_value = item[unique_field]
      category_visible_counts[unique_value] = 0
      category_unique_to_displayValue[unique_value] = item[type]
      if (unique_value in category_counts) {
        category_counts[unique_value] += 1
      } else {
        category_counts[unique_value] = 1
      }
    })
    this.props.visibleItems.forEach(item => {
      category_visible_counts[item[unique_field]] += 1
    })
    const category_ordered = Object.keys(category_visible_counts).sort((a,b) => {
      let alpha = a.toLowerCase() < b.toLowerCase() ? -1 : 1
      return (category_visible_counts[b] - category_visible_counts[a]) || alpha
    })
    let categoryFilter = this.props.global.state['categoryFilter_'+type]
    if (! categoryFilter) {
      categoryFilter = 'all'
    }

    return (
      <div className={`categoryFilter selection filter ${categoryFilter !== 'all'? 'set': ''}`}>
        <div className='title'>{title}</div>
        <select value={categoryFilter} onChange={this.updateStateAndURL}>
          <option key='all' value='all'>all</option>
          {
            category_ordered.map(category => {
              return (
                <option key={category} value={category}>
                  {category_unique_to_displayValue[category]} ({`${category_visible_counts[category]} / ${category_counts[category]}`})
                </option>
              )
            })
          }
        </select>
      </div>
    )
  }
}

export default withRouter(connect(CategoryFilter))
