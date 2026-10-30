import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase/config'

async function callAdminFunction(name, payload) {
  const callable = httpsCallable(functions, name)
  const response = await callable(payload)
  return response.data
}

export function getAdminDashboard() {
  return callAdminFunction('getAdminDashboard')
}

export function getAdminListings(payload) {
  return callAdminFunction('getAdminListings', payload)
}

export function getAdminPayments(payload) {
  return callAdminFunction('getAdminPayments', payload)
}

export function getAdminUsers(payload) {
  return callAdminFunction('getAdminUsers', payload)
}

export function moderateListing(payload) {
  return callAdminFunction('moderateListing', payload)
}

export function reviewService(payload) {
  return callAdminFunction('reviewService', payload)
}
