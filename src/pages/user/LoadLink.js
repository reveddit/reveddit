import React from 'react'
import { Link } from 'react-router-dom'
import { connect } from '../../state'
import { withRouter } from 'react-router';


class LoadAllLink extends React.Component {

  render() {
    let userPage_after   = this.props.global.state.userNext.userPage_after
    let searchPage_after = this.props.global.state.userNext.searchPage_after
    let className = 'load-next'
    let text = 'view more'
    let to = this.props.location.pathname+this.props.location.search

    if (this.props.loadAll) {
      className = 'load-all'
      to = '?all'
      text = 'load all'
    }
    if (userPage_after && ! this.props.show) {
      return <Link className={className} to={to} onClick={() => {

        this.props.this.getItems_wrapper(this.props.user, this.props.kind, this.props.sort, '', userPage_after, this.props.limit, this.props.loadAll, searchPage_after)
      }}>{text}</Link>
    } else {
      return ''
    }
  }
}
export default withRouter(connect(LoadAllLink))
