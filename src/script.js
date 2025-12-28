let settings = {};
let allApiItems = [];
let currentCategory = 'all';
let originalCategories = [];

const categoryIcons = {
    'Downloader': 'download',
    'Imagecreator': 'image',
    'Openai': 'smart_toy',
    'Random': 'shuffle',
    'Search': 'search',
    'Stalker': 'visibility',
    'Tools': 'build',
    'Orderkuota': 'paid',
    'AI Tools': 'psychology',
    'All': 'grid_view'
};

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    
    // Add keyboard shortcut for search
    document.addEventListener('keydown', function(e) {
        if (e.key === '/' && !e.target.matches('input, textarea')) {
            e.preventDefault();
            const searchInput = document.getElementById('searchInput');
            if (searchInput) searchInput.focus();
        }
    });
});

async function initializeApp() {
    try {
        settings = await loadSettings();
        setupUI();
        await loadAPIData();
        setupEventListeners();
        updateActiveUsers();
        updateEndpointCount();
        
    } catch (error) {
        console.error('Error:', error);
        showErrorMessage(error);
    } finally {
        // Always hide loading screen
        setTimeout(() => {
            const loadingScreen = document.getElementById('loadingScreen');
            if (loadingScreen) {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                }, 500);
            }
        }, 1000);
    }
}

async function loadSettings() {
    try {
        const response = await fetch('/settings');
        if (!response.ok) throw new Error('Settings not found');
        return await response.json();
    } catch (error) {
        return getDefaultSettings();
    }
}

function getDefaultSettings() {
    return {
        name: "Kynas API",
        creator: "Kynas",
        description: "Interactive API documentation with real-time testing",
        categories: []
    };
}

function setupUI() {
    const titleApi = document.getElementById("titleApi");
    const descApi = document.getElementById("descApi");
    const footer = document.getElementById("footer");
    
    if (titleApi) titleApi.textContent = settings.name || "Kynas API";
    if (descApi) descApi.textContent = settings.description || "Interactive API documentation with real-time testing";
    if (footer) footer.textContent = `© ${new Date().getFullYear()} ${settings.creator || "Kynas"} • Cosmic Edition v1.0`;
    
    // Social links
    const telegramLink = document.getElementById('telegramLink');
    const whatsappLink = document.getElementById('whatsappLink');
    const youtubeLink = document.getElementById('youtubeLink');
    const githubLink = document.getElementById('githubLink');
    const contactBtn = document.getElementById('contactCustomerBtn');
    
    if (telegramLink) telegramLink.href = settings.linkTelegram || '#';
    if (whatsappLink) whatsappLink.href = settings.linkWhatsapp || '#';
    if (youtubeLink) youtubeLink.href = settings.linkYoutube || '#';
    if (githubLink) githubLink.href = settings.linkGithub || '#';
    if (contactBtn) contactBtn.href = settings.linkWhatsapp || '#';
}

function updateActiveUsers() {
    const el = document.getElementById('activeUsers');
    if (el) {
        const users = Math.floor(Math.random() * 5000) + 1000;
        el.textContent = users.toLocaleString() + '+';
    }
}

function updateEndpointCount() {
    const el = document.getElementById('endpointCount');
    if (el && originalCategories.length > 0) {
        let total = 0;
        originalCategories.forEach(category => {
            if (category.items) total += category.items.length;
        });
        el.textContent = total;
    }
}

async function loadAPIData() {
    console.log('Loading API data...');
    
    try {
        if (!settings.categories || settings.categories.length === 0) {
            console.log('No categories found, using default');
            settings.categories = [];
        }
        
        // Save original data
        originalCategories = JSON.parse(JSON.stringify(settings.categories || []));
        console.log('Original categories saved:', originalCategories.length);
        
        // Render category tabs and initial API data
        renderCategoryTabs();
        renderAPIData(originalCategories, currentCategory);
        
    } catch (error) {
        console.error('Error loading API data:', error);
        renderAPIData([]);
        showToast('Using demo configuration', 'info');
    }
}

