import test from 'node:test'
import assert from 'node:assert/strict'
import { matchesListingSearch, sortListings } from '../src/shared/search.js'

const listing = {
  title: 'Build a React website',
  description: 'Responsive storefront for local business',
  location: 'Srinagar',
  category: 'Tech',
  payMin: 100,
  payMax: 500,
  tags: ['frontend', 'React'],
}

test('matches all normalized query words plus category and location filters', () => {
  assert.equal(matchesListingSearch(listing, {
    query: '  REACT   storefront ',
    category: 'Tech',
    location: 'srin',
  }), true)

  assert.equal(matchesListingSearch(listing, {
    query: 'react designer',
    category: 'Tech',
    location: '',
  }), false)

  assert.equal(matchesListingSearch(listing, {
    query: '',
    category: 'Design',
    location: '',
  }), false)
})

test('sorts listings by minimum and maximum price', () => {
  const listings = [
    { payMin: 500, payMax: 900 },
    { payMin: 100, payMax: 400 },
  ]

  assert.deepEqual(sortListings(listings, 'price-low'), [listings[1], listings[0]])
  assert.deepEqual(sortListings(listings, 'price-high'), [listings[0], listings[1]])
})
