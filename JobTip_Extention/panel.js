import { supportedWebsites } from './websites.js'
import versionService from './src/services/versionService.js'
import tabService from './src/services/tabService.js'
import jobService from './src/services/jobService.js'
import scraperService from './src/services/scraperService.js'
import uiService from './src/services/uiService.js'
import storageService from './src/services/storageService.js'
import endpoints from './src/config/endpoints.js'

// Notify background script that side panel is loaded
if (window.location.pathname.includes('sidepanel.html')) {
  chrome.runtime.sendMessage({ action: 'sidePanelLoaded' })
}

// Event handler for platform checkboxes
const handleCheckboxChange = async (e) => {
  if (e.target.type === 'checkbox' && e.target.closest('.website-option')) {
    const newSettings = {}
    supportedWebsites.forEach(website => {
      const checkbox = document.getElementById(website.id)
      if (checkbox) {
        newSettings[website.id] = checkbox.checked
      }
    })
    await storageService.saveWebsiteSettings(newSettings)
    const statusMessage = document.getElementById('statusMessage')
    if (statusMessage) {
      uiService.showMessage(statusMessage, 'Settings saved')
    }
  }
}

// Function to update location options based on country selection
function updateLocationOptions (country) {
  const locationSelect = document.getElementById('location')
  const templateId = {
    'United States': 'usLocations',
    'Australia': 'australiaLocations',
    'United Kingdom': 'ukLocations',
    'Canada': 'canadaLocations',
    'New Zealand': 'newZealandLocations'
  }[country]

  // Clear current options except the first one
  while (locationSelect.options.length > 1) {
    locationSelect.remove(1)
  }

  if (templateId) {
    const template = document.getElementById(templateId)
    const options = template.content.cloneNode(true)
    locationSelect.appendChild(options)
    locationSelect.disabled = false
  } else {
    locationSelect.disabled = true
  }

  // Update website options based on country
  const websiteOptions = document.getElementById('websiteOptions')
  websiteOptions.innerHTML = '' // Clear current options

  // LinkedIn is always available
  const linkedinDiv = document.createElement('div')
  linkedinDiv.className = 'website-option'
  linkedinDiv.innerHTML = `
    <label>
      <input type="checkbox" 
             id="linkedin" 
             checked>
      LinkedIn
    </label>
  `
  websiteOptions.appendChild(linkedinDiv)

  // Indeed is always available
  const indeedDiv = document.createElement('div')
  indeedDiv.className = 'website-option'
  indeedDiv.innerHTML = `
    <label>
      <input type="checkbox" 
             id="indeed" 
             checked>
      Indeed ${country ? `(${country})` : ''}
    </label>
  `
  websiteOptions.appendChild(indeedDiv)

  // SEEK is available for Australia and New Zealand
  if (country === 'Australia' || country === 'New Zealand') {
    const seekDiv = document.createElement('div')
    seekDiv.className = 'website-option'
    seekDiv.innerHTML = `
      <label>
        <input type="checkbox" 
               id="seek" 
               checked>
        SEEK ${country === 'New Zealand' ? 'NZ' : ''}
      </label>
    `
    websiteOptions.appendChild(seekDiv)
  }
}

// Function to display empty state
function showEmptyState (jobList, message = 'No jobs found', subMessage = 'Try adjusting your search criteria or select different job platforms') {
  // Clear any existing content
  jobList.innerHTML = ''

  // Create empty state container
  const emptyState = document.createElement('div')
  emptyState.className = 'empty-state'

  // Add icon
  const icon = document.createElement('div')
  icon.className = 'empty-state-icon'
  icon.textContent = '🔍'

  // Add main text
  const text = document.createElement('div')
  text.className = 'empty-state-text'
  text.textContent = message

  // Add subtext
  const subtext = document.createElement('div')
  subtext.className = 'empty-state-subtext'
  subtext.textContent = subMessage

  // Assemble the empty state
  emptyState.appendChild(icon)
  emptyState.appendChild(text)
  emptyState.appendChild(subtext)

  // Add to job list
  jobList.appendChild(emptyState)
}

