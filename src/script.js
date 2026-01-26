let settings = {};
let allApiItems = [];
let currentCategory = 'all';
let originalCategories = [];
let userApiKey = localStorage.getItem('kynas_api_key') || '';

// Data untuk testing (jika tidak ada API key)
const demoData = {
    categories: [
        {
            name: "Downloader",
            items: [
                {
                    name: "Bilibili/Bstation Video Downloader",
                    desc: "Download video from Bilibili/Bstation",
                    path: "/download/bstation?apikey=YOUR_API_KEY&url=YOUR_VIDEO_URL",
                    method: "GET",
                    status: "ready",
                    parameters: [
                        { name: "apikey", type: "string", required: true, description: "Your API key" },
                        { name: "url", type: "string", required: true, description: "Bilibili/Bstation video URL" }
                    ]
                },
                {
                    name: "Facebook Video Downloader",
                    desc: "Download video from Facebook",
                    path: "/download/facebook?apikey=YOUR_API_KEY&url=YOUR_VIDEO_URL",
                    method: "GET",
                    status: "ready",
                    parameters: [
                        { name: "apikey", type: "string", required: true, description: "Your API key" },
                        { name: "url", type: "string", required: true, description: "Facebook video URL" }
                    ]
                }
            ]
        },
        {
            name: "Tools",
            items: [
                {
                    name: "QR Code Generator",
                    desc: "Generate QR code from text",
                    path: "/tools/qr?apikey=YOUR_API_KEY&text=YOUR_TEXT&size=500",
                    method: "GET",
                    status: "ready",
                    parameters: [
                        { name: "apikey", type: "string", required: true, description: "Your API key" },
                        { name: "text", type: "string", required: true, description: "Text to encode in QR" },
                        { name: "size", type: "number", required: false, description: "QR code size (default: 500)" }
                    ]
                }
            ]
        }
    ]
};

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
    
    // Keyboard shortcut untuk search
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
        updateStats();
        
        // Load API Key dari localStorage jika ada
        loadApiKey();
        
    } catch (error) {
        console.error('Error:', error);
        // Jika error, gunakan demo data
        useDemoData();
    } finally {
        // Selalu sembunyikan loading screen
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
        description: "Simple and Easy-to-Use API Documentation for seamless WhatsApp Bot integration.",
        categories: []
    };
}

function setupUI() {
    const titleApi = document.getElementById("titleApi");
    const descApi = document.getElementById("descApi");
    const footer = document.getElementById("footer");
    
    if (titleApi) titleApi.textContent = settings.name || "Kynas API";
    if (descApi) descApi.textContent = settings.description || "Simple and Easy-to-Use API Documentation for seamless WhatsApp Bot integration.";
    if (footer) footer.textContent = `© ${new Date().getFullYear()} ${settings.creator || "Kynas"} • v1.0.0`;
    
    // Setup social links
    const telegramLink = document.getElementById('telegramLink');
    const whatsappLink = document.getElementById('whatsappLink');
    const youtubeLink = document.getElementById('youtubeLink');
    const contactBtn = document.getElementById('contactCustomerBtn');
    
    if (telegramLink && settings.linkTelegram) telegramLink.href = settings.linkTelegram;
    if (whatsappLink && settings.linkWhatsapp) whatsappLink.href = settings.linkWhatsapp;
    if (youtubeLink && settings.linkYoutube) youtubeLink.href = settings.linkYoutube;
    if (contactBtn && settings.linkWhatsapp) contactBtn.href = settings.linkWhatsapp;
    
    // Setup API Key input modal
    setupApiKeyModal();
}

