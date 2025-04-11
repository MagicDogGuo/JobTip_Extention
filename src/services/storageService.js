// Function to load last used location
async function loadLastLocation () {
  return new Promise((resolve) => {
    chrome.storage.local.get(['lastLocation', 'lastCountry'], (result) => {
      resolve(result.lastLocation || null)
    })
  })
}

// Function to save last used location
async function saveLastLocation (location) {
  const country = location.split(', ').pop() // Get country from full location
  return chrome.storage.local.set({
    lastLocation: location,
    lastCountry: country
  })
}

// Function to load last used country
async function loadLastCountry () {
  return new Promise((resolve) => {
    chrome.storage.local.get(['lastCountry'], (result) => {
      resolve(result.lastCountry || null)
    })
  })
}

// Function to save the country directly
async function saveLastCountry (country) {
  return chrome.storage.local.set({
    lastCountry: country
  })
}

// Function to load website settings
async function loadWebsiteSettings () {
  const settings = await chrome.storage.sync.get('websiteSettings')
  return settings.websiteSettings || {}
}

// Function to save website settings
async function saveWebsiteSettings (newSettings) {
  return chrome.storage.sync.set({ websiteSettings: newSettings })
}

// Function to update scraping state
async function updateScrapingState (isActive) {
  return chrome.storage.local.set({ isScrapingActive: isActive })
}



// Function to get user token from localStorage (新增抓localstorage功能)////////////
async function getUserToken() {
  return new Promise((resolve) => {
    
    //測試用URL
    const getLocalstorageTokenUrl = 'http://localhost:3000';// 'https://github.com';  //// localhost:3000
    
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      const currentTab = tabs[0];
      if (currentTab && currentTab.url.includes(getLocalstorageTokenUrl)) { 
        chrome.scripting.executeScript({
          target: {tabId: currentTab.id},
          function: () => {
            //測試用URL
            const getLocalstorageTokenKey = 'token';//'codeNavOpen'; ///user_token
            return localStorage.getItem(getLocalstorageTokenKey); 
          }
        }, (results) => {
          if (results && results[0] && results[0].result) {
            resolve(results[0].result);
          } else {
            resolve(null);
          }
        });
      } else {
        resolve(null);
      }
    });
  });
}

export default {
  loadLastLocation,
  saveLastLocation,
  loadLastCountry,
  saveLastCountry,
  loadWebsiteSettings,
  saveWebsiteSettings,
  updateScrapingState,
  getUserToken
} 