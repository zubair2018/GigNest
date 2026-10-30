import test from 'node:test'
import assert from 'node:assert/strict'
import { parsePortfolio, validateListing, validatePortfolio } from '../src/shared/validation.js'

const validService = {
  title: 'React website builder',
  description: 'I build responsive websites for small teams and local businesses.',
  location: 'Srinagar',
  category: 'Tech',
  payType: '/project',
  payMin: '0',
  payMax: '25000',
  availability: 'remote',
  portfolioText: 'Portfolio | https://example.com/work',
}

test('accepts a valid free-first service listing', () => {
  assert.equal(validateListing(validService, 'skill'), '')
})

test('rejects unsafe portfolio URL schemes and embedded credentials', () => {
  assert.match(validatePortfolio('javascript:alert(1)'), /HTTPS/)
  assert.match(validatePortfolio('http://example.com'), /HTTPS/)
  assert.match(validatePortfolio('https://user:pass@example.com'), /HTTPS/)
})

test('limits portfolio links to five and validates URL length', () => {
  assert.match(validatePortfolio(Array(6).fill('https://example.com').join('\n')), /5/)
  assert.match(validatePortfolio(`https://example.com/${'x'.repeat(2050)}`), /2048/)
})

test('parses optional portfolio labels without accepting raw HTML', () => {
  assert.deepEqual(parsePortfolio('My work | https://example.com/work'), [
    { label: 'My work', url: 'https://example.com/work' },
  ])
})
