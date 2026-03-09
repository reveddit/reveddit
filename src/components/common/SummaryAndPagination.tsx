import React from 'react'
import Pagination from 'components/Pagination'
import ResultsSummary from 'components/common/ResultsSummary'

const SummaryAndPagination = ({
  subreddit,
  num_items,
  num_showing,
  category_type,
  category_unique_field,
}) => {
  return num_items ? (
    <Pagination subreddit={subreddit}>
      <ResultsSummary
        num_showing={num_showing}
        category_type={category_type}
        category_unique_field={category_unique_field}
      />
    </Pagination>
  ) : (
    ''
  )
}

export default SummaryAndPagination
