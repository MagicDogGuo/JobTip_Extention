# Jobtip Browser Extension

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://github.com/Rorogogogo/Jobtip-extention/blob/main/LICENSE)
[![GitHub Issues](https://img.shields.io/github/issues/Rorogogogo/Jobtip-extention)](https://github.com/Rorogogogo/Jobtip-extention/issues)

A browser extension designed to streamline your job search by scraping job listings from various platforms and potentially integrating with the [Jobtip](https://jobtip.me/) service. This tool helps you gather and manage job application information efficiently.

## ⚠️ Important Disclaimer

This extension uses web scraping to collect job information. Please be mindful of the following:

-   **Rate Limiting**: Excessive scraping can overload job site servers and may lead to temporary or permanent IP blocks.
    -   Use the extension moderately, mimicking normal browsing behavior.
    -   Avoid running rapid, automated searches across many pages.
-   **Terms of Service**: Automated scraping may violate the terms of service of the job platforms you visit.
    -   Use this tool responsibly and ethically.
    -   This extension is intended for personal, non-commercial use.
-   **Data Accuracy**: Job details can change frequently.
    -   Always verify information directly on the original job posting page.
    -   Scraped data accuracy cannot be guaranteed due to potential website structure changes or listing updates.
-   **Site Changes**: Job platforms often update their website layouts, which can break the scraping functionality.
    -   The extension may require updates to adapt to these changes. Please report any issues you encounter.

## Features

### Core Functionality

-   **Job Scraping**: Extracts job details from search result pages and potentially individual job pages.
-   **Side Panel UI**: Provides an interface within the browser's side panel to manage and view scraped jobs.
-   **Background Processing**: Handles communication between components and fetches job detail page content when needed.

### Supported Platforms (Primary)

-   **LinkedIn**: Extracts job listings from `linkedin.com/jobs`.
-   **SEEK**: Supports `seek.com.au` (Australia) and `seek.co.nz` (New Zealand).
-   **Indeed**: Extracts jobs from various regional Indeed sites (e.g., `.com`, `.com.au`, `.co.nz`, `.co.uk`, `.ca`).

*(Note: The extension manifest includes permissions for Reed.co.uk and Workopolis.com, but scraping functionality for these might be experimental or incomplete.)*

### Data Extraction

The extension attempts to extract the following details (availability may vary by platform and listing):

-   Job Title
-   Company Name
-   Location
-   Salary Information
-   Job Type (Full-time, Part-time, Contract, etc.)
-   Date Posted / Created At
-   Job Description Snippet / Full Description
-   Direct URL to the Job Posting

### Potential Integration

-   **Jobtip Sync**: The extension includes components suggesting the ability to sync scraped job data with the [Jobtip](https://jobtip.me/) service or a local backend instance. *(Verification of current sync status recommended)*.

## How to Use

1.  **Installation**
    -   Download or clone the extension's source code.
    -   Open Google Chrome and navigate to `chrome://extensions/`.
    -   Enable "Developer mode" (usually a toggle in the top-right corner).
    -   Click "Load unpacked" and select the directory containing the extension's `manifest.json` file (the `JobTip_Extention` folder).

2.  **Login**:
    -   Make sure you are logged into your account on the job platform(s) you intend to search (e.g., LinkedIn, SEEK, Indeed).

3.  **Job Search**
    -   Navigate to a supported job platform (LinkedIn Jobs, SEEK, Indeed).
    -   Perform a job search as usual.

4.  **Scraping & Managing Jobs**
    -   Click the Jobtip extension icon in your browser toolbar. This should open the Side Panel.
    -   Use the controls within the Side Panel to initiate scraping for the current page.
    -   View scraped jobs within the Side Panel.
    -   (If applicable) Use options within the Side Panel or Popup to save/sync jobs to Jobtip.

## Supported Platforms (Details)

-   LinkedIn (`linkedin.com/jobs/*`)
-   SEEK (`seek.com.au/*`, `seek.co.nz/*`)
-   Indeed (`indeed.com/*`, `*.indeed.com/*`)
-   *(Potential experimental support for `reed.co.uk/*`, `workopolis.com/*`)*

## Privacy & Security

-   The extension requests permissions necessary for its functionality (accessing tabs, storage, scripting on specific sites).
-   It primarily scrapes publicly available data from job sites.
-   Review the `host_permissions` in `manifest.json` for the list of sites the extension can interact with.
-   If syncing with Jobtip, data transmission security depends on the service's implementation (likely HTTPS).

## Development

### Prerequisites

-   Google Chrome Browser
-   Basic knowledge of JavaScript, HTML, CSS, and Chrome Extension APIs (Manifest V3).
-   Node.js and npm/yarn might be required if there are build steps or dependencies managed via package managers (check for `package.json`).

### Local Development Setup

1.  Ensure you have the prerequisites installed.
2.  Clone the repository: `git clone <repository-url>`
3.  Load the extension in Chrome using "Load unpacked" as described in the Installation section.
4.  Make changes to the code. Reload the extension in `chrome://extensions/` to see updates (content scripts might require refreshing the target page).

### Contribution

(Standard contribution steps - kept from original)
1.  Fork the repository.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
