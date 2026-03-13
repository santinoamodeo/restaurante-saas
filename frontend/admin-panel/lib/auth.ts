export function saveToken(token: string) {
  localStorage.setItem('admin_token', token)
}

export function getToken(): string | null {
  return localStorage.getItem('admin_token')
}

export function removeToken() {
  localStorage.removeItem('admin_token')
}

export function isLoggedIn(): boolean {
  return !!getToken()
}