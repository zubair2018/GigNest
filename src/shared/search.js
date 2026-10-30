export function normalizeSearchText(value = '') {
  return String(value).trim().toLowerCase().replace(/\s+/g, ' ')
}

export function matchesListingSearch(listing, filters) {
  const query = normalizeSearchText(filters.query)
  const location = normalizeSearchText(filters.location)

  if (filters.category && filters.category !== 'All' && listing.category !== filters.category) {
    return false
  }

  if (location && !normalizeSearchText(listing.location).includes(location)) {
    return false
  }

  if (!query) return true

  const text = normalizeSearchText([
    listing.title,
    listing.description,
    listing.category,
    listing.location,
    listing.postedBy?.name,
    ...(listing.tags || []),
  ].filter(Boolean).join(' '))

  return query.split(' ').every(term => text.includes(term))
}

export function sortListings(items, sort) {
  return [...items].sort((first, second) => {
    if (sort === 'price-low') {
      return Number(first.payMin || 0) - Number(second.payMin || 0)
    }

    if (sort === 'price-high') {
      return Number(second.payMax || 0) - Number(first.payMax || 0)
    }

    const firstTime = first.createdAt?.toMillis?.() || first.publishedAt?.toMillis?.() || 0
    const secondTime = second.createdAt?.toMillis?.() || second.publishedAt?.toMillis?.() || 0
    return secondTime - firstTime
  })
}
