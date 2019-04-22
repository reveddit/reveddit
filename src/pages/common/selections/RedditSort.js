import React from 'react'
import { connect } from 'state'
import { getQueryParams } from 'data_processing/user'

class RedditSort extends React.Component {
  state = {
    s: getQueryParams()
  }

  getLink(sort) {
    return (<div>
              <a className={sort === this.state.s.sort ? 'selected': ''}
                 href={`${window.location.pathname}?sort=${sort}`}>{sort}</a>
            </div>)
  }

  render() {
    return (
        <div className='redditSort selection'>
          <div className='title'>Sort By</div>
          {['user'].includes(this.props.page_type) ?
            <React.Fragment>
              {this.getLink('new')}
              {this.getLink('top')}
              {this.getLink('hot')}
              {this.getLink('controversial')}
            </React.Fragment>
          :
            ''
          }
        </div>
    )
  }
}

export default connect(RedditSort)