function setupApiKeyModal() {
    // Create modal for API Key input
    const modalHtml = `
        <div id="apiKeyModal" class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 hidden">
            <div class="glass rounded-2xl p-6 max-w-md w-full mx-4">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-bold text-white flex items-center gap-2">
                        <i class="fas fa-key text-cyan-400"></i>
                        Set Your API Key
                    </h3>
                    <button onclick="closeApiKeyModal()" class="text-slate-400 hover:text-white">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <p class="text-slate-400 text-sm mb-4">
                    Enter your API key to access all endpoints. Your key is stored locally in your browser.
                </p>
                <div class="space-y-4">
                    <div>
                        <input type="text" id="apiKeyInput" 
                               class="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
                               placeholder="Enter your API key here..."
                               value="${userApiKey}">
                    </div>
                    <div class="flex gap-3">
                        <button onclick="saveApiKey()" class="btn-gradient text-white px-6 py-3 rounded-xl font-medium flex-1 flex items-center justify-center gap-2">
                            <i class="fas fa-save"></i>
                            Save Key
                        </button>
                        <button onclick="closeApiKeyModal()" class="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-medium">
                            Cancel
                        </button>
                    </div>
                    <div class="text-xs text-slate-500 mt-3">
                        <i class="fas fa-info-circle mr-1"></i>
                        Your API key is stored locally and never sent to our servers.
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to body if not exists
    if (!document.getElementById('apiKeyModal')) {
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }
}

function loadApiKey() {
    const savedKey = localStorage.getItem('kynas_api_key');
    if (savedKey) {
        userApiKey = savedKey;
        updateApiKeyIndicator();
    }
}

function saveApiKey() {
    const apiKeyInput = document.getElementById('apiKeyInput');
    if (apiKeyInput) {
        userApiKey = apiKeyInput.value.trim();
        localStorage.setItem('kynas_api_key', userApiKey);
        updateApiKeyIndicator();
        closeApiKeyModal();
        showToast('API Key saved successfully!', 'success');
        
        // Update all API key inputs
        updateAllApiKeyInputs();
    }
}

function updateApiKeyIndicator() {
    const indicator = document.getElementById('apiKeyIndicator');
    if (!indicator) {
        // Create indicator if not exists
        const header = document.querySelector('header');
        if (header) {
            const indicatorHtml = `
                <div id="apiKeyIndicator" class="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700 cursor-pointer hover:bg-slate-800 transition-colors" onclick="openApiKeyModal()">
                    <i class="fas ${userApiKey ? 'fa-key text-green-400' : 'fa-key text-red-400'}"></i>
                    <span class="text-sm">${userApiKey ? 'API Key ✓' : 'No API Key'}</span>
                </div>
            `;
            header.insertAdjacentHTML('beforeend', indicatorHtml);
        }
    } else {
        // Update existing indicator
        const icon = indicator.querySelector('i');
        const text = indicator.querySelector('span');
        if (icon) icon.className = `fas ${userApiKey ? 'fa-key text-green-400' : 'fa-key text-red-400'}`;
        if (text) text.textContent = userApiKey ? 'API Key ✓' : 'No API Key';
    }
}

function openApiKeyModal() {
    const modal = document.getElementById('apiKeyModal');
    if (modal) {
        modal.classList.remove('hidden');
        const input = document.getElementById('apiKeyInput');
        if (input) {
            input.value = userApiKey;
            input.focus();
        }
    }
}

function closeApiKeyModal() {
    const modal = document.getElementById('apiKeyModal');
    if (modal) modal.classList.add('hidden');
}

function updateAllApiKeyInputs() {
    // Update semua input apikey di semua form
    document.querySelectorAll('input[name="apikey"]').forEach(input => {
        if (userApiKey) {
            input.value = userApiKey;
            input.dispatchEvent(new Event('input', { bubbles: true }));
        }
    });
}

function updateStats() {
    // Update active users
    const activeUsersEl = document.getElementById('activeUsers');
    if (activeUsersEl) {
        const users = Math.floor(Math.random() * 5000) + 1000;
        activeUsersEl.textContent = users.toLocaleString();
    }
    
    // Update endpoint count
    const endpointCountEl = document.getElementById('endpointCount');
    if (endpointCountEl && originalCategories.length > 0) {
        let total = 0;
        originalCategories.forEach(cat => {
            if (cat.items) total += cat.items.length;
        });
        endpointCountEl.textContent = total;
    }
    
    // Update API key indicator
    updateApiKeyIndicator();
}

async function loadAPIData() {
    try {
        if (!settings.categories || settings.categories.length === 0) {
            console.log('No categories in settings, using empty data');
            settings.categories = [];
        }
        
        originalCategories = JSON.parse(JSON.stringify(settings.categories || []));
        
        // Render data
        renderCategoryTabs();
        renderAPIData(originalCategories, currentCategory);
        
    } catch (error) {
        console.error('Error loading API data:', error);
        throw error;
    }
}

function useDemoData() {
    console.log('Using demo data');
    settings = getDefaultSettings();
    settings.categories = demoData.categories;
    originalCategories = JSON.parse(JSON.stringify(demoData.categories));
    
    setupUI();
    renderCategoryTabs();
    renderAPIData(originalCategories, currentCategory);
    updateStats();
    showToast('Using demo configuration. Add your API key to test real endpoints.', 'info');
}

function renderCategoryTabs() {
    const categoryTabs = document.getElementById('categoryTabs');
    if (!categoryTabs) return;
    
    categoryTabs.innerHTML = '';
    
    // Calculate total endpoints for "All" tab
    let totalEndpoints = 0;
    originalCategories.forEach(cat => {
        if (cat.items) totalEndpoints += cat.items.length;
    });
    
    // Add "All" tab
    const allTabHtml = `
        <button onclick="filterByCategory('all')" 
                class="category-tab ${currentCategory === 'all' ? 'active' : ''} glass px-5 py-3 rounded-xl flex items-center gap-2 text-sm md:text-base transition-all">
            <i class="fas fa-grid text-slate-300"></i>
            <span>All</span>
            <span class="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full">${totalEndpoints}</span>
        </button>
    `;
    
    categoryTabs.innerHTML = allTabHtml;
    
    // Add category tabs
    originalCategories.forEach((category, index) => {
        if (!category || !category.name) return;
        
        const icon = categoryIcons[category.name] || 'folder';
        const itemCount = category.items ? category.items.length : 0;
        const categorySlug = category.name.toLowerCase().replace(/\s+/g, '-');
        
        const tabHtml = `
            <button onclick="filterByCategory('${categorySlug}', ${index})" 
                    class="category-tab ${currentCategory === categorySlug ? 'active' : ''} glass px-5 py-3 rounded-xl flex items-center gap-2 text-sm md:text-base transition-all">
                <i class="fas fa-${icon} text-slate-300"></i>
                <span>${category.name}</span>
                <span class="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">${itemCount}</span>
            </button>
        `;
        
        categoryTabs.insertAdjacentHTML('beforeend', tabHtml);
    });
    
    // Update category count
    const categoryCount = document.getElementById('categoryCount');
    if (categoryCount) {
        categoryCount.textContent = `${originalCategories.length} categories`;
    }
}

function filterByCategory(categorySlug, index = null) {
    currentCategory = categorySlug;
    
    // Update active tab styling
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    const activeTab = document.querySelector(`.category-tab[onclick*="${categorySlug}"]`);
    if (activeTab) activeTab.classList.add('active');
    
    // Filter data
    let filteredData = [];
    
    if (categorySlug === 'all') {
        filteredData = originalCategories;
    } else if (index !== null && originalCategories[index]) {
        filteredData = [originalCategories[index]];
    } else {
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
    
    if (!apiList) return;
    
    apiList.innerHTML = '';
    
    if (!categories || categories.length === 0) {
        apiList.innerHTML = `
            <div class="col-span-full text-center py-16">
                <i class="fas fa-api text-4xl text-slate-500 mb-4"></i>
                <h3 class="text-xl text-white mb-2">No API data available</h3>
                <p class="text-slate-400">Please check your connection or add API endpoints</p>
            </div>
        `;
        return;
    }
    
    // Collect all items
    let allItems = [];
    categories.forEach(category => {
        if (category && category.items) {
            category.items.forEach(item => {
                allItems.push({
                    ...item,
                    categoryName: category.name
                });
            });
        }
    });
    
    if (allItems.length === 0) {
        if (noResults) noResults.classList.add('hidden');
        if (emptyCategory) emptyCategory.classList.remove('hidden');
        return;
    }
    
    // Hide empty category message
    if (emptyCategory) emptyCategory.classList.add('hidden');
    
    // Render each item as a card
    allItems.forEach((item, index) => {
        const method = item.method || 'GET';
        const path = item.path || '';
        const itemName = item.name || 'Unnamed Endpoint';
        const itemDesc = item.desc || 'No description';
        const categoryName = item.categoryName || 'Uncategorized';
        const status = item.status || 'ready';
        
        // Extract base path without query
        const basePath = path.split('?')[0] || path;
        
        // Generate unique ID
        const endpointId = `endpoint-${Date.now()}-${index}`;
        
        // Determine method color
        const methodColor = {
            'GET': 'bg-green-500',
            'POST': 'bg-blue-500',
            'PUT': 'bg-yellow-500',
            'DELETE': 'bg-red-500'
        }[method] || 'bg-gray-500';
        
        const cardHtml = `
            <div class="api-card glass rounded-2xl overflow-hidden transition-all duration-300 hover:transform hover:-translate-y-1">
                <!-- Card Header -->
                <div class="p-6 border-b border-slate-800">
                    <div class="flex items-start justify-between mb-4">
                        <div class="flex items-center gap-3">
                            <span class="inline-flex items-center justify-center w-10 h-10 rounded-lg ${methodColor}">
                                <i class="fas fa-${method === 'GET' ? 'download' : method === 'POST' ? 'upload' : 'exchange-alt'} text-xs text-white"></i>
                            </span>
                            <div>
                                <h3 class="font-bold text-white truncate max-w-[200px]" title="${itemName}">${itemName}</h3>
                                <div class="flex items-center gap-2 mt-1">
                                    <span class="text-xs text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">${categoryName}</span>
                                    <span class="text-xs px-2 py-0.5 rounded-full ${status === 'ready' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}">
                                        ${status}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button onclick="toggleEndpoint('${endpointId}')" 
                                class="text-slate-400 hover:text-white transition-colors">
                            <i class="fas fa-chevron-down" id="icon-${endpointId}"></i>
                        </button>
                    </div>
                    
                    <p class="text-slate-400 text-sm mb-3">${itemDesc}</p>
                    
                    <div class="mt-3">
                        <code class="text-sm text-slate-300 bg-slate-900/50 px-3 py-2 rounded-lg block truncate" title="${path}">${method} ${basePath}</code>
                    </div>
                </div>
                
                <!-- Card Content (Collapsible) -->
                <div id="${endpointId}" class="hidden expand-transition">
                    <div class="p-6 space-y-6">
                        <form id="form-${endpointId}">
                            <div class="space-y-4" id="params-container-${endpointId}">
                                <!-- Parameters will be inserted here -->
                            </div>
                            
                            <div class="mt-6">
                                <div class="flex items-center gap-2 mb-2">
                                    <i class="fas fa-link text-sm text-slate-400"></i>
                                    <span class="text-sm font-medium text-slate-300">REQUEST URL</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <div class="flex-1 min-w-0 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 overflow-x-auto">
                                        <code class="text-sm text-slate-300 whitespace-nowrap" id="url-display-${endpointId}">
                                            ${window.location.origin}${path}
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
                                    Clear
                                </button>
                            </div>
                        </form>
                    </div>
                    
                    <!-- Response Section -->
                    <div id="response-${endpointId}" class="hidden border-t border-slate-800">
                        <div class="p-6">
                            <div class="flex items-center gap-2 mb-3">
                                <i class="fas fa-code text-sm text-slate-400"></i>
                                <span class="text-sm font-medium text-slate-300">RESPONSE</span>
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
        
        apiList.insertAdjacentHTML('beforeend', cardHtml);
        
        // Initialize parameters for this endpoint
        setTimeout(() => {
            initializeEndpointParameters(endpointId, item);
        }, 10);
    });
}