// Display jobs in the UI
function displayJobs (jobs) {
  const jobList = document.getElementById('jobList')
  jobList.innerHTML = ''

  if (!jobs || jobs.length === 0) {
    showEmptyState(jobList)
    return
  }

  jobs.forEach(job => {
    jobList.appendChild(uiService.createJobCard(job))
  })
}

// API 端点定义
const API_ENDPOINT = endpoints.DEV_CONFIG.BACKEND.API_ENDPOINT
const API_GET_JOBS = endpoints.DEV_CONFIG.BACKEND.API_ENDPOINT

// 全局变量
let scrapedJobs = []

// 全局常量定義
const JOB_DATA_STRUCTURE = {
  totalJobs: 0,
  timestamp: '',
  userToken: '',
  jobs: [{
    title: '',
    company: '',
    location: '',
    description: '',
    requirements: [],
    salary: '',
    jobType: '',
    status: '未申請',
    source: '',
    sourceId: '',
    sourceUrl: '',
    appliedDate: null,
    deadline: null,
    notes: '',
    platform: '',
    createdAt: '',
    updatedAt: ''
  }]
};

// 格式化工作數據的函數
const formatJobData = (jobs, userToken) => {
  return {
    ...JOB_DATA_STRUCTURE,
    totalJobs: jobs.length,
    timestamp: new Date().toISOString(),
    userToken: userToken,
    jobs: jobs.map(job => {
      // 从 sourceUrl 提取 ID
      let sourceId = '';
      const sourceUrl = job.url || job.sourceUrl || '';
      
      if (job.platform === 'LinkedIn') {
        // LinkedIn: 从 currentJobId 参数提取
        const match = sourceUrl.match(/currentJobId=(\d+)/);
        sourceId = match ? match[1] : '';
      } else if (job.platform === 'Indeed') {
        // Indeed: 从 ad 参数提取
        const match = sourceUrl.match(/ad=([^&]+)/);
        sourceId = match ? match[1] : '';
      } else if (job.platform === 'SEEK') {
        // Seek: 从 URL 中提取 job ID
        const match = sourceUrl.match(/\/job\/(\d+)(?:\?|#|$)/);
        sourceId = match ? match[1] : '';
      }

      return {
        title: job.title,
        company: job.company,
        location: job.location,
        description: job.description || '',
        requirements: job.requirements || [],
        salary: job.salary || '',
        jobType: job.jobType || '',
        status: '未申請',
        source: job.platform,
        sourceId: sourceId,
        sourceUrl: sourceUrl,
        appliedDate: null,
        deadline: null,
        notes: '',
        platform: job.platform,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    })
  };
};

// API 测试功能
const apiTester = {
  testGetJobs: async () => {
    console.log('Testing GET jobs API')
    try {
      const statusMessage = document.getElementById('statusMessage')
      const response = await fetch(API_GET_JOBS, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('GET response:', data)
        uiService.showMessage(statusMessage, `成功获取Get`, 'success')

        // uiService.showMessage(statusMessage, `成功获取 ${data.length} 个工作数据`, 'success')
      } else {
        const errorData = await response.json()
        uiService.showMessage(statusMessage, `获取失败Get`, 'error')

        // uiService.showMessage(statusMessage, `获取失败: ${errorData.message || '未知错误'}`, 'error')
      }
    } catch (error) {
      console.error('API test error:', error)
      const statusMessage = document.getElementById('statusMessage')
      uiService.showMessage(statusMessage, `获取失败: ${error.message}`, 'error')
    }
  }
}

// API 导出功能
const apiExporter = {
  exportJobs: async () => {
    console.log('Exporting jobs by API')
    try {
      const statusMessage = document.getElementById('statusMessage')
      if (scrapedJobs.length > 0) {
        const userToken = await storageService.getUserToken();
        if (!userToken) {
          uiService.showMessage(statusMessage, '請先登入Jobtip獲取userToke，或保持在Jobtip網頁再導出', 'error');
          const tab = await tabService.ensureJobtipWebsite(false);
          return;
        }

        const exportData = formatJobData(scrapedJobs, userToken);
        console.log('Exporting jobs:', exportData)

        const apiResponse = await fetch(API_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(exportData)
        });
        
        if (apiResponse.ok) {
          const data = await apiResponse.json();
          console.log('导出成功:', data);
          uiService.showMessage(statusMessage, `成功導出${data.data.length} 個工作到後端，包含 user token`, 'success');
        } else {
          const errorData = await apiResponse.json();
          console.error('API export error:', errorData.message);
          uiService.showMessage(statusMessage, `导出失败: ${errorData.message || '未知错误'}`, 'error');
        }
      } else {
        uiService.showMessage(statusMessage, '没有找到可导出的工作', 'error');
      }
    } catch (error) {
      console.error('API export error:', error.message);
      const statusMessage = document.getElementById('statusMessage');
      uiService.showMessage(statusMessage, `导出失败: ${error.message}`, 'error');
    }
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM Content Loaded')
  
  // 确保 Jobtip 网站已打开//////////////////////////////
  const tab = await tabService.ensureJobtipWebsite(false)
  console.log('Jobtip 网站已打开:', tab)

  // 注释掉版本检查部分
  // const versionCheck = await versionService.checkVersion(false)
  // if (!versionCheck.isCompatible || versionCheck.requireUpdate) {
  //   versionService.showUpdateUI({
  //     currentVersion: versionCheck.currentVersion,
  //     minimumVersion: versionCheck.minimumVersion,
  //     message: versionCheck.message
  //   })
  //   return // Stop further initialization if version is incompatible
  // }

  const locationInput = document.getElementById('location')
  const searchBtn = document.getElementById('searchBtn')
  const scrapeBtn = document.getElementById('scrapeBtn')
  const showInJobtipBtn = document.getElementById('showInJobtipBtn')
  const jobList = document.getElementById('jobList')
  const statusMessage = document.getElementById('statusMessage')
  const progressSection = document.getElementById('progressSection')
  const progressFill = document.getElementById('progressFill')
  const progressText = document.getElementById('progressText')
  const progressDetail = document.getElementById('progressDetail')
  const overlay = document.getElementById('overlay')
  const overlayText = document.getElementById('overlayText')
  const overlayDetail = document.getElementById('overlayDetail')
  const websiteOptions = document.getElementById('websiteOptions')
  const countrySelect = document.getElementById('country')
  const locationSelect = document.getElementById('location')
  const exportByApiBtn = document.getElementById('exportByApiBtn')
  const testGetBtn = document.getElementById('testGetBtn')
  const usertokenBtn = document.getElementById('usertokenBtn')////////////////

  // 添加工作数量限制输入框
  const maxJobsContainer = document.createElement('div')
  maxJobsContainer.className = 'search-row'
  maxJobsContainer.style.marginTop = '8px'
  maxJobsContainer.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px;">
      <label for="maxJobs" style="white-space: nowrap;">最大爬取數量:</label>
      <input type="number" id="maxJobs" min="1" max="100" value="3" style="flex: 1; padding: 8px;">
    </div>
  `
  // 将输入框添加到搜索区域
  const searchSection = document.querySelector('.search-section')
  searchSection.insertBefore(maxJobsContainer, document.querySelector('.search-row:last-child'))

  console.log('websiteOptions element:', websiteOptions)
  console.log('supportedWebsites:', supportedWebsites)

  // let scrapedJobs = []///////////////////////////////////////////////

  // Add country change handler
  countrySelect.addEventListener('change', (e) => {
    const country = e.target.value
    updateLocationOptions(country)
    // Save the country selection
    if (country) {
      storageService.saveLastCountry(country)
    }
  })

  // Load last used country and location
  const [lastCountry, lastLocation] = await Promise.all([
    storageService.loadLastCountry(),
    storageService.loadLastLocation()
  ])

  // First set the country and update location options
  if (lastCountry) {
    countrySelect.value = lastCountry
    updateLocationOptions(lastCountry)
  } else {
    // If no country is selected, initialize with empty website options
    updateLocationOptions('')
  }

  // Then set the location if it exists
  if (lastLocation) {
    locationSelect.value = lastLocation
  }

  // Load saved settings
  const savedSettings = await storageService.loadWebsiteSettings()
  console.log('savedSettings:', savedSettings)

  // Add the change event listener to the websiteOptions container
  if (websiteOptions) {
    websiteOptions.addEventListener('change', handleCheckboxChange)
  }

  // Update show in Jobtip button handler
  // 在本地導出Json文件//////////////////////////////
  showInJobtipBtn.addEventListener('click', async () => {
    console.log('Export JSON button clicked')
    console.log('Jobs to export:', scrapedJobs)

    try {
      if (scrapedJobs.length === 0) {
        uiService.showMessage(statusMessage, '沒有可導出的工作結果', true)
        return
      }

      const userToken = await storageService.getUserToken();
      if (!userToken) {
        uiService.showMessage(statusMessage, '請先登入Jobtip獲取userToken後，或保持在Jobtip網頁再導出', 'error');
        const tab = await tabService.ensureJobtipWebsite(false);
        return;
      }

      const jsonData = formatJobData(scrapedJobs, userToken);
      
      const jsonString = JSON.stringify(jsonData, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = `jobtip_results_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      uiService.showMessage(statusMessage, '工作結果導出成功，包含 user token');
    } catch (error) {
      console.error('Error exporting job results:', error)
      uiService.showMessage(statusMessage, '導出結果時發生錯誤', true)
    }
  })

  // Update search button click handler
  searchBtn.addEventListener('click', async () => {
    const locationSelect = document.getElementById('location')
    const searchInput = document.getElementById('searchInput')
    const countrySelect = document.getElementById('country')
    const maxJobsInput = document.getElementById('maxJobs')
    const location = locationSelect.value.trim()
    const searchTerm = searchInput.value.trim()
    const country = countrySelect.value.trim()
    const maxJobs = parseInt(maxJobsInput.value) || 30 // 默认最大爬取30个工作

    // Get the current extension window
    const currentWindow = await chrome.windows.getCurrent()

    if (!location) {
      uiService.showMessage(statusMessage, 'Please select a location', true)
      return
    }

    if (!searchTerm) {
      uiService.showMessage(statusMessage, 'Please enter search keywords', true)
      return
    }

    console.log('=== Starting Job Search ===')
    console.log('Search Term:', searchTerm)
    console.log('Location:', location)
    console.log('Country:', country)
    console.log('Max Jobs:', maxJobs)

    // 注释掉与后端通信的代码
    // Send scraping started message to frontend
    // await tabService.ensureJobtipWebsite().then(tab => {
    //   chrome.scripting.executeScript({
    //     target: { tabId: tab.id },
    //     func: (message) => {
    //       window.postMessage(message, '*')
    //     },
    //     args: [{
    //       type: 'SCRAPING_STATUS',
    //       data: {
    //         status: 'started',
    //         message: 'Started scraping jobs'
    //       }
    //     }]
    //   })
    // })

    // Show overlay and disable interaction
    uiService.showOverlay(overlay, true)

    // Save location and country to storage
    await Promise.all([
      storageService.saveLastLocation(location),
      storageService.saveLastCountry(country)
    ])

    // Reset state
    scrapedJobs = []
    jobList.innerHTML = ''

    // Show progress section
    progressSection.style.display = 'block'
    uiService.updateProgress(progressFill, progressText, overlayText, progressDetail, overlayDetail, 0, 'Starting job search...')

    try {
      // Clear any existing scraping state at the start
      await storageService.updateScrapingState(false)

      // Get current website settings
      const savedSettings = await storageService.loadWebsiteSettings()
      console.log('Current website settings:', savedSettings)

      // Get sites to scrape based on checkbox selection
      const sites = scraperService.createJobSearchUrls(searchTerm, location)
        .filter(site => {
          const checkbox = document.getElementById(site.id)
          return checkbox && checkbox.checked
        })

      if (sites.length === 0) {
        uiService.showMessage(statusMessage, 'Please select at least one website', true)
        progressSection.style.display = 'none'
        uiService.showOverlay(overlay, false)
        return
      }

      console.log('Sites to scrape after filtering:', sites)
      let completedSites = 0
      const totalSites = sites.length

      // Get all windows to find the main browser window
      const windows = await chrome.windows.getAll({ windowTypes: ['normal'] })
      console.log('Found browser windows:', windows.length)

      const mainWindow = windows.find(w => w.type === 'normal')
      if (!mainWindow) {
        throw new Error('Could not find main browser window')
      }

      // 模拟获取到了工作数据
      // console.log('模拟爬取工作数据')
      // await new Promise(resolve => setTimeout(resolve, 2000))  // 模拟网络延迟
      
      // scrapedJobs = [
      //   {
      //     id: 'simulated-1',
      //     title: '模拟工作1',
      //     company: '模拟公司',
      //     location: location,
      //     url: 'https://example.com/job1',
      //     platform: 'LinkedIn',
      //     description: '这是一个模拟的工作描述。版本检查被跳过，所以网站选项现在应该正常显示。'
      //   },
      //   {
      //     id: 'simulated-2',
      //     title: '模拟工作2',
      //     company: '模拟公司',
      //     location: location,
      //     url: 'https://example.com/job2',
      //     platform: 'Indeed',
      //     description: '这是另一个模拟的工作描述。'
      //   }
      // ]
      
      // // 显示模拟的工作数据
      // displayJobs(scrapedJobs)
      // uiService.showMessage(statusMessage, `模拟爬取了 ${scrapedJobs.length} 个工作!`)


      for (const site of sites) {
        // 检查是否已经达到最大工作数量
        if (scrapedJobs.length >= maxJobs) {
          console.log(`已达到最大爬取数量限制 (${maxJobs})，停止爬取其他网站`)
          break
        }

        console.log(`\n=== Processing ${site.platform} ===`)
        const progress = (completedSites / totalSites) * 100
        uiService.updateProgress(
          progressFill,
          progressText,
          overlayText,
          progressDetail,
          overlayDetail,
          progress,
          `Scraping ${site.platform}...`,
          `Starting scrape for ${site.platform}`
        )

        const tab = await chrome.tabs.create({
          url: site.url,
          windowId: mainWindow.id,
          active: true
        })

        // Add tab close listener
        const tabClosedPromise = new Promise(resolve => {
          const listener = (tabId) => {
            if (tabId === tab.id) {
              chrome.tabs.onRemoved.removeListener(listener)
              resolve()
            }
          }
          chrome.tabs.onRemoved.addListener(listener)
        })

        try {
          await scraperService.waitForPageLoad(tab.id)

          // Race between scraping and tab closure
          const jobs = await Promise.race([
            scraperService.scrapeWithPagination(tab, site.platform, (currentPage) => {
              uiService.updateProgress(
                progressFill,
                progressText,
                overlayText,
                progressDetail,
                overlayDetail,
                progress,
                `Scraping ${site.platform}...`,
                `Processing page ${currentPage} in ${site.platform}`
              )
            }, maxJobs - scrapedJobs.length), // 传递剩余可爬取的工作数量
            tabClosedPromise.then(async () => {
              console.log(`Tab closed for ${site.platform}`)
              // Clear scraping state if tab is closed
              await storageService.updateScrapingState(false)
              return [] // Return empty array if tab was closed
            })
          ])

          scrapedJobs.push(...jobs)
          completedSites++
          const progressPercent = (completedSites / totalSites) * 100
          uiService.updateProgress(
            progressFill,
            progressText,
            overlayText,
            progressDetail,
            overlayDetail,
            progressPercent,
            `Completed ${site.platform}`,
            `Found ${jobs.length} jobs from ${site.platform}`
          )
          uiService.showMessage(statusMessage, `Scraped ${jobs.length} jobs from ${site.platform}`)

          // Update UI
          jobList.innerHTML = ''
          scrapedJobs.forEach(job => {
            jobList.appendChild(uiService.createJobCard(job))
          })

          // 检查是否已达到最大工作数量
          if (scrapedJobs.length >= maxJobs) {
            console.log(`已达到最大爬取数量 (${maxJobs})，停止爬取更多页面`)
            // 关闭当前标签页
            chrome.tabs.remove(tab.id).catch(err => console.error('关闭标签页失败:', err))
            break
          }
        } catch (error) {
          console.error(`Error processing ${site.platform}:`, error)
          // Clear scraping state on error
          await storageService.updateScrapingState(false)
          completedSites++
        }
      }

      console.log('=== Scraping Complete ===')
      console.log('Total jobs scraped:', scrapedJobs.length)
      uiService.updateProgress(
        progressFill,
        progressText,
        overlayText,
        progressDetail,
        overlayDetail,
        100,
        `Scraping Complete!`,
        `Found ${scrapedJobs.length} jobs from ${totalSites} sites`
      )
      uiService.showMessage(statusMessage, `Successfully scraped ${scrapedJobs.length} jobs!`)
      
      // 自動生成並下載JSON文件///////////////////////////
      // const userToken = await storageService.getUserToken() || '';
      // const exportData = formatJobData(scrapedJobs, userToken);
      
      // const jsonString = JSON.stringify(exportData, null, 2)
      // const blob = new Blob([jsonString], { type: 'application/json' })
      // const url = URL.createObjectURL(blob)
      
      // const a = document.createElement('a')
      // a.href = url
      // a.download = `jobtip_jobs_${new Date().toISOString().split('T')[0]}.json`
      // document.body.appendChild(a)
      // a.click()
      // document.body.removeChild(a)
      // URL.revokeObjectURL(url)
      
      // uiService.updateButtonStates(showInJobtipBtn, scrapedJobs.length > 0)
      
      // if (userToken) {
      //   uiService.showMessage(statusMessage, '工作結果導出成功，包含 user token');
      // } else {
      //   uiService.showMessage(statusMessage, '工作結果導出成功，但未找到 user token，請先登入Jobtip');
      // }



      // 注释掉自动发送到Jobtip的代码
      // Automatically trigger show in Jobtip if jobs were found
      // if (scrapedJobs.length > 0) {
      //   try {
      //     console.log('Attempting to auto-send jobs to Jobtip...')
      //     const response = await jobService.sendJobsToJobtip(scrapedJobs)
      //     console.log('Auto-sending jobs to Jobtip:', response)

      //     if (response && response.success) {
      //       uiService.showMessage(statusMessage, 'Jobs sent to Jobtip successfully')
      //     } else {
      //       console.error('Failed to auto-send jobs to Jobtip:', {
      //         response,
      //         scrapedJobs
      //       })
      //     }
      //   } catch (error) {
      //     console.error('Error auto-sending jobs to Jobtip:', {
      //       error,
      //       scrapedJobs
      //       })
      //     }
      //   }
      // }

      // 注释掉与后端通信的代码
      // Send scraping completed message to frontend
      // await tabService.ensureJobtipWebsite().then(tab => {
      //   chrome.scripting.executeScript({
      //     target: { tabId: tab.id },
      //     func: (message) => {
      //       window.postMessage(message, '*')
      //     },
      //     args: [{
      //       type: 'SCRAPING_STATUS',
      //       data: {
      //         status: 'completed',
      //         message: `Found ${scrapedJobs.length} jobs`,
      //         totalJobs: scrapedJobs.length
      //       }
      //     }]
      //   })
      // })

      // 隐藏加载中的UI
      progressSection.style.display = 'none'
      uiService.showOverlay(overlay, false)
    } catch (error) {
      console.error('Error during scraping:', error)
      uiService.showMessage(statusMessage, 'An error occurred during scraping', true)
      uiService.updateProgress(progressFill, progressText, overlayText, progressDetail, overlayDetail, 0, 'Scraping failed', error.message)
    } finally {
      // Clear scraping state and clean up
      await storageService.updateScrapingState(false)
      uiService.showOverlay(overlay, false)
      // Focus back on the extension window at the end
      chrome.windows.update(currentWindow.id, { focused: true })
    }
  })

  // 添加 API 相关按钮的事件监听器
  if (exportByApiBtn) {
    exportByApiBtn.addEventListener('click', apiExporter.exportJobs)
  }

  if (testGetBtn) {
    testGetBtn.addEventListener('click', apiTester.testGetJobs)
  }
////////////////////////////////////////////////////////////
  if (usertokenBtn) {
    usertokenBtn.addEventListener('click', async () => {
      try {
        const statusMessage = document.getElementById('statusMessage');
        const userToken = await storageService.getUserToken() || '';
        
        if (userToken) {
          uiService.showMessage(statusMessage, `成功獲取 user token: ${userToken}`, 'success');
          console.log('User token:', userToken);
        } else {
          uiService.showMessage(statusMessage, '未找到 user token，請確保您已登入jobtip', 'error');
        }
      } catch (error) {
        console.error('獲取 user token 時發生錯誤:', error);
        const statusMessage = document.getElementById('statusMessage');
        uiService.showMessage(statusMessage, `獲取 user token 失敗: ${error.message}`, 'error');
      }
    });
  }
})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Panel received message:', request)

  if (request.action === 'START_SCRAPING') {
    const data = request.data

    // Set search input
    const searchInput = document.getElementById('searchInput')
    if (searchInput) searchInput.value = data.jobTitle

    // Set country
    console.log('Setting country:', data.country)
    const countrySelect = document.getElementById('country')
    if (countrySelect) {
      countrySelect.value = data.country
      // Trigger change event to update location options
      countrySelect.dispatchEvent(new Event('change'))
    }

    // Wait for location options to update
    setTimeout(() => {
      // Set location
      const locationSelect = document.getElementById('location')
      if (locationSelect) locationSelect.value = `${data.city}`

      // First uncheck all checkboxes
      const checkboxes = document.querySelectorAll('.website-option input[type="checkbox"]')
      checkboxes.forEach(checkbox => {
        checkbox.checked = false
      })

      // Then only check the platforms we want
      console.log('Setting platforms:', data.platforms)
      data.platforms.forEach(platform => {
        const checkbox = document.getElementById(platform.toLowerCase())
        console.log('Setting checkbox for platform:', platform, checkbox)
        if (checkbox) checkbox.checked = true
      })

      // Trigger search button click
      const searchBtn = document.getElementById('searchBtn')
      if (searchBtn) searchBtn.click()

      sendResponse({ success: true })
    }, 500)

    return true // Keep the message channel open for the async response
  }

  // Remove the auto-send trigger for JOBS_RECEIVED_RESPONSE since it's just a confirmation
  if (request.action === 'JOBS_RECEIVED_RESPONSE') {
    console.log('Received jobs response confirmation:', request.data)
    return true
  }
})

// Update message listener in content.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received message:', request)

  if (request.action === 'getNextPageUrl') {
    const platform = Object.values(scrapers).find(s => s.isMatch(window.location.href))
    if (platform && platform.getNextPageUrl) {
      const nextUrl = platform.getNextPageUrl()
      sendResponse({ nextUrl })
    } else {
      sendResponse({ nextUrl: null })
    }
    return true
  }

  // ... existing message handling code ...
}) 
