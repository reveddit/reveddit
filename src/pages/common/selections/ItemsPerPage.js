import React from 'react'
import { connect } from 'state'
import {SimpleURLSearchParams} from 'utils'

const sizes = [100, 300, 500, 1000]

const setN = (searchParams, n) => {
  window.location.href = window.location.pathname+searchParams.set('n', n).toString()
}

const ItemsPerPage = ({global}) => {
  const searchParams = new SimpleURLSearchParams(window.location.search)
  const n = searchParams.get('n') || global.state.n
  return (
    <div className='selection itemsPerPage'>
      <div className='title nowrap'>Items Per Page</div>
        <select value={n} style={{width: '100%'}} onChange={(e) => setN(searchParams, e.target.value)}>
          {sizes.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
    </div>
  )
}

export default connect(ItemsPerPage)
