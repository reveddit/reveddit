import React from 'react'
import Pagination from 'components/Pagination'
import ResultsSummary from 'pages/common/ResultsSummary'

const SummaryAndPagination = ({
  page_type, subreddit, num_items, num_showing,
  category_type, category_unique_field,
}) => {
  return (num_items ?
    <Pagination subreddit={subreddit} page_type={page_type}>
      <ResultsSummary num_showing={num_showing}
                      category_type={category_type}
                      category_unique_field={category_unique_field}
                      page_type={page_type} />
    </Pagination>
    : ''
  )
}

export default SummaryAndPagination