function renderCategoryTabs() {
    const categoryTabs = document.getElementById('categoryTabs');
    if (!categoryTabs) return;
    
    // Clear existing tabs
    categoryTabs.innerHTML = '';
    
    // Add "All" tab first
    const allCategoriesCount = originalCategories.reduce((total, cat) => 
        total + (cat.items ? cat.items.length : 0), 0);
    
    let tabsHtml = `
        <button onclick="filterByCategory('all')" 
                class="category-tab ${currentCategory === 'all' ? 'active' : ''} glass px-5 py-3 rounded-xl flex items-center gap-2 text-sm md:text-base">
            <i class="fas fa-grid text-slate-300"></i>
            <span>All</span>
            <span class="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full">${allCategoriesCount}</span>
        </button>
    `;
    
    // Add category tabs
    originalCategories.forEach((category, index) => {
        if (!category || !category.name) return;
        
        const icon = categoryIcons[category.name] || 'folder';
        const itemCount = category.items ? category.items.length : 0;
        const categorySlug = category.name.toLowerCase().replace(/\s+/g, '-');
        
        tabsHtml += `
            <button onclick="filterByCategory('${categorySlug}', ${index})" 
                    class="category-tab ${currentCategory === categorySlug ? 'active' : ''} glass px-5 py-3 rounded-xl flex items-center gap-2 text-sm md:text-base">
                <i class="fas fa-${icon} text-slate-300"></i>
                <span>${category.name}</span>
                <span class="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">${itemCount}</span>
            </button>
        `;
    });
    
    categoryTabs.innerHTML = tabsHtml;
    
    // Update category count
    const categoryCount = document.getElementById('categoryCount');
    if (categoryCount) {
        categoryCount.textContent = `${originalCategories.length} categories`;
    }
}

function filterByCategory(categorySlug, index = null) {
    currentCategory = categorySlug;
    
    // Update active tab
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    const activeTab = document.querySelector(`.category-tab[onclick*="${categorySlug}"]`);
    if (activeTab) activeTab.classList.add('active');
    
    // Filter and render API data
    let filteredData = [];
    
    if (categorySlug === 'all') {
        filteredData = originalCategories;
    } else if (index !== null && originalCategories[index]) {
        filteredData = [originalCategories[index]];
    } else {
        // Find category by slug
        originalCategories.forEach(category => {
            const slug = category.name.toLowerCase().replace(/\s+/g, '-');
            if (slug === categorySlug) {
                filteredData = [category];
            }
        });
    }
    
    renderAPIData(filteredData, categorySlug);
    
    // Show/hide empty category message
    const emptyCategory = document.getElementById('emptyCategory');
    if (emptyCategory) {
        const hasItems = filteredData.some(category => 
            category.items && category.items.length > 0
        );
        emptyCategory.classList.toggle('hidden', hasItems);
    }
}

