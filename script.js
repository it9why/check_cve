/**
 * Security Patch - Software CVE Scanner
 * Main JavaScript file
 */

// Global state
const state = {
    softwareList: [],
    cveResults: [],
    filteredCveResults: [],
    isSearching: false,
    currentSearchIndex: 0,
    searchAborted: false,
    cveSortColumn: null,
    cveSortDirection: 'asc',
    isCveFullScreen: false
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
    exportAllBtn: document.getElementById('exportAllBtn'),
    statusContainer: document.getElementById('statusContainer'),
    statusLog: document.getElementById('statusLog'),
    currentStatus: document.getElementById('currentStatus'),
    clearStatusBtn: document.getElementById('clearStatusBtn'),
    cveExpandBtn: document.getElementById('cveExpandBtn'),
    cveSearchInput: document.getElementById('cveSearchInput'),
    cveSearchBtn: document.getElementById('cveSearchBtn'),
    cveTableContainer: document.getElementById('cveTableContainer')
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
    elements.clearStatusBtn.addEventListener('click', clearStatusLog);
    
    // CVE table functionality
    if (elements.cveExpandBtn) {
        elements.cveExpandBtn.addEventListener('click', toggleCveFullScreen);
    }
    if (elements.cveSearchBtn) {
        elements.cveSearchBtn.addEventListener('click', handleCveSearchInput);
    }
    if (elements.cveSearchInput) {
        elements.cveSearchInput.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') {
                handleCveSearchInput();
            }
        });
    }
    
    // Add sorting event listeners to table headers
    document.querySelectorAll('.sortable').forEach(header => {
        header.addEventListener('click', function() {
            handleCveSort(this.dataset.sort);
        });
    });
    
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

    // Show status container and log start
    showStatusContainer();
    addStatusMessage('info', 'Starting CVE search', `Searching for CVEs across ${state.softwareList.length} software items`);
    updateCurrentStatus('loading', `Searching for CVEs (0/${state.softwareList.length})`);

    elements.progressBarContainer.style.display = 'block';
    elements.progressBar.style.width = '0%';

    for (let i = 0; i < state.softwareList.length; i++) {
        if (state.searchAborted) break;

        const software = state.softwareList[i];
        const progress = ((i + 1) / state.softwareList.length) * 100;
        elements.progressBar.style.width = `${progress}%`;
        
        // Update current status
        updateCurrentStatus('loading', `Searching for CVEs (${i + 1}/${state.softwareList.length}): ${software.software_name} ${software.software_version}`);

        try {
            const cves = await searchCves(software.software_name, software.software_version);
            
            if (cves.length > 0) {
                addStatusMessage('success', `Found ${cves.length} CVEs for ${software.software_name}`, `Version: ${software.software_version}`);
            } else {
                addStatusMessage('info', `No CVEs found for ${software.software_name}`, `Version: ${software.software_version}`);
            }
            
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
            addStatusMessage('error', `Error searching CVEs for ${software.software_name}`, error.message);
            console.error(`Error searching CVEs for ${software.software_name}:`, error);
        }
    }

    state.isSearching = false;
    elements.progressBarContainer.style.display = 'none';
    updateUI();
    
    if (!state.searchAborted) {
        addStatusMessage('success', 'CVE search completed', `Found ${state.cveResults.length} vulnerabilities across ${state.softwareList.length} software items`);
        updateCurrentStatus('success', `Search completed. Found ${state.cveResults.length} CVEs.`);
        alert(`CVE search completed. Found ${state.cveResults.length} vulnerabilities.`);
    } else {
        addStatusMessage('warning', 'CVE search stopped', `Search was stopped by user. Found ${state.cveResults.length} vulnerabilities before stopping.`);
        updateCurrentStatus('warning', 'Search stopped by user');
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
            // Log API request start
            addStatusMessage('info', `Making API request for: ${term}`, `Software: ${softwareName} ${softwareVersion}`);

            const response = await fetch(url, { headers });
            
            // Log response status
            if (response.ok) {
                addStatusMessage('success', `API request successful for: ${term}`, `Status: ${response.status} ${response.statusText}`);
            } else {
                if (response.status === 403 && !apiKey) {
                    addStatusMessage('warning', `Rate limited for: ${term}`, 'Consider adding an API key to increase rate limits');
                    console.warn('Rate limited. Consider adding an API key.');
                    await sleep(6000); // Wait longer if rate limited
                    continue;
                }
                addStatusMessage('error', `API request failed for: ${term}`, `Status: ${response.status} ${response.statusText}`);
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.vulnerabilities) {
                const cveCount = data.vulnerabilities.length;
                if (cveCount > 0) {
                    addStatusMessage('success', `Found ${cveCount} potential CVEs for: ${term}`, `Processing vulnerabilities...`);
                }
                
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
            } else {
                addStatusMessage('info', `No vulnerabilities found for: ${term}`, 'API returned empty vulnerabilities array');
            }
        } catch (error) {
            addStatusMessage('error', `Error fetching CVEs for term "${term}"`, error.message);
            console.error(`Error fetching CVEs for term "${term}":`, error);
        }

        // Rate limiting delay
        const delay = apiKey ? 200 : 6000;
        addStatusMessage('info', `Rate limiting delay: ${delay}ms`, `Waiting before next API request...`);
        await sleep(delay); // Shorter delay with API key
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
    // Reset filtered results to all results
    state.filteredCveResults = [...state.cveResults];
    refreshCveTableDisplay();
}