function initializeEndpointParameters(endpointId, item) {
    const paramsContainer = document.getElementById(`params-container-${endpointId}`);
    if (!paramsContainer) return;
    
    // Extract parameters from path or use predefined parameters
    let params = item.parameters || extractParameters(item.path);
    
    if (params.length === 0) {
        paramsContainer.innerHTML = `
            <div class="text-center py-4 rounded-xl bg-slate-900/30">
                <i class="fas fa-check text-green-400 text-sm mb-2"></i>
                <p class="text-sm text-slate-400">No parameters required</p>
            </div>
        `;
        return;
    }
    
    let paramsHtml = '';
    
    params.forEach(param => {
        const isRequired = param.required !== false;
        const defaultValue = param.default || '';
        const paramId = `param-${endpointId}-${param.name}`;
        
        // Pre-fill API key if available
        let value = '';
        if (param.name === 'apikey' && userApiKey) {
            value = userApiKey;
        }
        
        paramsHtml += `
            <div class="space-y-2">
                <div class="flex items-center justify-between">
                    <label class="block text-sm font-medium text-slate-300">
                        ${param.name} ${isRequired ? '<span class="text-red-400">*</span>' : ''}
                    </label>
                    <span class="text-xs text-slate-500">${param.type || 'string'}</span>
                </div>
                <input 
                    type="${param.type === 'number' ? 'number' : 'text'}" 
                    name="${param.name}" 
                    id="${paramId}"
                    class="w-full px-4 py-3 border border-slate-700 text-sm focus:outline-none focus:border-cyan-500 bg-slate-800 rounded-xl placeholder:text-slate-500 text-white"
                    placeholder="Enter ${param.description || param.name}${defaultValue ? ` (default: ${defaultValue})` : ''}"
                    value="${value}"
                    ${isRequired ? 'required' : ''}
                    oninput="updateRequestUrl('${endpointId}')"
                />
                ${param.description ? `<p class="text-xs text-slate-500">${param.description}</p>` : ''}
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
            if (value === 'YOUR_API_KEY' || value === '' || value.includes('YOUR_')) {
                params.push({
                    name: key,
                    required: true,
                    type: key.toLowerCase().includes('url') ? 'url' : 'string',
                    description: getParameterDescription(key, value)
                });
            }
        }
    } catch (error) {
        console.error('Error parsing query string:', error);
    }
    
    return params;
}

function getParameterDescription(paramName, paramValue) {
    const descriptions = {
        'apikey': 'Your API key for authentication',
        'url': 'URL of the content to process',
        'text': 'Text content',
        'query': 'Search query',
        'prompt': 'AI prompt',
        'size': 'Size/dimension',
        'format': 'Output format',
        'quality': 'Quality level'
    };
    
    if (paramValue.includes('YOUR_API_KEY')) return 'Your API key for authentication';
    if (paramValue.includes('YOUR_VIDEO_URL')) return 'Video URL to download';
    if (paramValue.includes('YOUR_TEXT')) return 'Text content';
    
    return descriptions[paramName] || `Enter ${paramName}`;
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

function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            handleSearch(this.value);
        });
    }
}

function handleSearch(searchTerm) {
    const searchTermLower = searchTerm.toLowerCase().trim();
    const noResults = document.getElementById('noResults');
    
    if (!searchTermLower) {
        filterByCategory(currentCategory);
        return;
    }
    
    // Search through all items
    let searchResults = [];
    
    originalCategories.forEach(category => {
        if (category.items) {
            category.items.forEach(item => {
                const matches = 
                    (item.name && item.name.toLowerCase().includes(searchTermLower)) ||
                    (item.desc && item.desc.toLowerCase().includes(searchTermLower)) ||
                    (item.path && item.path.toLowerCase().includes(searchTermLower));
                
                if (matches) {
                    searchResults.push({
                        ...item,
                        categoryName: category.name
                    });
                }
            });
        }
    });
    
    const apiList = document.getElementById('apiList');
    if (!apiList) return;
    
    if (searchResults.length === 0) {
        apiList.innerHTML = '';
        if (noResults) noResults.classList.remove('hidden');
    } else {
        // Create a fake category for search results
        const searchCategory = {
            name: 'Search Results',
            items: searchResults.map(item => ({
                ...item,
                categoryName: undefined
            }))
        };
        
        renderAPIData([searchCategory], 'search');
        if (noResults) noResults.classList.add('hidden');
    }
}

function updateRequestUrl(endpointId) {
    const form = document.getElementById(`form-${endpointId}`);
    const urlDisplay = document.getElementById(`url-display-${endpointId}`);
    
    if (!form || !urlDisplay) return { url: '', hasErrors: false };
    
    // Store base URL if not already stored
    if (!urlDisplay.dataset.baseUrl) {
        const full = urlDisplay.textContent.trim();
        const [base, query] = full.split('?');
        urlDisplay.dataset.baseUrl = base;
        urlDisplay.dataset.defaultQuery = query || '';
    }
    
    const baseUrl = urlDisplay.dataset.baseUrl;
    const params = new URLSearchParams(urlDisplay.dataset.defaultQuery);
    
    let hasErrors = false;
    
    // Update parameters from form
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        const name = input.name;
        let value = input.value.trim();
        
        // Remove error styling
        input.classList.remove('border-red-500');
        
        // Validate required fields
        if (input.required && !value) {
            hasErrors = true;
            input.classList.add('border-red-500');
        }
        
        // Only update if value exists
        if (value) {
            params.set(name, value);
        } else if (params.has(name)) {
            params.delete(name);
        }
    });
    
    // Build final URL
    const queryString = params.toString();
    const finalUrl = queryString ? `${baseUrl}?${queryString}` : baseUrl;
    
    urlDisplay.textContent = finalUrl;
    
    // Visual feedback
    urlDisplay.classList.add('text-cyan-300');
    setTimeout(() => urlDisplay.classList.remove('text-cyan-300'), 300);
    
    return { url: finalUrl, hasErrors };
}

async function executeRequest(event, endpointId, method, originalPath) {
    event.preventDefault();
    
    const { url, hasErrors } = updateRequestUrl(endpointId);
    
    if (hasErrors) {
        showToast('Please fill in all required parameters', 'error');
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
            <p class="text-sm text-slate-400">Sending request...</p>
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
                'User-Agent': 'Kynas-API-Docs'
            }
        });
        
        const responseTimeMs = Date.now() - startTime;
        responseTime.textContent = `${responseTimeMs}ms`;
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type') || '';
        
        // Update status
        responseStatus.textContent = `${response.status} OK`;
        responseStatus.className = 'text-xs px-3 py-1 rounded-full bg-green-500/20 text-green-400';
        
        // Handle response based on content type
        if (contentType.includes('image/')) {
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            
            responseContent.innerHTML = `
                <div class="flex items-center justify-center p-4">
                    <img src="${blobUrl}" 
                         alt="Image Response" 
                         class="max-w-full max-h-72 object-contain rounded-xl">
                </div>
            `;
            
        } else if (contentType.includes('application/json')) {
            const data = await response.json();
            const formattedJson = JSON.stringify(data, null, 2);
            
            responseContent.innerHTML = `
                <pre class="text-sm font-mono text-slate-300 bg-slate-900 p-4 rounded-xl overflow-x-auto whitespace-pre-wrap">
${formattedJson}
                </pre>
            `;
            
        } else {
            const text = await response.text();
            
            responseContent.innerHTML = `
                <pre class="text-sm font-mono text-slate-300 bg-slate-900 p-4 rounded-xl overflow-x-auto whitespace-pre-wrap">
${escapeHtml(text)}
                </pre>
            `;
        }
        
        showToast('Request successful!', 'success');
        
    } catch (error) {
        console.error('API Request Error:', error);
        
        responseContent.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-exclamation-triangle text-3xl text-red-400 mb-3"></i>
                <div class="text-base font-medium text-red-400 mb-1">Error</div>
                <div class="text-sm text-slate-400">${escapeHtml(error.message)}</div>
            </div>
        `;
        
        responseStatus.textContent = 'Error';
        responseStatus.className = 'text-xs px-3 py-1 rounded-full bg-red-500/20 text-red-400';
        
        showToast(`Request failed: ${error.message}`, 'error');
    }
}

function clearResponse(endpointId) {
    const form = document.getElementById(`form-${endpointId}`);
    const responseDiv = document.getElementById(`response-${endpointId}`);
    
    if (!form || !responseDiv) return;
    
    // Clear inputs but keep API key if present
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        if (input.name !== 'apikey' || !userApiKey) {
            input.value = '';
        }
        input.classList.remove('border-red-500');
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
    }).catch(err => {
        console.error('Failed to copy URL:', err);
        showToast('Failed to copy URL', 'error');
    });
}

function copyResponse(endpointId) {
    const responseContent = document.getElementById(`response-content-${endpointId}`);
    if (!responseContent) return;
    
    let text = responseContent.textContent || responseContent.innerText;
    
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
    
    // Create toast
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    const icon = type === 'success' ? 'fa-check-circle' :
                 type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    const color = type === 'success' ? '#10b981' :
                  type === 'error' ? '#ef4444' : '#3b82f6';
    
    toast.innerHTML = `
        <i class="fas ${icon} text-lg" style="color: ${color}"></i>
        <span class="text-sm">${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    // Auto remove
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Global functions for HTML onclick
window.filterByCategory = filterByCategory;
window.toggleEndpoint = toggleEndpoint;
window.executeRequest = executeRequest;
window.clearResponse = clearResponse;
window.copyUrl = copyUrl;
window.copyResponse = copyResponse;
window.updateRequestUrl = updateRequestUrl;
window.openApiKeyModal = openApiKeyModal;
window.closeApiKeyModal = closeApiKeyModal;
window.saveApiKey = saveApiKey;