/**
 * Security Patch - Software CVE Scanner
 * Main JavaScript file
 */

// Global state
const state = {
    softwareList: [],
    cveResults: [],
    isSearching: false,
    currentSearchIndex: 0,
    searchAborted: false
};

// DOM Elements
const elements = {
    fileInput: document.getElementById('fileInput'),
    fileType: document.getElementById('fileType'),
    importBtn: document.getElementById('importBtn'),
    clearBtn: document.getElementById('clearBtn'),
    sampleBtn: document.getElementById('sampleBtn'),
    searchBtn: document.getElementById('searchBtn'),
    stopBtn: document.getElementById('stopBtn'),
    apiKey: document.getElementById('apiKey'),
    progressBarContainer: document.getElementById('progressBarContainer'),
    progressBar: document.querySelector('.progress-bar'),
    softwareTableBody: document.getElementById('softwareTableBody'),
    tableCount: document.getElementById('tableCount'),
    cveTableBody: document.getElementById('cveTableBody'),
    cveCount: document.getElementById('cveCount'),
    exportCsvBtn: document.getElementById('exportCsvBtn'),
    exportJsonBtn: document.getElementById('exportJsonBtn'),
    exportAllBtn: document.getElementById('exportAllBtn')
};

// Sample data for demonstration
const SAMPLE_DATA = [
    { software_name: 'Apache HTTP Server', software_version: '2.4.58', last_update: '2024-01-01' },
    { software_name: 'nginx', software_version: '1.25.3', last_update: '2023-12-15' },
    { software_name: 'OpenSSL', software_version: '3.0.11', last_update: '2024-02-13' },
    { software_name: 'Node.js', software_version: '20.11.1', last_update: '2024-01-30' },
    { software_name: 'Python', software_version: '3.12.2', last_update: '2024-02-10' },
    { software_name: 'MySQL', software_version: '8.0.36', last_update: '2024-01-16' },
    { software_name: 'PostgreSQL', software_version: '16.2', last_update: '2024-02-08' },
    { software_name: 'Redis', software_version: '7.2.4', last_update: '2023-12-20' },
    { software_name: 'Docker', software_version: '24.0.7', last_update: '2023-11-14' },
    { software_name: 'Git', software_version: '2.43.0', last_update: '2023-11-20' }
];

// Initialize the application
function init() {
    attachEventListeners();
    updateUI();
}

// Attach event listeners to all interactive elements
function attachEventListeners() {
    elements.importBtn.addEventListener('click', handleImport);
    elements.clearBtn.addEventListener('click', handleClear);
    elements.sampleBtn.addEventListener('click', handleSampleData);
    elements.searchBtn.addEventListener('click', handleCveSearch);
    elements.stopBtn.addEventListener('click', handleStopSearch);
    elements.exportCsvBtn.addEventListener('click', () => exportData('csv'));
    elements.exportJsonBtn.addEventListener('click', () => exportData('json'));
    elements.exportAllBtn.addEventListener('click', exportAllData);
    
    // Enable search button when there's software data
    elements.searchBtn.disabled = state.softwareList.length === 0;
}

// Handle file import
function handleImport() {
    const file = elements.fileInput.files[0];
    if (!file) {
        alert('Please select a file first.');
        return;
    }

    const fileType = elements.fileType.value;
    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            let data;
            if (fileType === 'csv') {
                data = parseCSV(e.target.result);
            } else {
                data = JSON.parse(e.target.result);
            }
            
            if (!Array.isArray(data)) {
                throw new Error('Data must be an array of objects');
            }

            // Validate required fields
            const validatedData = data.map(item => ({
                software_name: item.software_name || item['Software Name'] || item.name || 'Unknown',
                software_version: item.software_version || item['Software Version'] || item.version || 'Unknown',
                last_update: item.last_update || item['Last Update'] || item.lastUpdate || 'N/A'
            }));

            state.softwareList = validatedData;
            updateSoftwareTable();
            updateUI();
            alert(`Successfully imported ${validatedData.length} software items.`);
        } catch (error) {
            alert(`Error parsing file: ${error.message}`);
            console.error(error);
        }
    };

    reader.readAsText(file);
}

// Parse CSV using Papa Parse
function parseCSV(csvText) {
    const results = Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: header => header.trim()
    });
    
    if (results.errors.length > 0) {
        console.warn('CSV parsing warnings:', results.errors);
    }
    
    return results.data;
}

// Handle sample data loading
function handleSampleData() {
    state.softwareList = SAMPLE_DATA.map(item => ({...item}));
    updateSoftwareTable();
    updateUI();
    alert(`Loaded ${SAMPLE_DATA.length} sample software items.`);
}