function renderAPIData(categories, currentCategory = 'all') {
    const apiList = document.getElementById('apiList');
    const noResults = document.getElementById('noResults');
    const emptyCategory = document.getElementById('emptyCategory');
    
    if (!apiList) {
        console.error('apiList element not found!');
        return;
    }
    
    // Clear existing content
    apiList.innerHTML = '';
    
    if (!categories || categories.length === 0) {
        apiList.innerHTML = `
            <div class="col-span-full text-center py-16">
                <i class="fas fa-api text-4xl text-slate-500 mb-4"></i>
                <h3 class="text-xl text-white mb-2">No API data available</h3>
                <p class="text-slate-400">Add API endpoints to get started</p>
            </div>
        `;
        return;
    }
    
    // Check if any category has items
    let hasItems = false;
    let allItems = [];
    
    categories.forEach(category => {
        if (category && category.items && category.items.length > 0) {
            hasItems = true;
            allItems = [...allItems, ...category.items.map(item => ({
                ...item,
                categoryName: category.name
            }))];
        }
    });
    
    if (!hasItems) {
        if (noResults) noResults.classList.add('hidden');
        if (emptyCategory) emptyCategory.classList.remove('hidden');
        return;
    }
    
    // Hide empty category message
    if (emptyCategory) emptyCategory.classList.add('hidden');
    
    // Render all items as cards
    let html = '';
    
    allItems.forEach((item, index) => {
        if (!item) return;
        
        const method = item.method || 'GET';
        const pathParts = (item.path || '').split('?');
        const path = pathParts[0] || '';
        const itemName = item.name || 'Unnamed Endpoint';
        const itemDesc = item.desc || 'No description';
        const categoryName = item.categoryName || 'Uncategorized';
        const status = item.status || 'ready';
        
        const statusClass = `status-${status}`;
        const methodClass = `method-${method.toLowerCase()}`;
        
        // Generate unique ID for this endpoint
        const endpointId = `endpoint-${Date.now()}-${index}`;
        
        html += `
            <div class="api-card glass rounded-2xl overflow-hidden" 
                 data-method="${method.toLowerCase()}"
                 data-path="${path}"
                 data-alias="${itemName}"
                 data-description="${itemDesc}"
                 data-category="${categoryName.toLowerCase().replace(/\s+/g, '-')}">
                
                <!-- Card Header -->
                <div class="p-5 border-b border-slate-800">
                    <div class="flex items-start justify-between mb-3">
                        <div class="flex items-center gap-3">
                            <span class="inline-flex items-center justify-center w-10 h-10 rounded-lg ${methodClass}">
                                <i class="fas fa-${method === 'GET' ? 'download' : method === 'POST' ? 'upload' : 'exchange-alt'} text-xs"></i>
                            </span>
                            <div>
                                <h3 class="font-bold text-white truncate max-w-[200px]" title="${itemName}">${itemName}</h3>
                                <div class="flex items-center gap-2 mt-1">
                                    <span class="text-xs text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">${categoryName}</span>
                                    <span class="text-xs px-2 py-0.5 rounded-full ${statusClass}">${status}</span>
                                </div>
                            </div>
                        </div>
                        <button onclick="toggleEndpoint('${endpointId}')" 
                                class="text-slate-400 hover:text-white transition-colors">
                            <i class="fas fa-chevron-down" id="icon-${endpointId}"></i>
                        </button>
                    </div>
                    
                    <div class="mt-3">
                        <code class="text-sm text-slate-300 bg-slate-900/50 px-3 py-2 rounded-lg block truncate" title="${path}">${path}</code>
                    </div>
                </div>
                
                <!-- Card Content (Collapsible) -->
                <div id="${endpointId}" class="hidden expand-transition">
                    <div class="p-5 space-y-4">
                        <div>
                            <p class="text-slate-400 text-sm">${itemDesc}</p>
                        </div>
                        
                        <form id="form-${endpointId}">
                            <div class="space-y-3" id="params-container-${endpointId}">
                                <!-- Parameters will be inserted here -->
                            </div>
                            
                            <div class="mt-6">
                                <div class="flex items-center gap-2 mb-2">
                                    <i class="fas fa-link text-sm text-slate-400"></i>
                                    <span class="text-sm font-medium text-slate-300">Request URL</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <div class="flex-1 min-w-0 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 overflow-x-auto">
                                        <code class="text-sm text-slate-300 whitespace-nowrap" id="url-display-${endpointId}">
                                            ${window.location.origin}${item.path || ''}
                                        </code>
                                    </div>
                                    <button type="button" onclick="copyUrl('${endpointId}')" 
                                            class="copy-btn bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-3 rounded-xl transition-colors">
                                        <i class="fas fa-copy"></i>
                                    </button>
                                </div>
                            </div>
                            
                            <div class="flex gap-3 mt-6">
                                <button type="button" onclick="executeRequest(event, '${endpointId}', '${method}', '${path}')" 
                                        class="btn-gradient text-white px-6 py-3 text-sm font-medium rounded-xl flex items-center gap-2 flex-1 justify-center">
                                    <i class="fas fa-play"></i>
                                    Execute
                                </button>
                                <button type="button" onclick="clearResponse('${endpointId}')" 
                                        class="bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-3 text-sm font-medium rounded-xl flex items-center gap-2">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </form>
                    </div>
                    
                    <!-- Response Section -->
                    <div id="response-${endpointId}" class="hidden border-t border-slate-800">
                        <div class="p-5">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-code text-sm text-slate-400"></i>
                                <span class="text-sm font-medium text-slate-300">Response</span>
                            </div>
                            <div class="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                                <div class="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                                    <div class="flex items-center gap-3">
                                        <span id="response-status-${endpointId}" class="text-xs px-3 py-1 rounded-full bg-green-500/20 text-green-400">
                                            200 OK
                                        </span>
                                        <span id="response-time-${endpointId}" class="text-xs text-slate-400">0ms</span>
                                    </div>
                                    <button onclick="copyResponse('${endpointId}')" 
                                            class="text-slate-400 hover:text-white text-sm">
                                        <i class="fas fa-copy"></i>
                                    </button>
                                </div>
                                <div class="p-4 max-h-80 overflow-auto">
                                    <div class="response-media-container" id="response-content-${endpointId}"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    apiList.innerHTML = html;
    
    // Initialize parameters for each endpoint
    setTimeout(() => {
        allItems.forEach((item, index) => {
            const endpointId = `endpoint-${Date.now()}-${index}`;
            initializeEndpointParameters(endpointId, item);
        });
    }, 100);
}

function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            handleSearch(this.value);
        });
        
        // Add clear button functionality
        const clearSearch = () => {
            searchInput.value = '';
            handleSearch('');
            searchInput.focus();
        };
        
        // You could add a clear button to the UI and attach this function
    }
    
    // Add scroll to top functionality
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        // You could add a scroll-to-top button here
    });
}

function handleSearch(searchTerm) {
    const searchTermLower = (searchTerm || '').toLowerCase().trim();
    const noResults = document.getElementById('noResults');
    
    if (!searchTermLower) {
        // Return to current category view
        filterByCategory(currentCategory);
        if (noResults) noResults.classList.add('hidden');
        return;
    }
    
    console.log('Searching for:', searchTermLower);
    
    // Filter items across all categories
    const allItems = [];
    originalCategories.forEach(category => {
        if (!category || !category.items) return;
        
        category.items.forEach(item => {
            if (!item) return;
            
            const matches = 
                (item.name || '').toLowerCase().includes(searchTermLower) ||
                (item.desc || '').toLowerCase().includes(searchTermLower) ||
                (item.path || '').toLowerCase().includes(searchTermLower) ||
                (item.method || '').toLowerCase().includes(searchTermLower) ||
                (category.name || '').toLowerCase().includes(searchTermLower);
            
            if (matches) {
                allItems.push({
                    ...item,
                    categoryName: category.name
                });
            }
        });
    });
    
    const apiList = document.getElementById('apiList');
    if (!apiList) return;
    
    if (allItems.length === 0) {
        apiList.innerHTML = '';
        if (noResults) noResults.classList.remove('hidden');
    } else {
        // Create a fake category for search results
        const searchResultsCategory = {
            name: 'Search Results',
            items: allItems
        };
        renderAPIData([searchResultsCategory], 'search');
        if (noResults) noResults.classList.add('hidden');
    }
}

function toggleEndpoint(endpointId) {
    const endpoint = document.getElementById(endpointId);
    const icon = document.getElementById(`icon-${endpointId}`);
    
    if (!endpoint || !icon) return;
    
    if (endpoint.classList.contains('hidden')) {
        endpoint.classList.remove('hidden');
        icon.classList.remove('fa-chevron-down');
        icon.classList.add('fa-chevron-up');
    } else {
        endpoint.classList.add('hidden');
        icon.classList.remove('fa-chevron-up');
        icon.classList.add('fa-chevron-down');
    }
}

function initializeEndpointParameters(endpointId, item) {
    const paramsContainer = document.getElementById(`params-container-${endpointId}`);
    if (!paramsContainer) return;
    
    const params = extractParameters(item.path);
    
    if (params.length === 0) {
        paramsContainer.innerHTML = `
            <div class="text-center py-3 rounded-xl bg-slate-900/30">
                <i class="fas fa-check text-green-400 text-sm mb-2"></i>
                <p class="text-xs text-slate-400">No parameters required</p>
            </div>
        `;
        return;
    }
    
    let paramsHtml = '';
    params.forEach(param => {
        const isRequired = param.required;
        paramsHtml += `
            <div class="space-y-1">
                <div class="flex items-center justify-between">
                    <label class="block text-sm font-medium text-slate-300">
                        ${param.name} ${isRequired ? '<span class="text-red-400">*</span>' : ''}
                    </label>
                    <span class="text-xs text-slate-500">${param.type}</span>
                </div>
                <input 
                    type="text" 
                    name="${param.name}" 
                    class="w-full px-4 py-3 border border-slate-800 text-sm focus:outline-none focus:border-cyan-500 bg-slate-900 rounded-xl placeholder:text-slate-500"
                    placeholder="Enter ${param.name}..."
                    ${isRequired ? 'required' : ''}
                    oninput="updateRequestUrl('${endpointId}')"
                    id="param-${endpointId}-${param.name}"
                >
                <p class="text-xs text-slate-500">${param.description}</p>
            </div>
        `;
    });
    
    paramsContainer.innerHTML = paramsHtml;
    
    // Initial URL update
    setTimeout(() => {
        updateRequestUrl(endpointId);
    }, 50);
}

function extractParameters(path) {
    const params = [];
    if (!path) return params;
    
    const queryString = path.split('?')[1];
    
    if (!queryString) return params;
    
    try {
        const urlParams = new URLSearchParams(queryString);
        
        for (const [key, value] of urlParams) {
            if (value === '' || value === 'YOUR_API_KEY') {
                params.push({
                    name: key,
                    required: true,
                    type: getParamType(key),
                    description: getParamDescription(key)
                });
            }
        }
    } catch (error) {
        console.error('Error parsing query string:', error);
    }
    
    return params;
}

function getParamType(paramName) {
    const types = {
        'apikey': 'string',
        'url': 'string',
        'question': 'string',
        'query': 'string',
        'prompt': 'string',
        'format': 'string',
        'quality': 'string',
        'size': 'string',
        'limit': 'number',
        'count': 'number',
        'page': 'number',
        'offset': 'number'
    };
    return types[paramName] || 'string';
}

function getParamDescription(paramName) {
    const descriptions = {
        'apikey': 'Your API key for authentication',
        'url': 'URL of the content to download/process',
        'question': 'Question or message to ask the AI',
        'query': 'Search query or keywords',
        'prompt': 'Text description for image generation',
        'format': 'Output format (mp4, mp3, jpg, png, json)',
        'quality': 'Video quality (360p, 720p, 1080p, 4k)',
        'size': 'Image dimensions (512x512, 1024x1024, 2048x2048)',
        'limit': 'Number of results to return',
        'count': 'Number of items to retrieve',
        'page': 'Page number for pagination',
        'offset': 'Starting position for results'
    };
    return descriptions[paramName] || `Parameter: ${paramName}`;
}

function updateRequestUrl(endpointId) {
    const form = document.getElementById(`form-${endpointId}`);
    if (!form) return { url: '', hasErrors: false };

    const urlDisplay = document.getElementById(`url-display-${endpointId}`);
    if (!urlDisplay) return { url: '', hasErrors: false };

    let hasErrors = false;
    
    // Store base URL if not already stored
    if (!urlDisplay.dataset.baseUrl) {
        const full = urlDisplay.textContent.trim();
        const [base, query] = full.split('?');
        urlDisplay.dataset.baseUrl = base;
        urlDisplay.dataset.defaultQuery = query || '';
    }
    
    const baseUrl = urlDisplay.dataset.baseUrl;
    const params = new URLSearchParams(urlDisplay.dataset.defaultQuery);

    // Update parameters from form inputs
    const inputs = form.querySelectorAll('input[type="text"]');
    inputs.forEach(input => {
        const name = input.name;
        const value = input.value.trim();

        // Remove previous error styling
        input.classList.remove('border-red-500', 'ring-1', 'ring-red-500');

        // Validate required fields
        if (input.required && !value) {
            hasErrors = true;
            input.classList.add('border-red-500', 'ring-1', 'ring-red-500');
        }
        
        params.set(name, value);
    });

    // Build final URL
    const queryString = params.toString();
    const finalUrl = queryString ? `${baseUrl}?${queryString}` : baseUrl;
    
    urlDisplay.textContent = finalUrl;
    
    // Highlight the updated part (optional)
    urlDisplay.classList.add('text-cyan-300');
    setTimeout(() => urlDisplay.classList.remove('text-cyan-300'), 300);

    return { url: finalUrl, hasErrors };
}

async function executeRequest(event, endpointId, method, path) {
    event.preventDefault();
    
    const { url, hasErrors } = updateRequestUrl(endpointId);
    
    if (hasErrors) {
        showToast('Please fill in all required parameters', 'error');
        
        // Focus on first error
        const form = document.getElementById(`form-${endpointId}`);
        if (form) {
            const firstError = form.querySelector('.border-red-500');
            if (firstError) firstError.focus();
        }
        
        return;
    }
    
    const responseDiv = document.getElementById(`response-${endpointId}`);
    const responseContent = document.getElementById(`response-content-${endpointId}`);
    const responseStatus = document.getElementById(`response-status-${endpointId}`);
    const responseTime = document.getElementById(`response-time-${endpointId}`);
    
    if (!responseDiv || !responseContent || !responseStatus || !responseTime) {
        showToast('Error: Response elements not found', 'error');
        return;
    }
    
    // Show response section
    responseDiv.classList.remove('hidden');
    
    // Show loading state
    responseContent.innerHTML = `
        <div class="flex flex-col items-center justify-center py-12">
            <div class="loader mb-4"></div>
            <p class="text-sm text-slate-400">Sending request to the cosmos...</p>
        </div>
    `;
    
    responseStatus.textContent = 'Loading...';
    responseStatus.className = 'text-xs px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400';
    responseTime.textContent = '';
    
    const startTime = Date.now();
    
    try {
        console.log('Request URL:', url);
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Accept': '*/*',
                'User-Agent': 'Kynas-API-Docs-Cosmic',
                'Content-Type': 'application/json'
            }
        });
        
        const responseTimeMs = Date.now() - startTime;
        
        // Update response info
        responseTime.textContent = `${responseTimeMs}ms`;
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        // Get content type
        const contentType = response.headers.get('content-type') || '';
        
        // Update status badge
        responseStatus.textContent = `${response.status} OK`;
        responseStatus.className = 'text-xs px-3 py-1 rounded-full bg-green-500/20 text-green-400';
        
        // Handle different content types
        if (contentType.startsWith('image/')) {
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            
            responseContent.innerHTML = `
                <div class="flex items-center justify-center p-4">
                    <img src="${blobUrl}" 
                         alt="Image Response" 
                         class="max-w-full max-h-72 object-contain rounded-xl shadow-lg">
                </div>
            `;
            
        } else if (contentType.includes('audio/')) {
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            
            responseContent.innerHTML = `
                <div class="flex flex-col items-center justify-center p-6">
                    <audio controls autoplay class="w-full max-w-md">
                        <source src="${blobUrl}" type="${contentType}">
                    </audio>
                    <p class="text-xs text-slate-400 mt-3">Audio response</p>
                </div>
            `;
            
        } else if (contentType.includes('video/')) {
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            
            responseContent.innerHTML = `
                <video controls autoplay class="w-full h-full max-h-72 object-contain rounded-xl">
                    <source src="${blobUrl}" type="${contentType}">
                </video>
            `;
            
        } else if (contentType.includes('application/json')) {
            const data = await response.json();
            
            if (data && typeof data === 'object' && data.error) {
                throw new Error(`API Error: ${data.error}`);
            }
            
            const formattedResponse = JSON.stringify(data, null, 2);
            const highlightedJson = Prism ? Prism.highlight(formattedResponse, Prism.languages.json, 'json') : formattedResponse;
            
            responseContent.innerHTML = `
                <pre class="text-sm font-mono text-slate-300 bg-slate-900 p-4 rounded-xl overflow-x-auto">
${formattedResponse}
                </pre>
            `;
            
        } else if (contentType.includes('text/')) {
            const text = await response.text();
            
            responseContent.innerHTML = `
                <pre class="text-sm font-mono text-slate-300 bg-slate-900 p-4 rounded-xl overflow-x-auto whitespace-pre-wrap">
${escapeHtml(text)}
                </pre>
            `;
            
        } else {
            const text = await response.text();
            
            responseContent.innerHTML = `
                <div class="text-center p-6">
                    <i class="fas fa-file-alt text-3xl text-slate-400 mb-3"></i>
                    <p class="text-sm text-slate-400">Raw response</p>
                    <pre class="text-xs font-mono text-slate-300 bg-slate-900 p-3 mt-2 rounded-xl overflow-x-auto">
${escapeHtml(text.substring(0, 1000))}${text.length > 1000 ? '...' : ''}
                    </pre>
                </div>
            `;
        }
        
        showToast('Request successful!', 'success');
        
    } catch (error) {
        console.error('API Request Error:', error);
        
        const errorMessage = error.message || 'Unknown error occurred';
        responseContent.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-exclamation-triangle text-3xl text-red-400 mb-3"></i>
                <div class="text-base font-medium text-red-400 mb-1">Error</div>
                <div class="text-sm text-slate-400">${escapeHtml(errorMessage)}</div>
            </div>
        `;
        
        responseStatus.textContent = 'Error';
        responseStatus.className = 'text-xs px-3 py-1 rounded-full bg-red-500/20 text-red-400';
        
        showToast(`Request failed: ${errorMessage}`, 'error');
    }
}

function clearResponse(endpointId) {
    const form = document.getElementById(`form-${endpointId}`);
    const responseDiv = document.getElementById(`response-${endpointId}`);
    
    if (!form || !responseDiv) return;
    
    // Clear inputs
    const inputs = form.querySelectorAll('input[type="text"]');
    inputs.forEach(input => {
        input.value = '';
        input.classList.remove('border-red-500', 'ring-1', 'ring-red-500');
    });
    
    // Hide response
    responseDiv.classList.add('hidden');
    
    // Update URL
    updateRequestUrl(endpointId);
    
    showToast('Form cleared', 'info');
}

function copyUrl(endpointId) {
    const urlDisplay = document.getElementById(`url-display-${endpointId}`);
    if (!urlDisplay) return;
    
    const url = urlDisplay.textContent.trim();
    
    navigator.clipboard.writeText(url).then(() => {
        showToast('URL copied to clipboard!', 'success');
        
        // Visual feedback
        const btn = event.target.closest('button');
        if (btn) {
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i>';
            btn.classList.add('bg-green-500/20', 'text-green-400');
            
            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.classList.remove('bg-green-500/20', 'text-green-400');
            }, 2000);
        }
    }).catch(err => {
        console.error('Failed to copy URL:', err);
        showToast('Failed to copy URL', 'error');
    });
}

