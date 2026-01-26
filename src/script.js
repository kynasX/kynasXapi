let allEndpoints = [];

async function init() {
    try {
        const response = await fetch('/settings');
        const data = await response.json();
        
        // Update Metadata
        document.getElementById('titleApi').innerText = data.name || "Kynas API";
        document.getElementById('descApi').innerText = data.description || "Welcome to Kynas API documentation.";
        document.getElementById('contactCustomerBtn').href = data.linkWhatsapp || "#";

        const categoryTabs = document.getElementById('categoryTabs');
        categoryTabs.innerHTML = ''; 
        
        // Tab All
        categoryTabs.appendChild(createCategoryBtn("All", true));

        allEndpoints = [];
        data.categories.forEach(cat => {
            // Membuat tombol kategori secara dinamis dari file apapun
            categoryTabs.appendChild(createCategoryBtn(cat.name, false));
            
            cat.items.forEach(item => {
                allEndpoints.push({ ...item, categoryName: cat.name });
            });
        });

        document.getElementById('endpointCount').innerText = allEndpoints.length;
        document.getElementById('categoryCount').innerText = `${data.categories.length} categories`;

        renderEndpoints(allEndpoints);
        document.getElementById('loadingScreen').style.display = 'none';

    } catch (error) {
        console.error("Error:", error);
    }
}

function createCategoryBtn(name, isActive) {
    const btn = document.createElement('button');
    btn.className = `category-tab px-6 py-2 rounded-xl glass text-sm font-medium whitespace-nowrap transition-all ${isActive ? 'active text-cyan-400' : 'text-slate-400'}`;
    btn.innerText = name;
    btn.onclick = (e) => {
        document.querySelectorAll('.category-tab').forEach(t => {
            t.classList.remove('active', 'text-cyan-400');
            t.classList.add('text-slate-400');
        });
        e.currentTarget.classList.add('active', 'text-cyan-400');
        const filtered = name === "All" ? allEndpoints : allEndpoints.filter(i => i.categoryName === name);
        renderEndpoints(filtered);
    };
    return btn;
}

function renderEndpoints(items) {
    const container = document.getElementById('apiList');
    container.innerHTML = '';

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = "api-card glass p-6 rounded-2xl flex flex-col justify-between";
        
        // Logika Input Parameter Otomatis
        let inputFields = '';
        if (item.innerDesc) {
            const params = item.innerDesc.split(',').map(p => p.trim());
            params.forEach(param => {
                inputFields += `
                    <div class="mb-3">
                        <label class="text-[10px] text-slate-500 uppercase font-bold ml-1">${param}</label>
                        <input type="text" placeholder="Enter ${param}..." data-param="${param}"
                               class="endpoint-input w-full bg-slate-900/50 border border-white/5 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50 mt-1 transition-all">
                    </div>
                `;
            });
        }

        card.innerHTML = `
            <div>
                <div class="flex justify-between items-start mb-4">
                    <span class="px-2 py-1 text-[10px] bg-cyan-500/10 text-cyan-400 rounded-md font-bold uppercase tracking-wider border border-cyan-500/20">${item.categoryName}</span>
                    <button onclick="copyUrl('${item.path}')" class="text-slate-500 hover:text-white"><i class="far fa-copy"></i></button>
                </div>
                <h3 class="text-white font-bold text-lg mb-2">${item.name}</h3>
                <p class="text-slate-400 text-sm mb-6">${item.desc || '-'}</p>
                <div class="space-y-1 mb-6">${inputFields}</div>
            </div>
            <button onclick="executeApi(this, '${item.path}')" class="btn-gradient w-full py-3 rounded-xl text-white font-bold text-sm shadow-lg">
                TEST ENDPOINT
            </button>
        `;
        container.appendChild(card);
    });
}

function executeApi(btn, basePath) {
    const card = btn.closest('.api-card');
    const inputs = card.querySelectorAll('.endpoint-input');
    let url = new URL(window.location.origin + basePath);
    inputs.forEach(input => {
        const key = input.getAttribute('data-param');
        const val = input.value.trim();
        if (val) url.searchParams.append(key, val);
    });
    window.open(url.toString(), '_blank');
}

function copyUrl(path) {
    navigator.clipboard.writeText(window.location.origin + path);
    alert('URL Copied!');
}

document.getElementById('searchInput').addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = allEndpoints.filter(item => item.name.toLowerCase().includes(query));
    renderEndpoints(filtered);
});

window.onload = init;