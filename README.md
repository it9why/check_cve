# Security Patch - Software CVE Scanner

A web-based tool for scanning software lists for Common Vulnerabilities and Exposures (CVEs) using the NVD (National Vulnerability Database) API. This application helps security professionals and system administrators monitor security patches required for their software stack.

## Features

- **Import Software Lists**: Upload CSV or JSON files containing software names, versions, and last update dates
- **Sample Data**: Quick start with pre-loaded sample software data (Apache, nginx, OpenSSL, etc.)
- **CVE Search**: Automated search for CVEs using NVD API with multiple search terms
- **Real-time Status Display**: Detailed logging of API requests, responses, and search progress
- **Results Visualization**: Tabular display of found CVEs with severity ratings and descriptions
- **Export Functionality**: Export results as CSV or JSON for further analysis
- **Rate Limiting Management**: Built-in delays for public API usage with optional API key support
- **Responsive Design**: Works on desktop and mobile devices

## Live Demo

Open `index.html` in any modern web browser to start using the application.

## Quick Start

1. **Download or clone** this repository
2. **Open `index.html`** in your web browser
3. **Import software data** using the sample data button or upload your own CSV/JSON file
4. **Click "Search CVEs"** to start scanning for vulnerabilities
5. **Review results** and export as needed

## Detailed Usage Guide

### 1. Importing Software Data

You can import software data in two ways:

#### Option A: Upload CSV/JSON File
- Prepare a file with columns: `software_name`, `software_version`, `last_update`
- Supported formats: CSV (comma-separated) or JSON (array of objects)
- Click "Choose file", select your file, then click "Import"

#### Option B: Use Sample Data
- Click "Load Sample Data" to load 10 common software items
- This is perfect for testing the application

### 2. Searching for CVEs

1. **Enter API Key (Optional)**: Get a free API key from [NVD API Key Request](https://nvd.nist.gov/developers/request-an-api-key) to increase rate limits
2. **Click "Search CVEs"**: The application will:
   - Show progress bar for overall completion
   - Display detailed status of each API request
   - Log successes, warnings, and errors in real-time
   - Update the CVE results table as vulnerabilities are found

### 3. Understanding the Status Display

The status panel provides real-time feedback during CVE searches:

- **Info Messages**: API requests being made, search terms used
- **Success Messages**: API responses received, CVEs found
- **Warning Messages**: Rate limiting, no vulnerabilities found
- **Error Messages**: Failed API requests, network issues
- **Loading Status**: Current software being processed, progress indicator

Each status message includes:
- Timestamp of the event
- Message type (Info, Success, Warning, Error, Loading)
- Detailed description
- Relevant data (HTTP status codes, CVE counts, etc.)

### 4. Reviewing Results

The CVE Results table displays:
- **CVE ID**: Clickable links to NVD database for full details
- **Software**: Affected software name
- **Version**: Specific software version
- **Severity**: Color-coded severity (Critical, High, Medium, Low, None)
- **Published Date**: When the CVE was published
- **Description**: Brief description of the vulnerability

### 5. Exporting Results

Export your findings for documentation or further analysis:
- **Export as CSV**: Downloads all CVE results as a CSV file
- **Export as JSON**: Downloads all CVE results as a JSON file
- **Export All Data**: Downloads both software list and CVE results with summary statistics

## File Format Specifications

### CSV Format
```csv
software_name,software_version,last_update
Apache HTTP Server,2.4.58,2024-01-01
nginx,1.25.3,2023-12-15
OpenSSL,3.0.11,2024-02-13
```

### JSON Format
```json
[
  {
    "software_name": "Apache HTTP Server",
    "software_version": "2.4.58",
    "last_update": "2024-01-01"
  },
  {
    "software_name": "nginx",
    "software_version": "1.25.3",
    "last_update": "2023-12-15"
  }
]
```

### Alternative Column Names
The application accepts these alternative column names:
- `Software Name`, `Software Version`, `Last Update`
- `name`, `version`, `lastUpdate`

## API Integration

### NVD API Usage
- Uses NVD REST API v2.0 for CVE searches
- Multiple search terms per software (name, name+version, URL-encoded variants)
- Rate limiting: 5 requests per 30 seconds without API key, 50 requests per 30 seconds with API key
- Automatic delay between requests to respect rate limits

### Status Display Implementation
The application provides comprehensive API request monitoring:
- **Request Logging**: Each API call is logged with search term and timestamp
- **Response Tracking**: HTTP status codes and response details
- **Error Handling**: Detailed error messages for failed requests
- **Progress Updates**: Real-time progress through software list

## Technical Details

### Technologies Used
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **UI Framework**: Bootstrap 5
- **Icons**: Font Awesome
- **CSV Parsing**: PapaParse library
- **API Integration**: Fetch API with async/await

### Browser Compatibility
- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+
- Opera 47+

### Project Structure
```
security_patch/
├── index.html          # Main application interface
├── script.js           # Application logic and API integration
├── style.css           # Custom styling
├── README.md           # This documentation
├── LICENSE             # MIT License
├── sample_software.csv # Sample data in CSV format
├── sample_software.json # Sample data in JSON format
├── libs/               # Third-party libraries
│   ├── bootstrap.bundle.min.js
│   ├── bootstrap.min.css
│   ├── font-awesome.min.css
│   └── papaparse.min.js
└── webfonts/           # Font Awesome webfonts
```

## Sample Data Included

The application includes 10 sample software items for testing:
1. Apache HTTP Server 2.4.58
2. nginx 1.25.3
3. OpenSSL 3.0.11
4. Node.js 20.11.1
5. Python 3.12.2
6. MySQL 8.0.36
7. PostgreSQL 16.2
8. Redis 7.2.4
9. Docker 24.0.7
10. Git 2.43.0

## Troubleshooting

### Common Issues

1. **"Rate limited" warnings**
   - Solution: Add a free NVD API key to increase rate limits
   - The application automatically waits longer between requests when rate limited

2. **No CVEs found for known vulnerable software**
   - The NVD API may not have vulnerabilities for that specific version
   - Try searching with just the software name (without version)

3. **Import errors**
   - Ensure your file uses supported column names
   - Check CSV/JSON formatting
   - Remove any special characters or BOM markers

4. **API request failures**
   - Check internet connection
   - NVD API may be temporarily unavailable
   - Try again after a few minutes

### Browser Console
For advanced troubleshooting, check the browser console (F12) for:
- Detailed error messages
- Network request/response details
- JavaScript execution logs

## Privacy & Security

- All processing happens locally in your browser
- No data is sent to any server except NVD API for CVE searches
- API keys (if provided) are only used for NVD API requests
- Exported files are downloaded locally to your computer

## License

MIT License - See LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Acknowledgments

- National Vulnerability Database (NVD) for providing the CVE API
- Bootstrap team for the responsive UI framework
- PapaParse for CSV parsing capabilities
- Font Awesome for the icon set

## Support

For issues, questions, or feature requests:
1. Check the troubleshooting section above
2. Review the detailed status messages during CVE searches
3. Open an issue on the GitHub repository

---

**Note**: This tool is for security assessment and informational purposes only. Always verify CVE details from official sources and consult with security professionals for critical systems.