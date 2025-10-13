import http from '@/axios/index.js';

export function login(email, password) {
    return http.post('/login', {email: email, password: password})
}

export function logout() {
    return http.delete('/logout')
}

export function register(form) {
    return http.post('/register', form)
}

export function getOAuthUrl() {
    return http.get('/oauth/linuxdo/url')
}

export function oauthCallback(code) {
    return http.post('/oauth/linuxdo/callback', { code })
}
