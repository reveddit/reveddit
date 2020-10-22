import React from 'react'
import { connect } from 'state'
import { Selection } from './SelectionBase'

class RedditSort extends React.Component {

  getLink(sort, selectedSort) {
    return (<div>
              <a className={sort === selectedSort ? 'selected': ''}
                 href={`${window.location.pathname}?sort=${sort}`}>{sort}</a>
            </div>)
  }

  render() {
    const {sort} = this.props.global.state
    return (
      <Selection className='redditSort' title='Sort By'>
        {['user'].includes(this.props.page_type) ?
          <React.Fragment>
            {this.getLink('new', sort)}
            {this.getLink('top', sort)}
            {this.getLink('hot', sort)}
            {this.getLink('controversial', sort)}
          </React.Fragment>
        :
          ''
        }
      </Selection>
    )
  }
}

export default connect(RedditSort)
