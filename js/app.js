// Main Application Controller
class AlbionProfitMakerApp {
    constructor() {
        this.isInitialized = false;
        this.init();
    }

    async init() {
        try {
            // Show loading screen
            this.showLoadingScreen(true);

            // Initialize components
            await this.initializeApp();

            // Hide loading screen and show app
            this.showLoadingScreen(false);
            this.showApp();

            this.isInitialized = true;
            console.log('Albion Profit Maker initialized successfully!');

        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('Failed to initialize application: ' + error.message);
        }
    }

    async initializeApp() {
        // Check API connectivity
        await this.checkAPIStatus();

        // Load initial data
        await this.loadInitialData();

        // Set up auto-refresh
        this.setupAutoRefresh();

        // Update UI with loaded data
        this.updateUI();
    }

    async checkAPIStatus() {
        try {
            const status = await albionAPI.getServerStatus();
            const statusElement = document.getElementById('apiStatus');
            
            if (status && status.status === 'online') {
                statusElement.innerHTML = '<i class="fas fa-circle"></i> <span>API Connected</span>';
                statusElement.style.color = '#27ae60';
            } else {
                statusElement.innerHTML = '<i class="fas fa-circle"></i> <span>API Limited</span>';
                statusElement.style.color = '#f39c12';
            }
        } catch (error) {
            const statusElement = document.getElementById('apiStatus');
            statusElement.innerHTML = '<i class="fas fa-circle"></i> <span>API Offline</span>';
            statusElement.style.color = '#e74c3c';
            console.warn('API status check failed:', error);
        }
    }

    async loadInitialData() {
        // Load any initial data needed for the app
        // For now, we'll just ensure the item database is available
        await albionAPI.getItemDatabase();
    }

    setupAutoRefresh() {
        const interval = dataManager.data.settings.updateInterval || 5;
        setInterval(() => {
            if (this.isInitialized && !uiManager.isLoading) {
                this.refreshCurrentTab();
            }
        }, interval * 60 * 1000);
    }

    refreshCurrentTab() {
        const currentTab = uiManager.currentTab;
        if (currentTab === 'dashboard') {
            uiManager.loadDashboardData();
        }
        // Add refresh logic for other tabs as needed
    }

    updateUI() {
        // Update any UI elements that need initial data
        const lastUpdate = dataManager.data.lastUpdate;
        if (lastUpdate) {
            const age = this.formatTimeAgo(new Date(lastUpdate));
            document.getElementById('dataAge').textContent = `Data: ${age}`;
        }
    }

    formatTimeAgo(date) {
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
        // You could implement a more sophisticated error display
        alert('Application Error: ' + message);
    }
}

// Additional CSS for dynamic classes
const additionalStyles = `
.liquidity-high { color: #27ae60; font-weight: bold; }
.liquidity-medium { color: #f39c12; font-weight: bold; }
.liquidity-low { color: #e74c3c; font-weight: bold; }

.supply-high { color: #27ae60; font-weight: bold; }
.supply-medium { color: #f39c12; font-weight: bold; }
.supply-low { color: #e74c3c; font-weight: bold; }
.supply-none { color: #95a5a6; font-weight: bold; }

.demand-high { color: #27ae60; font-weight: bold; }
.demand-medium { color: #f39c12; font-weight: bold; }
.demand-low { color: #e74c3c; font-weight: bold; }
.demand-none { color: #95a5a6; font-weight: bold; }

.risk-low { color: #27ae60; font-weight: bold; }
.risk-medium { color: #f39c12; font-weight: bold; }
.risk-high { color: #e74c3c; font-weight: bold; }

.opportunity-item {
    padding: 15px;
    border: 1px solid #e9ecef;
    border-radius: var(--border-radius);
    margin-bottom: 10px;
    transition: var(--transition);
}

.opportunity-item:hover {
    border-color: var(--primary-color);
    background: #f8f9fa;
}

.opp-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 5px;
}

.opp-name {
    font-weight: 600;
    color: var(--secondary-color);
}

.opp-profit {
    font-weight: bold;
    color: var(--success-color);
}

.opp-details {
    font-size: 0.9em;
    color: var(--gray-color);
}

.search-results {
    max-height: 200px;
    overflow-y: auto;
    z-index: 1000;
}

.search-result-item small {
    display: block;
    color: var(--gray-color);
    font-size: 0.8em;
    margin-top: 2px;
}
`;

// Add additional styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.albionApp = new AlbionProfitMakerApp();
});

// Service Worker registration for offline functionality (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}