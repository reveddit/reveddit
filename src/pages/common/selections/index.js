import React from 'react'
import {connect} from 'state'
import RemovedFilter from 'pages/common/selections/RemovedFilter'
import RemovedByFilter from 'pages/common/selections/RemovedByFilter'
import CategoryFilter from 'pages/common/selections/CategoryFilter'
import LocalSort from 'pages/common/selections/LocalSort'

class Selections extends React.Component {
  state = {
    displayFilters: true
  }
  toggleDisplayFilters = () => {
    this.setState({displayFilters: ! this.state.displayFilters})
  }
  getDisplayFiltersText() {
    if (this.state.displayFilters) {
      return '[–] hide filters'
    } else {
      return '[+] show filters'
    }
  }
  render () {
    const { page_type, visibleItems, allItems,
            category_type, category_title } = this.props
    return (
      <React.Fragment>
        <div className='toggleFilters'><a onClick={this.toggleDisplayFilters}
                className='collapseToggle'>
                {this.getDisplayFiltersText()}</a>
        </div>
        {this.state.displayFilters &&
          <div className='selections'>
            {(() => {
              switch(page_type) {
                case 'subreddit_posts':
                  return (
                    <React.Fragment>
                      <LocalSort page_type={page_type}/>
                      <RemovedFilter page_type={page_type} />
                      <RemovedByFilter />
                      <CategoryFilter visibleItems={visibleItems} allItems={allItems}
                        type={category_type} title={category_title}/>
                    </React.Fragment>)
                case 'subreddit_comments':
                  return (
                    <React.Fragment>
                      <LocalSort page_type={page_type} />
                      <RemovedFilter page_type={page_type} />
                      <RemovedByFilter />
                      <CategoryFilter visibleItems={visibleItems} allItems={allItems}
                        type={category_type} title={category_title}/>
                    </React.Fragment>)
                case 'user':
                  return (
                    <React.Fragment>
                      <RemovedFilter page_type={page_type} />
                      <RemovedByFilter />
                      <CategoryFilter visibleItems={visibleItems} allItems={allItems}
                        type={category_type} title={category_title}/>
                    </React.Fragment>)
                case 'thread':
                  return (
                    <React.Fragment>
                      <LocalSort page_type={page_type} />
                      <RemovedFilter page_type={page_type} />
                      <RemovedByFilter />
                    </React.Fragment>)
                default: return ''
              }
            })()}
          </div>
        }
      </React.Fragment>
    )
  }
}

export default connect(Selections)
