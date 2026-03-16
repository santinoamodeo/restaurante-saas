export function saveToken(token: string) {
  localStorage.setItem('super_token', token)
}

export function getToken(): string | null {
  return localStorage.getItem('super_token')
}

export function removeToken() {
  localStorage.removeItem('super_token')
}