import React from 'react'
import { useGlobalStore } from 'state'
import { SimpleURLSearchParams } from 'utils'
import { Selection } from './SelectionBase'

const sizes = [100, 300, 500, 1000]

const setN = (searchParams, n) => {
  window.location.href =
    window.location.pathname + searchParams.set('n', n).toString()
}

const ItemsPerPage = () => {
  const global = useGlobalStore()
  const searchParams = new SimpleURLSearchParams(window.location.search)
  const n = searchParams.get('n') || global.state.n
  return (
    <Selection className="itemsPerPage" title="Items Per Page">
      <select
        value={n}
        style={{ width: '100%' }}
        onChange={e => setN(searchParams, e.target.value)}
      >
        {sizes.map(s => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </Selection>
  )
}

export default ItemsPerPage
