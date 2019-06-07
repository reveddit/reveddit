import React from 'react'
import {connect} from 'state'
import RemovedFilter from 'pages/common/selections/RemovedFilter'
import RemovedByFilter from 'pages/common/selections/RemovedByFilter'
import CategoryFilter from 'pages/common/selections/CategoryFilter'
import LocalSort from 'pages/common/selections/LocalSort'
import RedditSort from 'pages/common/selections/RedditSort'
import Content from 'pages/common/selections/Content'
import TextFilter from 'pages/common/selections/TextFilter'
import UpvoteRemovalRateHistory from 'pages/common/selections/UpvoteRemovalRateHistory'
import ResultsSummary from 'pages/common/ResultsSummary'

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
    const { subreddit, page_type, visibleItemsWithoutCategoryFilter, num_items, num_showing,
            category_type, category_title, category_unique_field } = this.props
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
                case 'domain_posts':
                  return (
                    <React.Fragment>
                      {page_type !== 'domain_posts' &&
                        <Content page_type={page_type}/>
                      }
                      <LocalSort page_type={page_type}/>
                      <RemovedFilter page_type={page_type} />
                      <RemovedByFilter page_type={page_type} />
                      <CategoryFilter page_type={page_type}
                        visibleItemsWithoutCategoryFilter={visibleItemsWithoutCategoryFilter}
                        type={category_type} title={category_title} unique_field={category_unique_field}/>
                      {subreddit !== 'all' && page_type !== 'domain_posts' &&
                        <UpvoteRemovalRateHistory page_type={page_type}/>
                      }
                      <TextFilter page_type={page_type} />
                    </React.Fragment>)
                case 'subreddit_comments':
                  return (
                    <React.Fragment>
                      <Content page_type={page_type}/>
                      <LocalSort page_type={page_type} />
                      <RemovedFilter page_type={page_type} />
                      <RemovedByFilter page_type={page_type} />
                      <CategoryFilter page_type={page_type}
                        visibleItemsWithoutCategoryFilter={visibleItemsWithoutCategoryFilter}
                        type={category_type} title={category_title} unique_field={category_unique_field}/>
                      {subreddit !== 'all' &&
                        <UpvoteRemovalRateHistory page_type={page_type}/>
                      }
                      <TextFilter page_type={page_type} />
                    </React.Fragment>)
                case 'user':
                  return (
                    <React.Fragment>
                      <Content page_type={page_type} />
                      <RedditSort page_type={page_type} />
                      <RemovedFilter page_type={page_type} />
                      <RemovedByFilter page_type={page_type} />
                      <CategoryFilter page_type={page_type}
                        visibleItemsWithoutCategoryFilter={visibleItemsWithoutCategoryFilter}
                        type={category_type} title={category_title} unique_field={category_unique_field}/>
                      <TextFilter page_type={page_type} />
                    </React.Fragment>)
                case 'thread':
                  return (
                    <React.Fragment>
                      <LocalSort page_type={page_type} />
                      <RemovedFilter page_type={page_type} />
                      <RemovedByFilter page_type={page_type} />
                      {subreddit !== 'all' &&
                        <UpvoteRemovalRateHistory page_type={page_type}/>
                      }
                    </React.Fragment>)
                default: return ''
              }
            })()}
          </div>
        }
        {num_items ?
          <ResultsSummary num_showing={num_showing}
                          category_type={category_type}
                          category_unique_field={category_unique_field}
                          page_type={page_type} />
                          : ''
        }
      </React.Fragment>
    )
  }
}

export default connect(Selections)
