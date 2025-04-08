// 常量定义
const API_ENDPOINT = 'http://localhost:3000/api/jobs'

// DOM 元素
let elements = {
  exportByApiBtn: null,
  statusMessage: null
}

// 工具函数
const utils = {
  showStatusMessage: (message, type) => {
    if (elements.statusMessage) {
      elements.statusMessage.textContent = message
      elements.statusMessage.className = `status-message ${type}`
      elements.statusMessage.style.display = 'block'
      
      setTimeout(() => {
        elements.statusMessage.style.display = 'none'
      }, 3000)
    }
  }
}

// API 导出功能
const apiExporter = {
  exportJobs: async () => {
    console.log('Exporting jobs by API__1')
    try {
      console.log('Exporting jobs by API__')
      // 获取当前页面的工作信息
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'getJobResults' })
      
      if (response && response.jobs) {
        const result = {
          jobs: response.jobs,
          nextUrl: response.nextUrl,
          timestamp: new Date().toISOString(),
          totalJobs: response.jobs.length
        }

        // 调用后端 API
        const apiResponse = await fetch(API_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(result)
        })
        
        if (apiResponse.ok) {
          utils.showStatusMessage('Jobs exported successfully via API', 'success')
        } else {
          utils.showStatusMessage('Failed to export jobs via API', 'error')
        }
      } else {
        utils.showStatusMessage('No job results found', 'error')
      }
    } catch (error) {
      utils.showStatusMessage('Error exporting jobs via API', 'error')
      console.error('API export error:', error)
    }
  }
}

// 初始化函数
function initialize() {
  // 获取DOM元素
  elements = {
    exportByApiBtn: document.getElementById('exportByApiBtn'),
    statusMessage: document.getElementById('statusMessage')
  }

  // 添加事件监听器
  if (elements.exportByApiBtn) {
    elements.exportByApiBtn.addEventListener('click', apiExporter.exportJobs)
  }
}

// 在DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', initialize) 