function copyResponse(endpointId) {
    const responseContent = document.getElementById(`response-content-${endpointId}`);
    if (!responseContent) return;
    
    let text = '';
    
    // Extract text based on content type
    const img = responseContent.querySelector('img');
    const audio = responseContent.querySelector('audio');
    const video = responseContent.querySelector('video');
    const pre = responseContent.querySelector('pre');
    
    if (pre) {
        text = pre.textContent || pre.innerText;
    } else if (img) {
        text = 'Image response (cannot copy)';
    } else if (audio || video) {
        text = 'Media response (cannot copy)';
    } else {
        text = responseContent.textContent || responseContent.innerText;
    }
    
    if (text.includes('cannot copy')) {
        showToast(text, 'info');
        return;
    }
    
    navigator.clipboard.writeText(text).then(() => {
        showToast('Response copied to clipboard!', 'success');
    }).catch(err => {
        console.error('Failed to copy response:', err);
        showToast('Failed to copy response', 'error');
    });
}

function showToast(message, type = 'info') {
    // Remove existing toast
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    
    // Create new toast
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    // Set icon and color
    const icons = {
        'success': { icon: 'fa-check-circle', color: '#10b981' },
        'error': { icon: 'fa-exclamation-circle', color: '#ef4444' },
        'info': { icon: 'fa-info-circle', color: '#3b82f6' },
        'warning': { icon: 'fa-exclamation-triangle', color: '#f59e0b' }
    };
    
    const config = icons[type] || icons.info;
    
    toast.innerHTML = `
        <div class="flex items-center gap-3">
            <i class="fas ${config.icon} text-lg" style="color: ${config.color}"></i>
            <span class="text-sm">${message}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showErrorMessage(err = undefined) {
    const loadingScreen = document.getElementById('loadingScreen');
    if (!loadingScreen) return;
    
    loadingScreen.innerHTML = `
        <div class="text-center">
            <i class="fas fa-satellite-dish text-4xl text-slate-400 mb-4"></i>
            <h3 class="text-lg text-white mb-2">Connection Issue</h3>
            <p class="text-sm text-slate-400">${err ? err : "Using demo configuration"}</p>
            <button onclick="location.reload()" class="mt-4 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl text-sm">
                <i class="fas fa-redo mr-2"></i> Retry Connection
            </button>
        </div>
    `;
    
    // Reset settings
    settings = getDefaultSettings();
    setupUI();
    
    // Load empty data
    originalCategories = [];
    renderCategoryTabs();
    renderAPIData([]);
    
    updateActiveUsers();
}

// Global functions for HTML onclick attributes
window.filterByCategory = filterByCategory;
window.toggleEndpoint = toggleEndpoint;
window.executeRequest = executeRequest;
window.clearResponse = clearResponse;
window.copyUrl = copyUrl;
window.copyResponse = copyResponse;
window.updateRequestUrl = updateRequestUrl;