// Refresh CVE table display with filtering and sorting
function refreshCveTableDisplay() {
    const tbody = elements.cveTableBody;
    tbody.innerHTML = '';

    // Apply search filter if there's a search term
    const searchTerm = elements.cveSearchInput ? elements.cveSearchInput.value.trim().toLowerCase() : '';
    if (searchTerm) {
        state.filteredCveResults = state.cveResults.filter(cve => 
            cve.id.toLowerCase().includes(searchTerm) ||
            cve.software.toLowerCase().includes(searchTerm) ||
            cve.version.toLowerCase().includes(searchTerm) ||
            cve.severity.toLowerCase().includes(searchTerm) ||
            cve.published.toLowerCase().includes(searchTerm) ||
            cve.description.toLowerCase().includes(searchTerm)
        );
    } else {
        state.filteredCveResults = [...state.cveResults];
    }

    // Apply sorting
    if (state.cveSortColumn) {
        state.filteredCveResults.sort((a, b) => {
            let aVal = a[state.cveSortColumn];
            let bVal = b[state.cveSortColumn];
            
            // Handle special cases
            if (state.cveSortColumn === 'id') {
                aVal = a.id;
                bVal = b.id;
            } else if (state.cveSortColumn === 'score') {
                aVal = a.score || 0;
                bVal = b.score || 0;
            }
            
            // Handle null/undefined values
            if (aVal === undefined || aVal === null) aVal = '';
            if (bVal === undefined || bVal === null) bVal = '';
            
            // Convert to string for case-insensitive comparison
            if (typeof aVal === 'string') aVal = aVal.toLowerCase();
            if (typeof bVal === 'string') bVal = bVal.toLowerCase();
            
            if (aVal < bVal) return state.cveSortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return state.cveSortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }

    // Update table headers with sort indicators
    document.querySelectorAll('.sortable i').forEach(icon => {
        icon.className = 'fas fa-sort';
    });
    
    if (state.cveSortColumn) {
        const currentHeader = document.querySelector(`.sortable[data-sort="${state.cveSortColumn}"]`);
        if (currentHeader) {
            const icon = currentHeader.querySelector('i');
            if (icon) {
                icon.className = state.cveSortDirection === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
            }
        }
    }

    // Render rows
    state.filteredCveResults.forEach((cve, index) => {
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

    elements.cveCount.textContent = `${state.filteredCveResults.length} CVE(s) found${searchTerm ? ` (filtered from ${state.cveResults.length})` : ''}`;
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

// Status logging functions
function showStatusContainer() {
    elements.statusContainer.style.display = 'block';
}

function hideStatusContainer() {
    elements.statusContainer.style.display = 'none';
}

function clearStatusLog() {
    elements.statusLog.innerHTML = '';
    elements.currentStatus.innerHTML = '';
}

function addStatusMessage(type, message, details = '') {
    const timestamp = new Date().toLocaleTimeString();
    const icon = getStatusIcon(type);
    const colorClass = getStatusColorClass(type);
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `status-message ${colorClass} p-2 mb-2 rounded border`;
    messageDiv.innerHTML = `
        <div class="d-flex justify-content-between align-items-start">
            <div class="d-flex align-items-center">
                <i class="${icon} me-2"></i>
                <div>
                    <strong>${message}</strong>
                    ${details ? `<div class="small text-muted mt-1">${details}</div>` : ''}
                </div>
            </div>
            <span class="small text-muted">${timestamp}</span>
        </div>
    `;
    
    elements.statusLog.prepend(messageDiv);
    elements.statusLog.scrollTop = 0;
    
    // Update current status
    elements.currentStatus.innerHTML = `
        <div class="alert alert-${getAlertClass(type)} alert-dismissible fade show py-2" role="alert">
            <i class="${icon} me-2"></i>
            <strong>${type.toUpperCase()}:</strong> ${message}
            ${details ? `<div class="small mt-1">${details}</div>` : ''}
        </div>
    `;
}

function updateCurrentStatus(type, message) {
    const icon = getStatusIcon(type);
    elements.currentStatus.innerHTML = `
        <div class="alert alert-${getAlertClass(type)} py-2 mb-0" role="alert">
            <i class="${icon} me-2"></i>
            <strong>${type.toUpperCase()}:</strong> ${message}
        </div>
    `;
}

function getStatusIcon(type) {
    switch(type) {
        case 'success': return 'fas fa-check-circle';
        case 'info': return 'fas fa-info-circle';
        case 'warning': return 'fas fa-exclamation-triangle';
        case 'error': return 'fas fa-exclamation-circle';
        case 'loading': return 'fas fa-spinner fa-spin';
        default: return 'fas fa-info-circle';
    }
}

function getStatusColorClass(type) {
    switch(type) {
        case 'success': return 'bg-success bg-opacity-10 text-success border-success';
        case 'info': return 'bg-info bg-opacity-10 text-info border-info';
        case 'warning': return 'bg-warning bg-opacity-10 text-warning border-warning';
        case 'error': return 'bg-danger bg-opacity-10 text-danger border-danger';
        case 'loading': return 'bg-primary bg-opacity-10 text-primary border-primary';
        default: return 'bg-secondary bg-opacity-10 text-secondary border-secondary';
    }
}

function getAlertClass(type) {
    switch(type) {
        case 'success': return 'success';
        case 'info': return 'info';
        case 'warning': return 'warning';
        case 'error': return 'danger';
        case 'loading': return 'primary';
        default: return 'secondary';
    }
}

// Handle CVE table sorting
function handleCveSort(column) {
    if (state.cveSortColumn === column) {
        // Toggle direction if same column
        state.cveSortDirection = state.cveSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        // New column, default to ascending
        state.cveSortColumn = column;
        state.cveSortDirection = 'asc';
    }
    refreshCveTableDisplay();
}

// Handle CVE search input
function handleCveSearchInput() {
    refreshCveTableDisplay();
}

// Toggle full screen mode for CVE table
function toggleCveFullScreen() {
    state.isCveFullScreen = !state.isCveFullScreen;
    const card = elements.cveExpandBtn.closest('.card');
    const tableContainer = elements.cveTableContainer;
    const icon = elements.cveExpandBtn.querySelector('i');
    
    if (state.isCveFullScreen) {
        // Enter full screen
        card.classList.add('full-screen');
        tableContainer.style.maxHeight = 'calc(100vh - 200px)';
        tableContainer.style.height = 'calc(100vh - 200px)';
        icon.className = 'fas fa-compress';
        elements.cveExpandBtn.title = 'Exit full screen';
        
        // Scroll to the card
        card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        // Exit full screen
        card.classList.remove('full-screen');
        tableContainer.style.maxHeight = '';
        tableContainer.style.height = '';
        icon.className = 'fas fa-expand';
        elements.cveExpandBtn.title = 'Expand to full screen';
    }
}

// Make functions available globally for onclick handlers
window.removeSoftware = removeSoftware;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
