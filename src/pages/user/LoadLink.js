import React from 'react'
import { Link } from 'react-router-dom'
import { connect } from 'state'
import { getRevdditUserItems } from 'data_processing/user'
import { SimpleURLSearchParams } from 'utils'

class LoadLink extends React.Component {

  render() {
    const {userNext, show} = this.props.global.state
    let className = 'load-next'
    let text = 'view more'
    let to = window.location.pathname+window.location.search
    const otherState = {}
    if (this.props.loadAll) {
      otherState.all = true
      const queryParams_tmp = new SimpleURLSearchParams(window.location.search)
      queryParams_tmp.set('all', 'true')
      to = `${window.location.pathname}${queryParams_tmp.toString()}`
      className = 'load-all'
      text = 'load all'
    }
    if (userNext && ! show) {
      return <Link className={className} to={to} onClick={() => {
        this.props.global.setLoading('', otherState)
        .then(() => {
          getRevdditUserItems(this.props.user,
                              this.props.kind,
                              this.props.global,
                              false,
                             )
        })
      }}>{text}</Link>
    } else {
      return ''
    }
  }
}
export default connect(LoadLink)
