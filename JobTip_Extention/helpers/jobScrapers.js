class Job {
  constructor({
    title,
    company,
    location,
    description = '',
    requirements = [],
    salary = '',
    jobType = '',
    status = '未申請',
    source = '',
    sourceId = '',
    sourceUrl = '',
    appliedDate = null,
    deadline = null,
    notes = '',
    platform,
    createdAt = new Date(),
    updatedAt = new Date()
  }) {
    this.title = title?.trim() || ''
    this.company = company?.trim() || ''
    this.location = location?.trim() || ''
    this.description = description?.trim() || ''
    this.requirements = Array.isArray(requirements) ? requirements : []
    this.salary = salary?.trim() || ''
    this.jobType = jobType?.trim() || ''
    this.status = status?.trim() || '未申請'
    this.source = source?.trim() || ''
    this.sourceId = sourceId?.trim() || ''
    this.sourceUrl = sourceUrl || ''
    this.appliedDate = appliedDate || null
    this.deadline = deadline || null
    this.notes = notes?.trim() || ''
    this.platform = platform || ''
    this.createdAt = createdAt
    this.updatedAt = updatedAt
  }

  static createFromLinkedIn(data) {
    return new Job({
      title: data.title,
      company: data.company,
      location: data.location,
      description: data.description,
      requirements: data.requirements || [],
      salary: data.salary,
      jobType: data.jobType,
      source: 'LinkedIn',
      sourceId: data.sourceId || '',
      sourceUrl: data.jobUrl,
      platform: 'LinkedIn',
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }

  static createFromSEEK(data) {
    return new Job({
      title: data.title,
      company: data.company,
      location: data.location,
      description: data.description,
      requirements: data.requirements || [],
      salary: data.salary,
      jobType: data.jobType || '',
      source: 'SEEK',
      sourceId: data.sourceId || '',
      sourceUrl: data.jobUrl,
      platform: 'SEEK',
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }

  static createFromIndeed(data) {
    return new Job({
      title: data.title,
      company: data.company,
      location: data.location,
      description: data.description,
      requirements: data.requirements || [],
      salary: data.salary,
      jobType: data.jobType,
      source: 'Indeed',
      sourceId: data.sourceId || '',
      sourceUrl: data.jobUrl,
      platform: 'Indeed',
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }
}

// Job scraping functions for different platforms
const scrapers = {
  linkedin: {
    isMatch: (url) => url.includes('linkedin.com'),
    scrapeJobList: async () => {
      let jobs = []
      const logMessages = []
      
      const log = (message) => {
        console.log(message)
        logMessages.push(message)
      }

      log('=== LinkedIn Scraping Started ===')
      log(`Current URL: ${window.location.href}`)
      log(`Document readyState: ${document.readyState}`)
      log(`Page content length: ${document.body.innerHTML.length}`)
      log(`Page title: ${document.title}`)

      // Wait for page to be fully loaded
      if (document.readyState !== 'complete') {
        log('Waiting for page to load...')
        await new Promise(resolve => {
          window.addEventListener('load', resolve, { once: true })
        })
        log('Page loaded')
      }

      // Check if we're on the login page
      const loginForm = document.querySelector('form.login-form')
      if (loginForm) {
        log('Detected login page. Please log in first.')
        return { jobs, nextUrl: null, error: 'Login required' }
      }

      // Try multiple selectors to find job nodes
      const selectors = [
        'div[data-job-id]',
        'div[data-view-name="job-card"]',
        'div[class*="job-card"]',
        'div.jobs-search-results__list-item',
        'div.job-card-container',
        'div.job-card-job-posting-card-wrapper'
      ]

      let jobNodes = []
      for (const selector of selectors) {
        const nodes = document.querySelectorAll(selector)
        if (nodes.length > 0) {
          jobNodes = nodes
          log(`Using selector: ${selector}`)
          log(`Found ${nodes.length} job nodes with this selector`)
          break
        }
      }

      if (jobNodes.length === 0) {
        log('No job nodes found with any selector')
        return { jobs, nextUrl: null, error: 'No job nodes found' }
      }

      // Find next page URL
      let nextUrl = null
      const nextButton = document.querySelector('.jobs-search-pagination__button--next')
      if (nextButton) {
        const currentUrl = new URL(window.location.href)
        const currentPage = parseInt(currentUrl.searchParams.get('start') || '0')
        const nextPage = currentPage + 25 // LinkedIn每页显示25个职位
        currentUrl.searchParams.set('start', nextPage.toString())
        nextUrl = currentUrl.toString()
        log(`Found next page URL: ${nextUrl}`)
      } else {
        log('No next page button found')
      }

      jobNodes.forEach((node, index) => {
        try {
          log(`\nProcessing LinkedIn job ${index + 1}:`)
          log(`Node HTML: ${node.outerHTML.substring(0, 200)}...`)

          // Try multiple selectors for each field
          const titleNode = node.querySelector([
            'a[class*="job-card-list__title"]',
            'a[class*="job-card-container__link"]',
            'a[class*="job-card-job-posting-card"]',
            'a[class*="job-card-list__entity"]',
            'a[class*="job-card-container"]',
            'a[class*="job-posting-card"]',
            'a[class*="zwsPhDvTGeELvNkMMaTI"]'
          ].join(','))

          const companyNode = node.querySelector([
            'span[class*="company-name"]',
            'span[class*="subtitle"]',
            'span[class*="entity-lockup__subtitle"]',
            'span[class*="job-card-container__company-name"]',
            'span[class*="job-card-list__company-name"]',
            'div[class*="job-card-container__company-name"]',
            'div[class*="job-card-list__company-name"]',
            'div[class*="entity-lockup__subtitle"]'
          ].join(','))

          const locationNode = node.querySelector([
            'span[class*="location"]',
            'span[class*="metadata"]',
            'span[class*="job-card-container__metadata"]',
            'span[class*="job-card-list__metadata"]',
            'span[class*="entity-lockup__caption"]',
            'div[class*="job-card-container__metadata"]',
            'div[class*="job-card-list__metadata"]',
            'div[class*="entity-lockup__caption"]'
          ].join(','))

          const jobUrlNode = node.querySelector([
            'a[class*="job-card-list__title"]',
            'a[class*="job-card-container__link"]',
            'a[class*="job-card-job-posting-card"]',
            'a[class*="job-card-list__entity"]',
            'a[class*="job-card-container"]',
            'a[class*="job-posting-card"]',
            'a[class*="zwsPhDvTGeELvNkMMaTI"]'
          ].join(','))

          const logoNode = node.querySelector([
            'img[class*="logo"]',
            'img[class*="image"]',
            'img[class*="company-logo"]',
            'img[class*="entity-lockup__image"]',
            'img[class*="job-card-list__logo"]',
            'img[class*="job-card-container__logo"]'
          ].join(','))

          log(`Title node found: ${!!titleNode}`)
          log(`Company node found: ${!!companyNode}`)
          log(`Location node found: ${!!locationNode}`)
          log(`Job URL node found: ${!!jobUrlNode}`)
          log(`Logo node found: ${!!logoNode}`)

          // Get metadata items for salary and job type
          const metadataItems = Array.from(node.querySelectorAll([
            'span[class*="metadata"]',
            'li[class*="metadata"]',
            'span[class*="job-card-container__metadata"]',
            'span[class*="job-card-list__metadata"]',
            'span[class*="entity-lockup__metadata"]',
            'div[class*="job-card-container__metadata"]',
            'div[class*="job-card-list__metadata"]',
            'div[class*="entity-lockup__metadata"]'
          ].join(',')))
            .map(el => el.textContent.trim())
            .filter(text => text)
          log(`Found ${metadataItems.length} metadata items`)

          // Find salary (item containing currency symbols or ranges)
          const salaryText = metadataItems.find(text =>
            /[$€£¥]|per\s+|annum|annual|year|month|hour|week/i.test(text)
          )
          log(`Salary found: ${!!salaryText}`)

          // Get job description from the job details section
          const descriptionNode = node.querySelector([
            'div[class*="description"]',
            'div[class*="snippet"]',
            'div[class*="job-card-container__description"]',
            'div[class*="job-card-list__description"]',
            'div[class*="job-card-container__snippet"]',
            'div[class*="job-card-list__snippet"]'
          ].join(','))
          const description = descriptionNode?.textContent?.trim()
            .replace(/\s+/g, ' ')  // Normalize whitespace
            .trim()
          log(`Description found: ${!!description}`)

          // Get posted date
          const postedDateNode = node.querySelector([
            'span[class*="time"]',
            'span[class*="listed"]',
            'span[class*="job-card-container__footer-item--time"]',
            'span[class*="job-card-list__footer-item--time"]',
            'time',
            'div[class*="job-card-container__footer-item--time"]',
            'div[class*="job-card-list__footer-item--time"]'
          ].join(','))
          log(`Posted date found: ${!!postedDateNode}`)

          log('Found LinkedIn nodes:')
          log(`Title: ${titleNode?.textContent?.trim()}`)
          log(`Company: ${companyNode?.textContent?.trim()}`)
          log(`Location: ${locationNode?.textContent?.trim()}`)
          log(`Salary: ${salaryText}`)
          log(`Description: ${description?.substring(0, 100)}...`)
          log(`Posted Date: ${postedDateNode?.textContent?.trim()}`)
          log(`URL: ${jobUrlNode?.href}`)
          log(`Logo: ${logoNode?.src}`)
          log(`All Metadata: ${JSON.stringify(metadataItems)}`)

          if (titleNode && companyNode) {
            // Clean up the title by taking only the first line
            let title = titleNode.textContent.trim()
            title = title.split('\n')[0].trim()

            const job = Job.createFromLinkedIn({
              title: title,
              company: companyNode.textContent.trim(),
              location: locationNode?.textContent?.trim(),
              salary: salaryText || '',
              description: description || '',
              postedDate: postedDateNode?.textContent?.trim(),
              jobUrl: jobUrlNode?.href || window.location.href,
              companyLogoUrl: logoNode?.src
            })
            log('Successfully scraped LinkedIn job')
            jobs.push(job)
          } else {
            log('Skipping job due to missing required fields')
          }
        } catch (error) {
          log(`Error scraping LinkedIn job: ${error.message}`)
          log(`Error stack: ${error.stack}`)
        }
      })

      // Save logs to a file
      const blob = new Blob([logMessages.join('\n')], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'linkedin_scraper_logs.txt'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      log(`=== LinkedIn Scraping Complete: ${jobs.length} jobs found ===`)
      return { jobs, nextUrl }
    },
    scrapeJobDetail: () => {
      try {
        const title = document.querySelector('h1.top-card-layout__title')?.textContent.trim()
        const company = document.querySelector('a.topcard__org-name-link')?.textContent.trim()
        const location = document.querySelector('span.topcard__flavor--bullet')?.textContent.trim()
        const description = document.querySelector('div.description__text')?.textContent.trim()
        const logoUrl = document.querySelector('img.artdeco-entity-image')?.src
        const workplaceType = document.querySelector('span.workplace-type')?.textContent.trim()
        const employmentType = document.querySelector('span.job-type')?.textContent.trim()

        const job = {
          title,
          company,
          location,
          description,
          companyLogoUrl: logoUrl,
          jobUrl: window.location.href,
          platform: 'LinkedIn',
          workArrangement: workplaceType || '',
          employmentType: employmentType || ''
        }
        console.log('Scraped LinkedIn job detail:', job)
        return job
      } catch (error) {
        console.error('Error scraping LinkedIn job detail:', error)
        return null
      }
    }
  },
  seek: {
    isMatch: (url) => url.includes('seek.com.au') || url.includes('seek.co.nz'),
    scrapeJobList: async () => {
      const jobs = []
      const seekLogs = []
      
      const log = (message) => {
        console.log(message)
        seekLogs.push(message)
      }

      log('=== SEEK Scraping Started ===')
      log(`Current URL: ${window.location.href}`)
      log(`Document readyState: ${document.readyState}`)
      log(`Page content length: ${document.body.innerHTML.length}`)
      log(`Page title: ${document.title}`)

      // Try multiple possible selectors
      const selectors = [
        '[data-testid="job-card"]',
        'article[data-card-type="JobCard"]',
        'article[role="article"]',
        'a[data-testid="job-card-title"]',
        '[data-automation="job-card"]'
      ]

      let jobNodes = []
      for (const selector of selectors) {
        const nodes = document.querySelectorAll(selector)
        if (nodes.length > 0) {
          jobNodes = nodes
          log(`Using selector: ${selector}`)
          break
        }
      }

      log(`Found SEEK job nodes: ${jobNodes.length}`)

      // 修改為 async 函數
      for (let i = 0; i < jobNodes.length; i++) {
        const node = jobNodes[i]
        try {
          log(`\nProcessing SEEK job ${i + 1}:`)

          const titleNode =
            node.querySelector('[data-testid="job-card-title"]') ||
            node.querySelector('a[data-automation="jobTitle"]') ||
            node.querySelector('a[class*="job-title"]') ||
            node.querySelector('a[id^="job-title"]')

          const companyNode =
            node.querySelector('[data-automation="jobCompany"]') ||
            node.querySelector('span[class*="l1r1184z"] a[data-automation="jobCompany"]') ||
            node.querySelector('div.snwpn00 a[data-automation="jobCompany"]') ||
            node.querySelector('span._1yyt8p60 a[data-type="company"]')

          const locationNode =
            node.querySelector('span[data-automation="jobCardLocation"]') ||
            node.querySelector('a[data-automation="jobLocation"]') ||
            node.querySelector('span[data-type="location"]')

          const descriptionNode = node.querySelector('span[data-testid="job-card-teaser"]')
          const salaryNode = node.querySelector('span[data-automation="jobSalary"]')
          const postedDateNode = node.querySelector('span[data-automation="jobListingDate"] div._1kme6z20')
          
          // 修改 jobType 的選擇器
          const jobTypeNode = node.querySelector([
            'a[href*="-jobs/full-time"]',
            'a[href*="-jobs/part-time"]',
            'a[href*="-jobs/casual"]',
            'a[href*="-jobs/contract"]',
            'span[data-automation="jobType"]',
            'span[class*="job-type"]',
            'div[class*="job-type"]'
          ].join(','))
          
          let jobType = jobTypeNode ? jobTypeNode.textContent.trim() : ''

          // 修改 URL 的獲取方式
          let jobUrl = ''
          if (titleNode?.href) {
            jobUrl = titleNode.href
          } else if (titleNode?.closest('a')?.href) {
            jobUrl = titleNode.closest('a').href
          } else if (node.querySelector('a[data-automation="jobTitle"]')?.href) {
            jobUrl = node.querySelector('a[data-automation="jobTitle"]').href
          }

          // 確保 URL 是完整的
          if (jobUrl && !jobUrl.startsWith('http')) {
            jobUrl = 'https://www.seek.com.au' + jobUrl
          }

          // 如果在列表頁面沒有找到 jobType，嘗試從詳情頁面獲取
          if (!jobType && jobUrl) {
            try {
              // 使用 await 等待 jobType 獲取完成
              jobType = await new Promise((resolve, reject) => {
                chrome.runtime.sendMessage(
                  {
                    action: 'fetchJobDetail',
                    url: jobUrl
                  },
                  (response) => {
                    if (response && response.html) {
                      const parser = new DOMParser()
                      const doc = parser.parseFromString(response.html, 'text/html')
                      
                      // 在詳情頁面查找 jobType
                      const selectors = [
                        'a[href*="-jobs/full-time"]',
                        'a[href*="-jobs/part-time"]',
                        'a[href*="-jobs/casual"]',
                        'a[href*="-jobs/contract"]',
                        'span[data-automation="jobType"]',
                        'span[class*="job-type"]',
                        'div[class*="job-type"]',
                        'span[data-automation="job-work-type"]',
                        'div[data-automation="job-work-type"]',
                        'a[class*="job-type"]',
                        'div[class*="work-type"]',
                        'span[class*="work-type"]',
                        'div[data-automation="job-detail-work-type"]',
                        'span[data-automation="job-detail-work-type"]'
                      ]

                      // 記錄每個選擇器的結果
                      selectors.forEach(selector => {
                        const element = doc.querySelector(selector)
                        log(`Selector ${selector} found: ${!!element}`)
                        if (element) {
                          log(`Element content: ${element.textContent.trim()}`)
                        }
                      })

                      const detailJobTypeNode = doc.querySelector(selectors.join(','))
                      log(`detailJobTypeNode found: ${!!detailJobTypeNode}`)
                      
                      if (detailJobTypeNode) {
                        const type = detailJobTypeNode.textContent.trim()
                        log(`Found job type: ${type}`)
                        resolve(type)
                      } else {
                        log('No job type found')
                        resolve('')
                      }
                    } else {
                      log(`Error fetching job detail: ${response?.error || 'Unknown error'}`)
                      reject(new Error(response?.error || 'Unknown error'))
                    }
                  }
                )
              })
            } catch (error) {
              log(`Error in job type fetching: ${error.message}`)
              jobType = ''
            }
          }

          log(`Title found: ${!!titleNode}`)
          log(`Company found: ${!!companyNode}`)
          log(`Location found: ${!!locationNode}`)
          log(`Description found: ${!!descriptionNode}`)
          log(`Salary found: ${!!salaryNode}`)
          log(`Job Type found: ${!!jobTypeNode}`)
          log(`Posted Date found: ${!!postedDateNode}`)
          log(`Job URL: ${jobUrl}`)

          if (titleNode && companyNode) {
            const job = Job.createFromSEEK({
              title: titleNode.textContent.trim(),
              company: companyNode.textContent.trim(),
              location: locationNode?.textContent?.trim(),
              jobUrl: jobUrl,
              description: descriptionNode?.textContent?.trim(),
              salary: salaryNode?.textContent?.trim(),
              postedDate: postedDateNode?.textContent?.trim(),
              companyLogoUrl: null,
              jobType: jobType
            })
            log('Successfully scraped SEEK job:')
            log(`Title: ${job.title}`)
            log(`Company: ${job.company}`)
            log(`Location: ${job.location}`)
            log(`Job Type: ${job.jobType}`)
            log(`URL: ${job.jobUrl}`)
            jobs.push(job)
          } else {
            log('Skipping job due to missing required fields')
          }
        } catch (error) {
          log(`Error scraping SEEK job: ${error.message}`)
        }
      }

      // Check for next page
      const nextButton = document.querySelector([
        'li:last-child a[rel*="next"][aria-hidden="false"]',
        'li:last-child a[data-automation^="page-"]:not([aria-current])'
      ].join(','))

      const nextUrl = nextButton && nextButton.getAttribute('aria-hidden') !== 'true'
        ? nextButton.href
        : null

      log(`Next URL: ${nextUrl || 'No next page available'}`)

      // Save logs to a file
      const blob = new Blob([seekLogs.join('\n')], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'seek_scraper_logs.txt'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      log(`=== SEEK Scraping Complete: ${jobs.length} jobs found ===`)
      return { jobs, nextUrl }
    },
    scrapeJobDetail: () => {
      try {
        const title = document.querySelector('[data-automation="job-detail-title"]')?.textContent.trim()
        const company = document.querySelector('[data-automation="advertiser-name"]')?.textContent.trim()
        const location = document.querySelector('[data-automation="job-location"]')?.textContent.trim()
        const description = document.querySelector('[data-automation="jobDescription"]')?.textContent.trim()
        const logoUrl = document.querySelector('[data-automation="advertiser-logo"] img')?.src
        const workType = document.querySelector('[data-automation="job-work-type"]')?.textContent.trim()
        const salary = document.querySelector('[data-automation="job-salary"]')?.textContent.trim()

        const job = {
          title,
          company,
          location,
          description,
          companyLogoUrl: logoUrl,
          jobUrl: window.location.href,
          platform: 'SEEK',
          workType: workType || '',
          salary: salary || ''
        }
        console.log('Scraped SEEK job detail:', job)
        return job
      } catch (error) {
        console.error('Error scraping SEEK job detail:', error)
        return null
      }
    }
  },
  indeed: {
    isMatch: (url) => url.includes('indeed.com'),
    scrapeJobList: async () => {
      let jobs = []
      const logMessages = []
      
      const log = (message) => {
        console.log(message)
        logMessages.push(message)
      }

      log('=== Indeed Scraping Started ===')
      log(`Current URL: ${window.location.href}`)
      log(`Document readyState: ${document.readyState}`)
      log(`Page content length: ${document.body.innerHTML.length}`)
      log(`Page title: ${document.title}`)

      // Wait for page to be fully loaded
      if (document.readyState !== 'complete') {
        log('Waiting for page to load...')
        await new Promise(resolve => {
          window.addEventListener('load', resolve, { once: true })
        })
        log('Page loaded')
      }

      const jobNodes = document.querySelectorAll([
        'div.job_seen_beacon',
        'div[class*="job_seen_"]',
        'div[class*="cardOutline"]',
        'div.resultContent',
        'div[data-testid="job-card"]',
        'td.resultContent'
      ].join(','))

      log(`Found ${jobNodes.length} job nodes on the page`)

      // 使用 Set 来跟踪已处理的职位
      const seenJobIds = new Set()

      // Scrape current page
      jobNodes.forEach((node, index) => {
        try {
          log(`\nProcessing job ${index + 1}/${jobNodes.length}:`)

          const titleNode = node.querySelector([
            'h2.jobTitle a',
            'h2 a[data-jk]',
            'h2.jobTitle span[title]',
            'a[data-jk] span[title]',
            '[class*="jobTitle"]',
            'a[id^="job_"]'
          ].join(','))

          const companyNode = node.querySelector([
            'span[data-testid="company-name"]',
            'span.css-1h7lukg[data-testid="company-name"]',
            'span.companyName',
            '[data-testid="company-name"]',
            'div[class*="company"] span',
            'span[class*="companyName"]'
          ].join(','))

          const locationNode = node.querySelector([
            'div[data-testid="text-location"]',
            'div.css-1restlb[data-testid="text-location"]',
            'div.companyLocation',
            'div[class*="location"]',
            'div[class*="workplace"]'
          ].join(','))

          const descriptionNode = node.querySelector([
            'div[data-testid="jobsnippet_footer"] ul li',
            '.job-snippet',
            '.underShelfFooter .heading6 ul li'
          ].join(','))

          const postedDateNode = node.querySelector('span.date')

          // Get all metadata items and clean up text content
          const metadataItems = Array.from(node.querySelectorAll([
            '.metadataContainer li .metadata div[data-testid="attribute_snippet_testid"]',
            '.metadataContainer li div[data-testid="attribute_snippet_testid"]',
            '.metadataContainer li div[data-testid^="attribute_snippet"]'
          ].join(',')))
            .map(el => {
              const textContent = Array.from(el.childNodes)
                .filter(node => node.nodeType === Node.TEXT_NODE)
                .map(node => node.textContent.trim())
                .join(' ')
                .split('+')[0]
                .trim()

              return textContent || el.textContent.trim().split('+')[0].trim()
            })
            .filter(text => text)

          const salaryText = metadataItems.find(text => text.includes('$'))
          const jobTypeText = metadataItems.find(text =>
            /\b(Full-time|Part-time|Contract|Temporary|Internship|Casual|Contractor)\b/i.test(text)
          )
          const jobType = jobTypeText?.match(/\b(Full-time|Part-time|Contract|Temporary|Internship|Casual|Contractor)\b/i)?.[0] || ''

          const description = descriptionNode?.textContent?.trim()
            .replace(/…$/, '')
            .replace(/\s+/g, ' ')
            .trim()

          log(`Title found: ${!!titleNode}`)
          log(`Company found: ${!!companyNode}`)
          log(`Location found: ${!!locationNode}`)
          log(`Description found: ${!!descriptionNode}`)
          log(`Salary found: ${!!salaryText}`)
          log(`Job Type found: ${!!jobType}`)
          log(`Posted Date found: ${!!postedDateNode}`)

          if (titleNode && companyNode) {
            // 创建职位唯一标识
            const jobId = `${titleNode.textContent.trim()}-${companyNode.textContent.trim()}`
            
            // 检查是否已经处理过这个职位
            if (seenJobIds.has(jobId)) {
              log('Skipping duplicate job')
              return
            }
            
            seenJobIds.add(jobId)

            let jobUrl = ''
            if (titleNode.href) {
              jobUrl = titleNode.href
            } else if (titleNode.closest('a')?.href) {
              jobUrl = titleNode.closest('a').href
            } else if (node.querySelector('a[data-jk]')?.href) {
              jobUrl = node.querySelector('a[data-jk]').href
            }

            if (!jobUrl.startsWith('http')) {
              jobUrl = 'https://indeed.com' + jobUrl
            }

            const job = Job.createFromIndeed({
              title: titleNode.textContent.trim(),
              company: companyNode.textContent.trim(),
              location: locationNode?.textContent?.trim(),
              jobUrl: jobUrl,
              description: description,
              salary: salaryText || '',
              postedDate: postedDateNode?.textContent?.trim(),
              companyLogoUrl: node.querySelector('img.companyAvatar')?.src || null,
              jobType: jobType
            })

            log(`Successfully scraped job: ${job.title} at ${job.company}`)
            log(`Job URL: ${jobUrl}`)
            log(`Description: ${job.description.substring(0, 100)}...`)
            log(`Salary: ${job.salary}`)
            log(`Job Type: ${job.jobType}`)
            log(`Posted Date: ${job.postedDate}`)
            jobs.push(job)
          } else {
            log('Skipping job due to missing required fields')
          }
        } catch (error) {
          log(`Error processing job ${index + 1}: ${error.message}`)
        }
      })

      // Get next page URL
      const nextPageLink = document.querySelector('a[data-testid="pagination-page-next"]')
      const nextUrl = nextPageLink ? nextPageLink.href : null

      log(`Scraped ${jobs.length} jobs from current page`)
      log(`Next page URL: ${nextUrl || 'No next page available'}`)

      // Save logs to a file
      const blob = new Blob([logMessages.join('\n')], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'indeed_scraper_logs.txt'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      log(`=== Indeed Scraping Complete: ${jobs.length} jobs found ===`)
      return { jobs, nextUrl }
    },
    scrapeJobDetail: () => {
      try {
        const title = document.querySelector('h1.jobsearch-JobInfoHeader-title')?.textContent.trim()
        const company = document.querySelector('div.jobsearch-CompanyInfoContainer a')?.textContent.trim()
        const location = document.querySelector('div.jobsearch-JobInfoHeader-subtitle div')?.textContent.trim()
        const description = document.querySelector('div#jobDescriptionText')?.textContent.trim()
        const logoUrl = document.querySelector('img.jobsearch-CompanyAvatar-image')?.src
        const salary = document.querySelector('div[data-testid="attribute_snippet_compensation"]')?.textContent.trim()
        const jobType = document.querySelector('div[data-testid="attribute_snippet_job_type"]')?.textContent.trim()

        const job = {
          title,
          company,
          location,
          description,
          companyLogoUrl: logoUrl,
          jobUrl: window.location.href,
          platform: 'Indeed',
          salary: salary || '',
          jobType: jobType || ''
        }
        console.log('Scraped Indeed job detail:', job)
        return job
      } catch (error) {
        console.error('Error scraping Indeed job detail:', error)
        return null
      }
    }
  }
}

// Export the objects to make them available in content.js
window.Job = Job
window.scrapers = scrapers 

// 添加日誌收集功能
let indeedLogs = [];

// 修改 log 函數
function log(message) {
  console.log(message);
  indeedLogs.push(message);
}

// 修改 Indeed 爬蟲函數
async function scrapeIndeedJobs() {
  indeedLogs = []; // 清空日誌
  log('=== Indeed Scraping Started ===');
  
  try {
    // ... existing scraping code ...

    // 在爬蟲結束時保存日誌
    const blob = new Blob([indeedLogs.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'indeed_scraper_logs.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    log('=== Indeed Scraping Complete ===');
    return jobs;
  } catch (error) {
    log(`Error during Indeed scraping: ${error.message}`);
    throw error;
  }
} 