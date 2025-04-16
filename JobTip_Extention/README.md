# Jobtip Browser Extension

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://github.com/Rorogogogo/Jobtip-extention/blob/main/LICENSE)
[![GitHub Issues](https://img.shields.io/github/issues/Rorogogogo/Jobtip-extention)](https://github.com/Rorogogogo/Jobtip-extention/issues)

A powerful browser extension that enhances your job search experience by seamlessly integrating with [Jobtip](https://jobtip.me/). This extension automatically scrapes job listings from popular job platforms and helps you manage your job search journey effectively.

## ⚠️ Important Disclaimer

This extension uses web scraping to collect job information. Please note:

- **Rate Limiting**: To avoid overwhelming job sites' servers and prevent potential IP blocking:
  - Limit your searches to a reasonable number per hour
  - Avoid rapid-fire searches or excessive page refreshes
  - Use the extension as you would normally browse job listings
- **Terms of Service**:
  - Be aware that excessive scraping may violate job sites' terms of service
  - Use this tool responsibly and ethically
  - This extension is for personal use only
- **Data Accuracy**:
  - Job listings may change or be removed without notice
  - Always verify information on the original job posting
  - We cannot guarantee 100% accuracy of scraped data
- **Site Changes**:
  - Website structure changes may temporarily affect the extension's functionality
  - Updates will be released to address any scraping issues
  - Please report any inconsistencies or issues

## Features

### Multi-Platform Support

- **LinkedIn**: Extracts job titles, companies, locations, salaries, and posting dates
- **Indeed**: Captures comprehensive job details including job type, salary information, and descriptions
- **SEEK**: Scrapes job listings with company information, locations, and salary details

### Data Extraction

The extension automatically extracts:

- Job Title
- Company Name
- Location
- Salary (when available)
- Job Type (Full-time, Part-time, Contract, etc.)
- Posted Date
- Company Logo
- Job Description
- Direct Job URL

### Integration with Jobtip

- Seamlessly syncs your scraped job listings with [Jobtip](https://jobtip.me/)
- Manage and track your job applications in one place
- Access your saved jobs across devices
- Get insights into your job search progress

## How to Use

1. **Installation**

   - Download the extension files
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the extension directory

2. **Job Search**

   - Visit LinkedIn, Indeed, or SEEK
   - Search for jobs as you normally would
   - The extension will automatically detect and scrape job listings

3. **Managing Jobs**
   - Click the extension icon to view scraped jobs
   - Use the "Save" button to sync jobs with your Jobtip account
   - Click "View" to open the original job posting
   - Export jobs to CSV format for offline use

## Supported Platforms

- LinkedIn (www.linkedin.com/jobs)
- Indeed (www.indeed.com)
- SEEK (www.seek.com.au)

## Privacy & Security

- The extension only activates on supported job sites
- Only scrapes publicly available job information
- No personal data is collected
- All data is securely transmitted to Jobtip using encryption

## Development

### Prerequisites

- Chrome Browser
- Basic understanding of JavaScript and browser extensions

### Local Development

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
