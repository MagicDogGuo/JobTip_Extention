// Configuration for the Jobtip extension
const config = {
  // Development environment
  development: {
    baseUrl: 'http://localhost:5001'
  },
  // Production environment ，擴展程序中的各種功能（如發送工作數據、檢查版本更新等）會基於這個URL構建完整的API請求地址
  production: {
    baseUrl: 'https://jobjourney.me'
  }
}

async function getBaseUrl () {
  try {
    // Try to detect development environment
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 1000) // 1 second timeout

    try {
      await fetch('http://localhost:5001/health', {
        signal: controller.signal,
        mode: 'no-cors' // This allows us to at least detect if the server responds
      })
      clearTimeout(timeoutId)
      console.log('Development environment detected')
      return config.development.baseUrl
    } catch (error) {
      clearTimeout(timeoutId)
      console.log('Production environment detected')
      return config.production.baseUrl
    }
  } catch (error) {
    console.log('Error checking environment, defaulting to production:', error)
    return config.production.baseUrl
  }
}

export default {
  getBaseUrl
} 