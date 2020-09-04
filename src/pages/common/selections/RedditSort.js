import React from 'react'
import { connect } from 'state'

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
        <div className='redditSort selection'>
          <div className='title'>Sort By</div>
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
        </div>
    )
  }
}

export default connect(RedditSort)
