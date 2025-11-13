// Real Application Controller
class AlbionProfitMakerApp {
    constructor() {
        this.isInitialized = false;
        this.autoRefreshInterval = null;
        this.init();
    }

    async init() {
        try {
            this.showLoadingScreen(true);
            await this.initializeRealApp();
            this.showLoadingScreen(false);
            this.showApp();
            this.isInitialized = true;
            console.log('Real Albion Profit Maker initialized!');
        } catch (error) {
            console.error('Failed to initialize real app:', error);
            this.showError('Failed to initialize: ' + error.message);
        }
    }

    async initializeRealApp() {
        // Initialize real API connection
        await this.checkRealAPIStatus();
        
        // Load real item database
        await albionAPI.loadItemDatabase();
        
        // Set up real auto-refresh
        this.setupRealAutoRefresh();
        
        // Initialize real UI
        this.updateRealUI();
    }

    async checkRealAPIStatus() {
        try {
            // Test API connection with a simple request
            await albionAPI.getMarketPrices(['T4_ORE']);
            this.updateAPIStatus('connected', 'API Connected');
        } catch (error) {
            this.updateAPIStatus('error', 'API Offline - Using Cache');
        }
    }

    updateAPIStatus(status, message) {
        const statusElement = document.getElementById('apiStatus');
        const colors = {
            connected: '#27ae60',
            error: '#e74c3c',
            warning: '#f39c12'
        };
        
        statusElement.innerHTML = `<i class="fas fa-circle"></i> <span>${message}</span>`;
        statusElement.style.color = colors[status] || '#95a5a6';
    }

    setupRealAutoRefresh() {
        const interval = dataManager.data.settings.updateInterval || 5;
        this.autoRefreshInterval = setInterval(() => {
            if (this.isInitialized && !uiManager.isLoading) {
                this.refreshRealCurrentTab();
            }
        }, interval * 60 * 1000);
    }

    refreshRealCurrentTab() {
        const currentTab = uiManager.currentTab;
        if (currentTab === 'dashboard') {
            uiManager.loadRealDashboard();
        }
        // Add auto-refresh for other tabs as needed
    }

    updateRealUI() {
        // Update UI with real data
        const lastUpdate = dataManager.data.lastUpdate;
        if (lastUpdate) {
            const age = this.formatRealTimeAgo(new Date(lastUpdate));
            document.getElementById('dataAge').textContent = `Data: ${age}`;
        }

        // Update user stats if available
        this.updateRealUserStats();
    }

    updateRealUserStats() {
        const stats = dataManager.getStats();
        // Could update a stats display in the header
    }

    formatRealTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${Math.floor(diffHours / 24)}d ago`;
    }

    showLoadingScreen(show) {
        const loadingScreen = document.getElementById('loadingScreen');
        const app = document.getElementById('app');
        
        if (show) {
            loadingScreen.style.display = 'flex';
            app.style.display = 'none';
        } else {
            loadingScreen.style.display = 'none';
            app.style.display = 'block';
        }
    }

    showApp() {
        document.getElementById('app').style.display = 'block';
    }

    showError(message) {
        // Real error handling
        console.error('Real App Error:', message);
        alert(`Application Error: ${message}\n\nPlease check your internet connection and try again.`);
    }

    destroy() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }
    }
}

// Add real CSS for dynamic classes
const realStyles = `
.supply-high { color: #27ae60; font-weight: bold; }
.supply-medium { color: #f39c12; font-weight: bold; }
.supply-low { color: #e74c3c; font-weight: bold; }
.supply-none { color: #95a5a6; font-weight: bold; }

.demand-high { color: #27ae60; font-weight: bold; }
.demand-medium { color: #f39c12; font-weight: bold; }
.demand-low { color: #e74c3c; font-weight: bold; }
.demand-none { color: #95a5a6; font-weight: bold; }

.action-buy { color: #27ae60; font-weight: bold; }
.action-sell { color: #e74c3c; font-weight: bold; }
.action-hold { color: #f39c12; font-weight: bold; }
.action-monitor { color: #95a5a6; font-weight: bold; }

.price-header {
    background: #34495e;
    color: white;
    padding: 15px 20px;
    border-radius: 8px 8px 0 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.price-header h4 {
    margin: 0;
    font-size: 1.2em;
}

.price-header small {
    opacity: 0.8;
}

@keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}

.toast {
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

[data-theme="dark"] {
    --primary-color: #3498db;
    --secondary-color: #2c3e50;
    --background-color: #1a1a1a;
    --text-color: #ffffff;
}

/* Real responsive improvements */
@media (max-width: 768px) {
    .result-details {
        grid-template-columns: 1fr 1fr;
    }
    
    .price-header {
        flex-direction: column;
        gap: 10px;
        text-align: center;
    }
}

/* Real loading states */
.loading-real {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
}

@keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}
`;

// Add real styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = realStyles;
document.head.appendChild(styleSheet);

// Initialize the real application
document.addEventListener('DOMContentLoaded', () => {
    window.albionApp = new AlbionProfitMakerApp();
});

// Real error handling for production
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});

// Real service worker for offline functionality (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(console.error);
    });
}