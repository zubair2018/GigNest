import {
  CATEGORIES,
  PAY_TYPES,
} from './constants.js'

export function parseTags(value = '') {
  return value
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean)
    .slice(0, 5)
}

export function parsePortfolio(value = '') {
  return value
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .slice(0, 5)
    .map(line => {
      const separator = line.indexOf('|')
      const label = separator < 0 ? '' : line.slice(0, separator).trim()
      const url = (separator < 0 ? line : line.slice(separator + 1)).trim()
      let readableLabel = label

      if (!readableLabel) {
        try {
          readableLabel = new URL(url).hostname
        } catch {
          readableLabel = 'Portfolio link'
        }
      }

      return { label: readableLabel.slice(0, 80), url }
    })
}

export function validatePortfolio(value = '') {
  const links = value.split('\n').map(line => line.trim()).filter(Boolean)

  if (links.length > 5) return 'Add no more than 5 portfolio links.'

  for (const link of links) {
    const separator = link.indexOf('|')
    const label = separator < 0 ? '' : link.slice(0, separator).trim()
    const value = (separator < 0 ? link : link.slice(separator + 1)).trim()

    if (label.length > 80 || value.length > 2048) {
      return 'Portfolio labels must be under 80 characters and links under 2048 characters.'
    }

    try {
      const url = new URL(value)
      if (url.protocol !== 'https:' || url.username || url.password) {
        return 'Portfolio links must use HTTPS and cannot contain login credentials.'
      }
    } catch {
      return 'Enter valid HTTPS portfolio links.'
    }
  }

  return ''
}

export function validateListing(form, type = 'job') {
  const titleLabel =
    type === 'skill' ? 'Skill title' : 'Job title'

  if (!form.title?.trim()) {
    return `${titleLabel} is required.`
  }

  if (
    form.title.trim().length < 5 ||
    form.title.trim().length > 100
  ) {
    return `${titleLabel} must be between 5 and 100 characters.`
  }

  if (!form.description?.trim()) {
    return 'Description is required.'
  }

  if (
    form.description.trim().length < 20 ||
    form.description.trim().length > 3000
  ) {
    return 'Description must be between 20 and 3000 characters.'
  }

  if (!form.location?.trim()) {
    return 'Location is required.'
  }

  if (
    form.location.trim().length < 2 ||
    form.location.trim().length > 80
  ) {
    return 'Location must be between 2 and 80 characters.'
  }

  if (!CATEGORIES.includes(form.category)) {
    return 'Please select a valid category.'
  }

  if (!PAY_TYPES.includes(form.payType)) {
    return 'Please select a valid rate unit.'
  }

  if (form.payMin === '' || form.payMax === '') {
    return type === 'skill'
      ? 'Rate range is required.'
      : 'Budget range is required.'
  }

  const minimumPay = Number(form.payMin)
  const maximumPay = Number(form.payMax)

  if (
    Number.isNaN(minimumPay) ||
    Number.isNaN(maximumPay) ||
    minimumPay < 0 ||
    maximumPay < 0
  ) {
    return 'Enter valid non-negative pay values.'
  }

  if (minimumPay > maximumPay) {
    return 'Minimum pay cannot be greater than maximum pay.'
  }

  if (maximumPay > 1000000000) {
    return 'Pay values must be less than ₹1,000,000,000.'
  }

  if (type === 'skill') {
    if (!['remote', 'onsite', 'hybrid'].includes(form.availability)) {
      return 'Choose a valid work arrangement.'
    }

    const portfolioError = validatePortfolio(form.portfolioText || '')
    if (portfolioError) return portfolioError
  }

  return ''
}