// Clear all data
function handleClear() {
    if (confirm('Are you sure you want to clear all data?')) {
        state.softwareList = [];
        state.cveResults = [];
        updateSoftwareTable();
        updateCveTable();
        updateUI();
    }
}

// Update software table display
function updateSoftwareTable() {
    const tbody = elements.softwareTableBody;
    tbody.innerHTML = '';

    state.softwareList.forEach((software, index) => {
        const row = document.createElement('tr');
        row.className = 'fade-in';
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${escapeHtml(software.software_name)}</td>
            <td><span class="badge bg-secondary">${escapeHtml(software.software_version)}</span></td>
            <td>${escapeHtml(software.last_update)}</td>
            <td>
                <button class="btn btn-sm btn-outline-danger" onclick="removeSoftware(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    elements.tableCount.textContent = `${state.softwareList.length} software item(s)`;
}

// Remove a software item
function removeSoftware(index) {
    state.softwareList.splice(index, 1);
    // Also remove any CVEs associated with this software
    state.cveResults = state.cveResults.filter(cve => cve.softwareIndex !== index);
    updateSoftwareTable();
    updateCveTable();
    updateUI();
}

// Handle CVE search
async function handleCveSearch() {
    if (state.softwareList.length === 0) {
        alert('Please import software data first.');
        return;
    }

    state.isSearching = true;
    state.searchAborted = false;
    state.cveResults = [];
    updateCveTable();
    updateUI();

    elements.progressBarContainer.style.display = 'block';
    elements.progressBar.style.width = '0%';

    for (let i = 0; i < state.softwareList.length; i++) {
        if (state.searchAborted) break;

        const software = state.softwareList[i];
        const progress = ((i + 1) / state.softwareList.length) * 100;
        elements.progressBar.style.width = `${progress}%`;

        try {
            const cves = await searchCves(software.software_name, software.software_version);
            cves.forEach(cve => {
                cve.softwareIndex = i;
                state.cveResults.push(cve);
            });
            
            updateCveTable();
            updateUI();
            
            // Rate limiting: wait between requests
            if (i < state.softwareList.length - 1 && !state.searchAborted) {
                await sleep(1000); // 1 second delay between requests
            }
        } catch (error) {
            console.error(`Error searching CVEs for ${software.software_name}:`, error);
        }
    }

    state.isSearching = false;
    elements.progressBarContainer.style.display = 'none';
    updateUI();
    
    if (!state.searchAborted) {
        alert(`CVE search completed. Found ${state.cveResults.length} vulnerabilities.`);
    }
}

// Stop search
function handleStopSearch() {
    state.searchAborted = true;
    state.isSearching = false;
    elements.progressBarContainer.style.display = 'none';
    updateUI();
    alert('CVE search stopped.');
}

// Search for CVEs using NVD API
async function searchCves(softwareName, softwareVersion) {
    const apiKey = elements.apiKey.value.trim();
    const searchTerms = [
        softwareName,
        `${softwareName} ${softwareVersion}`,
        softwareName.replace(/\s+/g, '+'),
        `${softwareName}+${softwareVersion}`
    ];

    const uniqueCves = new Set();
    const results = [];

    for (const term of searchTerms) {
        if (term.length < 2) continue;

        const url = `https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=${encodeURIComponent(term)}`;
        const headers = {};
        if (apiKey) {
            headers['apiKey'] = apiKey;
        }

        try {
            const response = await fetch(url, { headers });
            if (!response.ok) {
                if (response.status === 403 && !apiKey) {
                    console.warn('Rate limited. Consider adding an API key.');
                    await sleep(6000); // Wait longer if rate limited
                    continue;
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.vulnerabilities) {
                data.vulnerabilities.forEach(vuln => {
                    const cve = vuln.cve;
                    if (!uniqueCves.has(cve.id)) {
                        uniqueCves.add(cve.id);
                        
                        // Extract severity
                        let severity = 'Unknown';
                        let cvssScore = 0;
                        
                        if (cve.metrics?.cvssMetricV31?.[0]) {
                            const cvss = cve.metrics.cvssMetricV31[0];
                            cvssScore = cvss.cvssData.baseScore;
                            severity = getSeverityFromScore(cvssScore);
                        } else if (cve.metrics?.cvssMetricV2?.[0]) {
                            const cvss = cve.metrics.cvssMetricV2[0];
                            cvssScore = cvss.cvssData.baseScore;
                            severity = getSeverityFromScore(cvssScore);
                        }
                        
                        results.push({
                            id: cve.id,
                            software: softwareName,
                            version: softwareVersion,
                            severity: severity,
                            score: cvssScore,
                            published: cve.published?.split('T')[0] || 'Unknown',
                            description: cve.descriptions?.[0]?.value || 'No description available',
                            url: `https://nvd.nist.gov/vuln/detail/${cve.id}`
                        });
                    }
                });
            }
        } catch (error) {
            console.error(`Error fetching CVEs for term "${term}":`, error);
        }

        // Rate limiting delay
        await sleep(apiKey ? 200 : 6000); // Shorter delay with API key
    }

    return results;
}

// Get severity level from CVSS score
function getSeverityFromScore(score) {
    if (score >= 9.0) return 'Critical';
    if (score >= 7.0) return 'High';
    if (score >= 4.0) return 'Medium';
    if (score >= 0.1) return 'Low';
    return 'None';
}

// Update CVE table display
function updateCveTable() {
    const tbody = elements.cveTableBody;
    tbody.innerHTML = '';

    state.cveResults.forEach((cve, index) => {
        const row = document.createElement('tr');
        row.className = 'fade-in';
        const severityClass = `severity-${cve.severity.toLowerCase()}`;
        
        // Truncate description for display
        const shortDesc = cve.description.length > 100 
            ? cve.description.substring(0, 100) + '...' 
            : cve.description;
        
        row.innerHTML = `
            <td>
                <a href="${cve.url}" target="_blank" class="text-decoration-none">
                    ${cve.id}
                </a>
            </td>
            <td>${escapeHtml(cve.software)}</td>
            <td><span class="badge bg-secondary">${escapeHtml(cve.version)}</span></td>
            <td class="${severityClass}">${cve.severity} ${cve.score ? `(${cve.score.toFixed(1)})` : ''}</td>
            <td>${cve.published}</td>
            <td title="${escapeHtml(cve.description)}">${escapeHtml(shortDesc)}</td>
        `;
        tbody.appendChild(row);
    });

    elements.cveCount.textContent = `${state.cveResults.length} CVE(s) found`;
}

// Export data
function exportData(format) {
    if (state.cveResults.length === 0) {
        alert('No CVE results to export.');
        return;
    }

    let content, mimeType, filename;
    
    if (format === 'csv') {
        const headers = ['CVE ID', 'Software', 'Version', 'Severity', 'Score', 'Published', 'Description', 'URL'];
        const rows = state.cveResults.map(cve => [
            cve.id,
            cve.software,
            cve.version,
            cve.severity,
            cve.score,
            cve.published,
            cve.description,
            cve.url
        ]);
        
        content = Papa.unparse({
            fields: headers,
            data: rows
        });
        mimeType = 'text/csv';
        filename = `cve_results_${new Date().toISOString().split('T')[0]}.csv`;
    } else {
        content = JSON.stringify(state.cveResults, null, 2);
        mimeType = 'application/json';
        filename = `cve_results_${new Date().toISOString().split('T')[0]}.json`;
    }

    downloadFile(content, mimeType, filename);
}

// Export all data (software + CVEs)
function exportAllData() {
    if (state.softwareList.length === 0 && state.cveResults.length === 0) {
        alert('No data to export.');
        return;
    }

    const data = {
        exportDate: new Date().toISOString(),
        softwareList: state.softwareList,
        cveResults: state.cveResults,
        summary: {
            softwareCount: state.softwareList.length,
            cveCount: state.cveResults.length,
            criticalCount: state.cveResults.filter(c => c.severity === 'Critical').length,
            highCount: state.cveResults.filter(c => c.severity === 'High').length
        }
    };

    const content = JSON.stringify(data, null, 2);
    const filename = `security_patch_export_${new Date().toISOString().split('T')[0]}.json`;
    downloadFile(content, 'application/json', filename);
}

// Download helper function
function downloadFile(content, mimeType, filename) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Update UI state
function updateUI() {
    elements.searchBtn.disabled = state.softwareList.length === 0 || state.isSearching;
    elements.stopBtn.disabled = !state.isSearching;
    
    if (state.isSearching) {
        elements.searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching...';
        elements.searchBtn.classList.add('disabled');
    } else {
        elements.searchBtn.innerHTML = '<i class="fas fa-search"></i> Search CVEs';
        elements.searchBtn.classList.remove('disabled');
    }
    
    elements.exportCsvBtn.disabled = state.cveResults.length === 0;
    elements.exportJsonBtn.disabled = state.cveResults.length === 0;
    elements.exportAllBtn.disabled = state.softwareList.length === 0 && state.cveResults.length === 0;
}

// Utility functions
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make functions available globally for onclick handlers
window.removeSoftware = removeSoftware;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);