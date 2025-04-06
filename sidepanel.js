document.getElementById('exportJsonBtn').addEventListener('click', async () => {
  try {
    // 獲取當前頁面的工作信息
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'getJobResults' })
    
    if (response && response.jobs) {
      const result = {
        jobs: response.jobs,
        nextUrl: response.nextUrl,
        timestamp: new Date().toISOString(),
        totalJobs: response.jobs.length
      }
      
      // 創建並下載JSON文件
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'job_results.json'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } else {
      console.error('No job results found')
    }
  } catch (error) {
    console.error('Error exporting job results:', error)
  }
}) 