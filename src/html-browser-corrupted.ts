import { Env, Torrent } from './types';
import { STRMCacheManager } from './strm-cache';

export class HTMLBrowser {
  private env: Env;
  private baseURL: string;

  constructor(env: Env, request: Request) {
    this.env = env;
    this.baseURL = env.BASE_URL || new URL(request.url).origin;
  }

  private getBaseStyles(): string {
    return `
      <script src="https://cdn.tailwindcss.com"></script>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/lucide/0.263.1/umd/lucide.min.css">
      <style>
        /* Custom CSS Variables */
        :root {
          --background: 250 250 250;
          --foreground: 9 9 11;
          --card: 255 255 255;
          --card-foreground: 9 9 11;
          --popover: 255 255 255;
          --popover-foreground: 9 9 11;
          --primary: 9 9 11;
          --primary-foreground: 250 250 250;
          --secondary: 244 244 245;
          --secondary-foreground: 9 9 11;
          --muted: 244 244 245;
          --muted-foreground: 113 113 122;
          --accent: 244 244 245;
          --accent-foreground: 9 9 11;
          --destructive: 239 68 68;
          --destructive-foreground: 250 250 250;
          --border: 228 228 231;
          --input: 228 228 231;
          --ring: 9 9 11;
        }

        @media (prefers-color-scheme: dark) {
          :root {
            --background: 9 9 11;
            --foreground: 250 250 250;
            --card: 9 9 11;
            --card-foreground: 250 250 250;
            --popover: 9 9 11;
            --popover-foreground: 250 250 250;
            --primary: 250 250 250;
            --primary-foreground: 9 9 11;            --secondary: 39 39 42;
            --secondary-foreground: 250 250 250;
            --muted: 39 39 42;
            --muted-foreground: 161 161 170;
            --accent: 39 39 42;
            --accent-foreground: 250 250 250;
            --destructive: 239 68 68;
            --destructive-foreground: 250 250 250;
            --border: 39 39 42;
            --input: 39 39 42;
            --ring: 212 212 216;
          }
        }

        * {
          border-color: rgb(var(--border));
        }

        body {
          background-color: rgb(var(--background));
          color: rgb(var(--foreground));
        }

        /* Component styles */
        .bg-background { background-color: rgb(var(--background)); }
        .text-foreground { color: rgb(var(--foreground)); }
        .bg-card { background-color: rgb(var(--card)); }
        .text-card-foreground { color: rgb(var(--card-foreground)); }
        .bg-primary { background-color: rgb(var(--primary)); }
        .text-primary-foreground { color: rgb(var(--primary-foreground)); }
        .bg-secondary { background-color: rgb(var(--secondary)); }
        .text-secondary-foreground { color: rgb(var(--secondary-foreground)); }
        .bg-muted { background-color: rgb(var(--muted)); }
        .text-muted-foreground { color: rgb(var(--muted-foreground)); }
        .bg-accent { background-color: rgb(var(--accent)); }
        .text-accent-foreground { color: rgb(var(--accent-foreground)); }
        .border-border { border-color: rgb(var(--border)); }

        /* Button styles */
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s;
          border: 1px solid transparent;
          cursor: pointer;
          text-decoration: none;
        }

        .btn-sm {
          height: 2rem;
          padding: 0 0.75rem;
        }

        .btn-md {
          height: 2.5rem;
          padding: 0 1rem;
        }

        .btn-primary {
          background-color: rgb(var(--primary));
          color: rgb(var(--primary-foreground));
        }

        .btn-primary:hover {
          background-color: rgb(var(--primary) / 0.9);
        }

        .btn-outline {
          border: 1px solid rgb(var(--border));
          background-color: transparent;
        }

        .btn-outline:hover {
          background-color: rgb(var(--accent));
          color: rgb(var(--accent-foreground));
        }

        .btn-destructive {
          background-color: rgb(var(--destructive));
          color: rgb(var(--destructive-foreground));
        }

        .btn-destructive:hover {
          background-color: rgb(var(--destructive) / 0.9);
        }

        /* Card styles */
        .card {
          background-color: rgb(var(--card));
          border: 1px solid rgb(var(--border));
          border-radius: 0.5rem;
        }

        /* Input styles */
        .input {
          height: 2.5rem;
          width: 100%;
          border-radius: 0.375rem;
          border: 1px solid rgb(var(--border));
          background-color: rgb(var(--background));
          padding: 0 0.75rem;
          font-size: 0.875rem;
          color: rgb(var(--foreground));
        }

        .input:focus {
          outline: 2px solid rgb(var(--ring));
          outline-offset: 2px;
        }

        .input::placeholder {
          color: rgb(var(--muted-foreground));
        }

        /* Icon styles */
        .icon {
          width: 1rem;
          height: 1rem;
        }

        .icon-lg {
          width: 1.25rem;
          height: 1.25rem;
        }

        .icon-xl {
          width: 1.5rem;
          height: 1.5rem;
        }

        .icon-2xl {
          width: 2rem;
          height: 2rem;
        }

        /* Responsive sidebar */
        .sidebar-backdrop {
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.5);
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.3s, visibility 0.3s;
          z-index: 40;
        }

        .sidebar-backdrop.show {
          opacity: 1;
          visibility: visible;
        }

        .mobile-sidebar {
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          width: 16rem;
          transform: translateX(-100%);
          transition: transform 0.3s;
          z-index: 50;
        }

        .mobile-sidebar.show {
          transform: translateX(0);
        }

        @media (min-width: 768px) {
          .mobile-sidebar {
            position: relative;
            transform: translateX(0);
          }
        }

        /* Loading and refresh styles */
        .loading {
          opacity: 0.6;
          pointer-events: none;
        }

        .refresh-button {
          animation: spin 1s linear infinite;
        }

        .refresh-button.spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Debug info styles */
        .debug-info {
          font-family: 'Courier New', monospace;
          font-size: 0.75rem;
          background-color: rgb(var(--muted));
          border: 1px solid rgb(var(--border));
          border-radius: 0.375rem;
          padding: 0.5rem;
          margin-top: 1rem;
        }

        /* Status indicator */
        .status-indicator {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          border-radius: 0.375rem;
          border: 1px solid rgb(var(--border));
        }

        .status-success {
          background-color: rgb(34 197 94 / 0.1);
          color: rgb(34 197 94);
          border-color: rgb(34 197 94 / 0.2);
        }

        .status-warning {
          background-color: rgb(245 158 11 / 0.1);
          color: rgb(245 158 11);
          border-color: rgb(245 158 11 / 0.2);
        }

        .status-error {
          background-color: rgb(239 68 68 / 0.1);
          color: rgb(239 68 68);
          border-color: rgb(239 68 68 / 0.2);
        }
      </style>
    `;
  }

  private getBaseScripts(): string {
    return `
      <script src="https://cdnjs.cloudflare.com/ajax/libs/lucide/0.263.1/umd/lucide.min.js"></script>
      <script>
        // Enhanced navigation with debugging
        function navigateToFolder(path, showLoading = true) {
          console.log('Navigating to folder:', path);
          
          if (showLoading) {
            // Show loading state
            const cards = document.querySelectorAll('.card');
            cards.forEach(card => card.classList.add('loading'));
            
            // Add loading spinner to page
            showLoadingIndicator();
          }
          
          // Add timestamp to prevent caching
          const separator = path.includes('?') ? '&' : '?';
          const url = path + separator + '_t=' + Date.now();
          
          console.log('Final URL:', url);
          window.location.href = url;
        }

        function showLoadingIndicator() {
          const indicator = document.createElement('div');
          indicator.id = 'loading-indicator';
          indicator.className = 'fixed top-4 right-4 z-50 bg-primary text-primary-foreground px-3 py-2 rounded-md shadow-lg';
          indicator.innerHTML = '<i data-lucide="loader" class="icon mr-2 refresh-button spinning"></i>Loading...';
          document.body.appendChild(indicator);
          lucide.createIcons();
        }

        function refreshCache() {
          console.log('Refreshing cache...');
          const button = document.getElementById('refresh-btn');
          if (button) {
            button.classList.add('spinning');
            button.disabled = true;
          }
          
          // Force cache refresh by adding refresh parameter
          const currentUrl = new URL(window.location.href);
          currentUrl.searchParams.set('refresh', 'true');
          currentUrl.searchParams.set('_t', Date.now().toString());
          
          console.log('Refreshing with URL:', currentUrl.toString());
          window.location.href = currentUrl.toString();
        }

        function copyToClipboard(text) {
          navigator.clipboard.writeText(text).then(() => {
            showToast('Copied to clipboard!');
          }).catch(err => {
            console.error('Failed to copy:', err);
            showToast('Failed to copy', 'error');
          });
        }

        function showToast(message, type = 'success') {
          const toast = document.createElement('div');
          toast.className = 'fixed top-4 right-4 z-50 px-4 py-2 rounded-md shadow-lg transition-opacity';
          toast.className += type === 'error' ? ' bg-red-500 text-white' : ' bg-green-500 text-white';
          toast.textContent = message;
          
          document.body.appendChild(toast);
          
          setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
              document.body.removeChild(toast);
            }, 300);
          }, 2000);
        }

        // Search functionality
        function handleSearch(event) {
          const query = event.target.value.toLowerCase();
          const items = document.querySelectorAll('.search-item');
          
          items.forEach(item => {
            const searchText = item.getAttribute('data-searchable')?.toLowerCase() || '';
            if (searchText.includes(query)) {
              item.style.display = '';
            } else {
              item.style.display = 'none';
            }
          });
        }

        // View mode functionality
        let currentViewMode = localStorage.getItem('viewMode') || 'grid';

        function setViewMode(mode) {
          currentViewMode = mode;
          localStorage.setItem('viewMode', mode);
          
          const gridView = document.getElementById('grid-view');
          const listView = document.getElementById('list-view');
          const gridBtn = document.getElementById('grid-btn');
          const listBtn = document.getElementById('list-btn');
          
          if (mode === 'grid') {
            gridView?.classList.remove('hidden');
            listView?.classList.add('hidden');
            gridBtn?.classList.add('bg-accent');
            listBtn?.classList.remove('bg-accent');
          } else {
            gridView?.classList.add('hidden');
            listView?.classList.remove('hidden');
            gridBtn?.classList.remove('bg-accent');
            listBtn?.classList.add('bg-accent');
          }
        }

        // Sidebar functionality
        function toggleSidebar() {
          const sidebar = document.getElementById('mobile-sidebar');
          const backdrop = document.getElementById('sidebar-backdrop');
          
          if (sidebar && backdrop) {
            sidebar.classList.toggle('show');
            backdrop.classList.toggle('show');
          }
        }

        function closeSidebarOnNavigate() {
          const sidebar = document.getElementById('mobile-sidebar');
          const backdrop = document.getElementById('sidebar-backdrop');
          
          if (window.innerWidth < 768 && sidebar && backdrop) {
            sidebar.classList.remove('show');
            backdrop.classList.remove('show');
          }
        }

        // Debug functionality
        function toggleDebugInfo() {
          const debugElements = document.querySelectorAll('.debug-info');
          debugElements.forEach(el => {
            el.style.display = el.style.display === 'none' ? 'block' : 'none';
          });
        }

        // Initialize on DOM load
        document.addEventListener('DOMContentLoaded', () => {
          setViewMode(currentViewMode);
          lucide.createIcons();
          
          // Add click listener to all sidebar links to close on mobile
          const sidebarLinks = document.querySelectorAll('#mobile-sidebar a');
          sidebarLinks.forEach(link => {
            link.addEventListener('click', closeSidebarOnNavigate);
          });

          // Remove loading indicator if it exists
          const loadingIndicator = document.getElementById('loading-indicator');
          if (loadingIndicator) {
            setTimeout(() => {
              loadingIndicator.remove();
            }, 500);
          }

          // Check for URL parameters
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.has('refresh')) {
            showToast('Cache refreshed!');
            // Clean up URL
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('refresh');
            newUrl.searchParams.delete('_t');
            window.history.replaceState({}, document.title, newUrl.toString());
          }
        });
      </script>
    `;
  }
  private generateSidebar(activePage: string): string {
    const navItems = [
      { href: '/', icon: 'home', label: 'Home', id: 'home' },
      { href: '/html/', icon: 'film', label: 'HTML File Browser', id: 'html' },
      { href: '/dav/', icon: 'server', label: 'WebDAV', id: 'webdav' },
      { href: '/infuse/', icon: 'server', label: 'WebDAV for Infuse', id: 'infuse' }
    ];

    return `
      <!-- Mobile menu backdrop -->
      <div id="sidebar-backdrop" class="sidebar-backdrop md:hidden" onclick="toggleSidebar()"></div>
      
      <!-- Sidebar -->
      <div id="mobile-sidebar" class="mobile-sidebar md:relative md:w-64 bg-background border-r border-border">
        <div class="flex h-full flex-col">
          <!-- Sidebar Header -->
          <div class="p-4 border-b border-border">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold">Zurg Serverless</h2>
              <!-- Close button for mobile -->
              <button onclick="toggleSidebar()" class="md:hidden btn btn-outline btn-sm">
                <i data-lucide="x" class="icon"></i>
              </button>
            </div>
          </div>
          
          <!-- Sidebar Content -->
          <div class="flex-1 p-4">
            <nav class="space-y-2">
              ${navItems.map(item => `
                <a href="${item.href}"
                   class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                          ${activePage === item.id 
                            ? 'bg-accent text-accent-foreground' 
                            : 'hover:bg-accent hover:text-accent-foreground'}">
                  <i data-lucide="${item.icon}" class="icon"></i>
                  ${item.label}
                </a>
              `).join('')}
            </nav>

            <!-- Debug controls -->
            <div class="mt-8 pt-4 border-t border-border">
              <h3 class="text-sm font-medium mb-2">Debug</h3>
              <div class="space-y-2">
                <button onclick="toggleDebugInfo()" class="btn btn-outline btn-sm w-full">
                  <i data-lucide="bug" class="icon mr-2"></i>
                  Toggle Debug Info
                </button>
                <button id="refresh-btn" onclick="refreshCache()" class="btn btn-outline btn-sm w-full">
                  <i data-lucide="refresh-cw" class="icon mr-2"></i>
                  Refresh Cache
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private generateDebugInfo(title: string, data: any): string {
    return `
      <div class="debug-info" style="display: none;">
        <div class="font-semibold mb-2">${title}</div>
        <pre class="text-xs overflow-x-auto">${JSON.stringify(data, null, 2)}</pre>
      </div>
    `;
  }
  async generateRootPage(directories: string[], debugInfo?: any): Promise<string> {
    const validDirectories = directories.filter(d => !d.startsWith('int__'));
    
    const directoryCards = validDirectories.map(dir => `
      <div class="search-item">
        <div class="card cursor-pointer transition-shadow hover:shadow-md"
             data-searchable="${this.escapeHtml(dir)}"
             onclick="navigateToFolder('/html/${encodeURIComponent(dir)}/')">
          <div class="p-6">
            <div class="flex items-center justify-between mb-4">
              <div class="flex justify-center">
                <i data-lucide="folder" class="icon-xl text-yellow-500"></i>
              </div>
              <i data-lucide="chevron-right" class="icon text-muted-foreground"></i>
            </div>
            <div class="space-y-1">
              <p class="font-medium text-sm truncate">${this.escapeHtml(dir)}</p>
              <p class="text-xs text-muted-foreground">Media directory</p>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Zurg Serverless - Media Library</title>
        ${this.getBaseStyles()}
      </head>
      <body class="min-h-screen bg-gray-50">
        <div class="flex h-screen w-full">
          ${this.generateSidebar('html')}
          
          <!-- Main Content -->
          <div class="flex-1 min-w-0 overflow-auto bg-gray-50">
            <!-- Mobile Header with Hamburger -->
            <div class="md:hidden bg-white border-b px-4 py-3 flex items-center justify-between">
              <button onclick="toggleSidebar()" class="btn btn-outline btn-sm">
                <i data-lucide="menu" class="icon"></i>
              </button>
              <h1 class="text-lg font-semibold">Media Library</h1>
              <div class="w-10"></div> <!-- Spacer for centering -->
            </div>
            
            <!-- Header -->
            <div class="bg-white border-b">
              <div class="px-4 py-4">
                <div class="flex items-center justify-between">
                  <div>
                    <h1 class="text-2xl font-bold text-gray-900 hidden md:block">Media Library</h1>
                    <div class="flex items-center gap-4 mt-2">
                      <div class="status-indicator status-success">
                        <i data-lucide="check-circle" class="icon"></i>
                        ${validDirectories.length} directories found
                      </div>
                      <button onclick="refreshCache()" class="btn btn-outline btn-sm">
                        <i data-lucide="refresh-cw" class="icon mr-2"></i>
                        Refresh
                      </button>
                    </div>
                  </div>
                  <div class="hidden md:flex items-center gap-4">
                    <div class="relative">
                      <i data-lucide="search" class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 icon"></i>
                      <input
                        type="text"
                        placeholder="Search directories..."
                        oninput="handleSearch(event)"
                        class="input pl-10 w-60 md:w-80" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Content -->
            <div class="p-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                ${directoryCards}
              </div>
              
              ${validDirectories.length === 0 ? `
                <div class="text-center py-12">
                  <i data-lucide="folder-x" class="icon-2xl text-muted-foreground mx-auto mb-4"></i>
                  <h3 class="text-lg font-medium text-gray-900 mb-2">No directories found</h3>
                  <p class="text-muted-foreground mb-4">Try refreshing the cache or check your torrent configuration.</p>
                  <button onclick="refreshCache()" class="btn btn-primary">
                    <i data-lucide="refresh-cw" class="icon mr-2"></i>
                    Refresh Cache
                  </button>
                </div>
              ` : ''}
            </div>
            
            ${debugInfo ? this.generateDebugInfo('Directories Debug', {
              totalDirectories: directories.length,
              validDirectories: validDirectories.length,
              filteredDirectories: directories.filter(d => d.startsWith('int__')),
              debugInfo
            }) : ''}
          </div>
        </div>
        ${this.getBaseScripts()}
      </body>
      </html>
    `;
  }rent' ? 'Ready' : 'Error'}
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      
      return { gridCard, listRow };
    });

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${this.escapeHtml(directory)} - Zurg Serverless</title>
        ${this.getBaseStyles()}
      </head>
      <body class="min-h-screen bg-gray-50">
        <div class="flex h-screen w-full">
          ${this.generateSidebar('html')}
          
          <!-- Main Content -->
          <div class="flex-1 min-w-0 overflow-auto bg-gray-50">
            <!-- Mobile Header with Hamburger -->
            <div class="md:hidden bg-white border-b px-4 py-3 flex items-center justify-between">
              <button onclick="toggleSidebar()" class="btn btn-outline btn-sm">
                <i data-lucide="menu" class="icon"></i>
              </button>
              <h1 class="text-lg font-semibold truncate">${this.escapeHtml(directory)}</h1>
              <div class="w-10"></div> <!-- Spacer for centering -->
            </div>
            
            <!-- Header -->
            <div class="bg-white border-b">
              <div class="px-4 py-4">
                <div class="flex items-center justify-between">
                  <div class="flex-1 min-w-0">
                    <h1 class="text-2xl font-bold truncate hidden md:block">${this.escapeHtml(directory)}</h1>
                    <div class="flex items-center gap-4 mt-2">
                      <div class="status-indicator status-success">
                        <i data-lucide="folder" class="icon"></i>
                        ${torrentEntries.length} torrents
                      </div>
                      <button onclick="refreshCache()" class="btn btn-outline btn-sm">
                        <i data-lucide="refresh-cw" class="icon mr-2"></i>
                        Refresh
                      </button>
                    </div>
                  </div>
                  
                  <div class="flex items-center gap-4">
                    <div class="relative">
                      <i data-lucide="search" class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 icon"></i>
                      <input
                        type="text"
                        placeholder="Search media..."
                        oninput="handleSearch(event)"
                        class="input pl-10 w-60 md:w-80" />
                    </div>
                    <div class="flex border rounded-md">
                      <button id="grid-btn" onclick="setViewMode('grid')" class="btn btn-outline btn-sm rounded-r-none">
                        <i data-lucide="grid-3x3" class="icon"></i>
                      </button>
                      <button id="list-btn" onclick="setViewMode('list')" class="btn btn-outline btn-sm rounded-l-none">
                        <i data-lucide="list" class="icon"></i>
                      </button>
                    </div>
                  </div>
                </div>
                
                <!-- Breadcrumbs -->
                <div class="flex items-center gap-2 mt-4 text-sm hidden md:flex">
                  <button onclick="navigateToFolder('/html/')" class="btn btn-outline btn-sm">
                    <i data-lucide="home" class="icon"></i>
                  </button>
                  <i data-lucide="chevron-right" class="icon text-gray-400"></i>
                  <span class="text-gray-900">${this.escapeHtml(directory)}</span>
                </div>
              </div>
            </div>
            
            <div class="p-4">
              <!-- Grid View -->
              <div id="grid-view" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 hidden">
                ${torrentItems.map(item => item.gridCard).join('')}
              </div>
              
              <!-- List View -->
              <div id="list-view" class="space-y-3 hidden">
                ${torrentItems.map(item => item.listRow).join('')}
              </div>
              
              ${torrentEntries.length === 0 ? `
                <div class="text-center py-12">
                  <i data-lucide="folder-x" class="icon-2xl text-muted-foreground mx-auto mb-4"></i>
                  <h3 class="text-lg font-medium text-gray-900 mb-2">No torrents found</h3>
                  <p class="text-muted-foreground mb-4">This directory appears to be empty or the torrents haven't been cached yet.</p>
                  <button onclick="refreshCache()" class="btn btn-primary">
                    <i data-lucide="refresh-cw" class="icon mr-2"></i>
                    Refresh Cache
                  </button>
                </div>
              ` : ''}
            </div>
            
            ${debugInfo ? this.generateDebugInfo('Directory Debug', {
              directory,
              torrentCount: torrentEntries.length,
              torrents: torrentEntries.map(([key, torrent]) => ({
                accessKey: key,
                name: torrent.name,
                state: torrent.state,
                fileCount: Object.keys(torrent.selectedFiles).length,
                size: torrent.totalSize
              })),
              debugInfo
            }) : ''}
          </div>
        </div>
        ${this.getBaseScripts()}
      </body>
      </html>
    `;
  }
  generateTorrentPage(directory: string, torrent: Torrent, torrentName: string, debugInfo?: any): string {
    const files = Object.entries(torrent.selectedFiles)
      .filter(([_, file]) => file.state === 'ok_file')
      .map(([filename, file]) => {
        const strmFilename = this.generateSTRMFilename(filename);
        const { title, year, season, episode } = this.extractMediaInfo(filename);
        
        // Grid view card
        const gridCard = `
          <div class="search-item">
            <div class="card cursor-pointer transition-shadow hover:shadow-md"
                 data-searchable="${this.escapeHtml(filename)}"
                 onclick="navigateToFolder('/html/${encodeURIComponent(directory)}/${encodeURIComponent(torrentName)}/${encodeURIComponent(strmFilename)}')">
              <div class="p-4">
                <div class="flex flex-col items-center text-center space-y-3">
                  <div class="w-16 h-24 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded flex items-center justify-center">
                    <i data-lucide="film" class="icon-xl text-gray-600 dark:text-gray-400"></i>
                  </div>
                  <div class="space-y-2 w-full">
                    <h3 class="font-medium text-sm line-clamp-2" title="${this.escapeHtml(title || filename)}">
                      ${this.escapeHtml(title || filename)}
                    </h3>
                    <div class="flex flex-wrap gap-1 justify-center">
                      ${year ? `<span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">${year}</span>` : ''}
                      ${season ? `<span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">S${season}</span>` : ''}
                      ${episode ? `<span class="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">E${episode}</span>` : ''}
                    </div>
                    <p class="text-xs text-muted-foreground">${this.formatBytes(file.bytes)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
        
        // List view row
        const listRow = `
          <div class="search-item">
            <div class="card cursor-pointer transition-shadow hover:shadow-md"
                 data-searchable="${this.escapeHtml(filename)}"
                 onclick="navigateToFolder('/html/${encodeURIComponent(directory)}/${encodeURIComponent(torrentName)}/${encodeURIComponent(strmFilename)}')">
              <div class="p-3">
                <div class="flex items-center gap-3">
                  <div class="p-2 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400">
                    <i data-lucide="file-video" class="icon-lg"></i>
                  </div>
                  <div class="flex-1 min-w-0">
                    <h3 class="font-medium text-sm truncate" title="${this.escapeHtml(strmFilename)}">
                      ${this.escapeHtml(strmFilename)}
                    </h3>
                    <p class="text-xs text-muted-foreground truncate" title="${this.escapeHtml(filename)}">
                      ${this.escapeHtml(filename)}
                    </p>
                  </div>
                  <div class="text-right">
                    <p class="text-sm font-medium">${this.formatBytes(file.bytes)}</p>
                    <div class="flex gap-1 mt-1">
                      ${year ? `<span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">${year}</span>` : ''}
                      ${season ? `<span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">S${season}</span>` : ''}
                      ${episode ? `<span class="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">E${episode}</span>` : ''}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
        
        return { gridCard, listRow };
      });
    // Continue torrent page HTML
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${this.escapeHtml(torrent.name)} - Zurg Serverless</title>
        ${this.getBaseStyles()}
      </head>
      <body class="min-h-screen bg-gray-50">
        <div class="flex h-screen w-full">
          ${this.generateSidebar('html')}
          
          <!-- Main Content -->
          <div class="flex-1 min-w-0 overflow-auto bg-gray-50">
            <!-- Mobile Header with Hamburger -->
            <div class="md:hidden bg-white border-b px-4 py-3 flex items-center justify-between">
              <button onclick="toggleSidebar()" class="btn btn-outline btn-sm">
                <i data-lucide="menu" class="icon"></i>
              </button>
              <h1 class="text-lg font-semibold truncate max-w-[200px]" title="${this.escapeHtml(torrent.name)}">
                ${this.escapeHtml(torrent.name)}
              </h1>
              <div class="w-10"></div>
            </div>
            
            <!-- Header -->
            <div class="bg-white border-b">
              <div class="px-4 py-4">
                <div class="flex items-center justify-between">
                  <div class="flex-1 min-w-0">
                    <h1 class="text-xl font-bold truncate hidden md:block" title="${this.escapeHtml(torrent.name)}">
                      ${this.escapeHtml(torrent.name)}
                    </h1>
                    <div class="flex items-center gap-4 mt-2">
                      <div class="status-indicator status-success">
                        <i data-lucide="film" class="icon"></i>
                        ${files.length} files
                      </div>
                      <div class="status-indicator ${torrent.state === 'ok_torrent' ? 'status-success' : 'status-error'}">
                        <i data-lucide="${torrent.state === 'ok_torrent' ? 'check-circle' : 'alert-circle'}" class="icon"></i>
                        ${torrent.state === 'ok_torrent' ? 'Ready' : 'Error'}
                      </div>
                      <button onclick="refreshCache()" class="btn btn-outline btn-sm">
                        <i data-lucide="refresh-cw" class="icon mr-2"></i>
                        Refresh
                      </button>
                    </div>
                  </div>
                  
                  <div class="flex items-center gap-4">
                    <div class="relative">
                      <i data-lucide="search" class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 icon"></i>
                      <input type="text" placeholder="Search files..." oninput="handleSearch(event)" class="input pl-10 w-60 md:w-80" />
                    </div>
                    
                    <div class="flex border rounded-md">
                      <button id="grid-btn" onclick="setViewMode('grid')" class="btn btn-outline btn-sm rounded-r-none">
                        <i data-lucide="grid-3x3" class="icon"></i>
                      </button>
                      <button id="list-btn" onclick="setViewMode('list')" class="btn btn-outline btn-sm rounded-l-none">
                        <i data-lucide="list" class="icon"></i>
                      </button>
                    </div>
                  </div>
                </div>
                
                <!-- Breadcrumbs -->
                <nav class="flex items-center gap-2 mt-4 text-sm overflow-x-auto hidden md:flex">
                  <button onclick="navigateToFolder('/html/')" class="btn btn-outline btn-sm">
                    <i data-lucide="home" class="icon"></i>
                  </button>
                  <i data-lucide="chevron-right" class="icon text-gray-400"></i>
                  <button onclick="navigateToFolder('/html/${encodeURIComponent(directory)}/')" class="btn btn-outline btn-sm">
                    <span>${this.escapeHtml(directory)}</span>
                  </button>
                  <i data-lucide="chevron-right" class="icon text-gray-400"></i>
                  <span class="text-gray-900 truncate-left max-w-[250px]">${this.escapeHtml(torrent.name)}</span>
                </nav>
              </div>
            </div>
            
            <!-- Content -->
            <main class="p-4">
              <!-- Grid View -->
              <div id="grid-view" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 hidden">
                ${files.map(item => item.gridCard).join('')}
              </div>
              
              <!-- List View -->
              <div id="list-view" class="space-y-3 hidden">
                ${files.map(item => item.listRow).join('')}
              </div>
              
              ${files.length === 0 ? `
                <div class="text-center py-12">
                  <i data-lucide="file-x" class="icon-2xl text-muted-foreground mx-auto mb-4"></i>
                  <h3 class="text-lg font-medium text-gray-900 mb-2">No files found</h3>
                  <p class="text-muted-foreground mb-4">This torrent appears to have no ready files or they haven't been cached yet.</p>
                  <button onclick="refreshCache()" class="btn btn-primary">
                    <i data-lucide="refresh-cw" class="icon mr-2"></i>
                    Refresh Cache
                  </button>
                </div>
              ` : ''}
            </main>
            
            ${debugInfo ? this.generateDebugInfo('Torrent Debug', {
              directory,
              torrentName,
              torrent: {
                name: torrent.name,
                state: torrent.state,
                totalSize: torrent.totalSize,
                fileCount: Object.keys(torrent.selectedFiles).length,
                readyFiles: files.length
              },
              debugInfo
            }) : ''}
          </div>
        </div>
        ${this.getBaseScripts()}
      </body>
      </html>
    `;
  }
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async generateSTRMFilePage(
    directory: string, 
    torrentName: string, 
    filename: string, 
    torrent: Torrent,
    debugInfo?: any
  ): Promise<string> {
    const strmCache = new STRMCacheManager(this.env);
    const originalFilename = filename.slice(0, -5); // Remove .strm extension
    
    // Find the actual file in the torrent
    const actualFile = Object.entries(torrent.selectedFiles).find(([fname, _]) => {
      const actualBase = fname.lastIndexOf('.') !== -1 ? fname.substring(0, fname.lastIndexOf('.')) : fname;
      return actualBase === originalFilename;
    });

    if (!actualFile) {
      return this.generateErrorPage('File Not Found', `The file "${filename}" was not found in this torrent.`);
    }

    const [actualFilename, fileInfo] = actualFile;
    const strmContent = await strmCache.generateSTRMContent(torrent.id, actualFilename, fileInfo);

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${this.escapeHtml(filename)} - Zurg Serverless</title>
        ${this.getBaseStyles()}
      </head>
      <body class="min-h-screen bg-gray-50">
        <div class="flex h-screen w-full">
          ${this.generateSidebar('html')}
          
          <!-- Main Content -->
          <div class="flex-1 min-w-0 overflow-auto bg-gray-50">
            <!-- Mobile Header with Hamburger -->
            <div class="md:hidden bg-white border-b px-4 py-3 flex items-center justify-between">
              <button onclick="toggleSidebar()" class="btn btn-outline btn-sm">
                <i data-lucide="menu" class="icon"></i>
              </button>
              <h1 class="text-lg font-semibold truncate max-w-[200px]" title="${this.escapeHtml(filename)}">
                ${this.escapeHtml(filename)}
              </h1>
              <div class="w-10"></div>
            </div>
            
            <!-- Header -->
            <div class="bg-white border-b">
              <div class="px-4 py-4">
                <div class="flex-1 min-w-0">
                  <h1 class="text-xl font-bold truncate hidden md:block" title="${this.escapeHtml(filename)}">
                    ${this.escapeHtml(filename)}
                  </h1>
                  <p class="text-gray-600">STRM file content</p>
                </div>
              </div>
              
              <!-- Breadcrumbs -->
              <nav class="flex items-center gap-2 mt-4 text-sm overflow-x-auto hidden md:flex">
                <button onclick="navigateToFolder('/html/')" class="btn btn-outline btn-sm">
                  <i data-lucide="home" class="icon"></i>
                </button>
                <i data-lucide="chevron-right" class="icon text-gray-400"></i>
                <button onclick="navigateToFolder('/html/${encodeURIComponent(directory)}/')" class="btn btn-outline btn-sm">
                  <span>${this.escapeHtml(directory)}</span>
                </button>
                <i data-lucide="chevron-right" class="icon text-gray-400"></i>
                <button onclick="navigateToFolder('/html/${encodeURIComponent(directory)}/${encodeURIComponent(torrentName)}/')" class="btn btn-outline btn-sm">
                  <span>${this.escapeHtml(torrent.name)}</span>
                </button>
                <i data-lucide="chevron-right" class="icon text-gray-400"></i>
                <span class="text-gray-900 truncate max-w-[200px]">${this.escapeHtml(filename)}</span>
              </nav>
            </div>
            
            <!-- Content -->
            <main class="p-6">
              <div class="grid gap-6 lg:grid-cols-3">
                <!-- File Info Card -->
                <div class="card p-4 md:p-6">
                  <h2 class="text-lg font-semibold mb-4">File Information</h2>
                  <div class="space-y-3">
                    <div>
                      <dt class="text-sm font-medium text-muted-foreground">STRM Filename</dt>
                      <dd class="mt-1 text-sm">${this.escapeHtml(filename)}</dd>
                    </div>
                    <div>
                      <dt class="text-sm font-medium text-muted-foreground">Original Filename</dt>
                      <dd class="mt-1 text-sm break-all">${this.escapeHtml(actualFilename)}</dd>
                    </div>
                    <div>
                      <dt class="text-sm font-medium text-muted-foreground">File Size</dt>
                      <dd class="mt-1 text-sm">${this.formatBytes(fileInfo.bytes)}</dd>
                    </div>
                    <div>
                      <dt class="text-sm font-medium text-muted-foreground">Status</dt>
                      <dd class="mt-1">
                        <div class="status-indicator ${fileInfo.state === 'ok_file' ? 'status-success' : 'status-error'}">
                          <i data-lucide="${fileInfo.state === 'ok_file' ? 'check-circle' : 'alert-circle'}" class="icon"></i>
                          ${fileInfo.state === 'ok_file' ? 'Ready' : 'Error'}
                        </div>
                      </dd>
                    </div>
                  </div>
                </div>
                
                <!-- STRM Content Card -->
                <div class="card p-4 md:p-6">
                  <h2 class="text-lg font-semibold mb-4">STRM Content</h2>
                  <div class="space-y-4">
                    <div class="p-4 rounded-lg bg-muted font-mono text-sm break-all">
                      ${this.escapeHtml(strmContent.content)}
                    </div>
                    <div class="flex gap-2">
                      <button onclick="copyToClipboard('${this.escapeHtml(strmContent.content).replace(/'/g, "\\'")}');" 
                              class="btn btn-outline btn-sm">
                        <i data-lucide="copy" class="icon mr-2"></i>
                        Copy URL
                      </button>
                    </div>
                  </div>
                </div>
                
                <!-- File Path Card -->
                <div class="card p-4 md:p-6 lg:col-span-2">
                  <h2 class="text-lg font-semibold mb-4">Path Information</h2>
                  <div class="space-y-3">
                    <div>
                      <dt class="text-sm font-medium text-muted-foreground">Directory</dt>
                      <dd class="mt-1 text-sm">${this.escapeHtml(directory)}</dd>
                    </div>
                    <div>
                      <dt class="text-sm font-medium text-muted-foreground">Torrent</dt>
                      <dd class="mt-1 text-sm break-all">${this.escapeHtml(torrent.name)}</dd>
                    </div>
                    <div>
                      <dt class="text-sm font-medium text-muted-foreground">Torrent ID</dt>
                      <dd class="mt-1 text-sm font-mono">${this.escapeHtml(torrent.id)}</dd>
                    </div>
                  </div>
                </div>
              </div>
              
              ${debugInfo ? this.generateDebugInfo('STRM File Debug', {
                directory,
                torrentName,
                filename,
                actualFilename,
                fileInfo,
                strmContent,
                debugInfo
              }) : ''}
            </main>
          </div>
        </div>
        ${this.getBaseScripts()}
      </body>
      </html>
    `;
  }="viewport" content="width=device-width, initial-scale=1.0">
        <title>Zurg Serverless</title>
        ${this.getBaseStyles()}
      </head>
      <body class="min-h-screen bg-gray-50">
        <div class="flex h-screen w-full">
          ${this.generateSidebar('home')}
          
          <!-- Main Content -->
          <div class="flex-1 min-w-0 overflow-auto bg-gray-50">
            <!-- Mobile Header with Hamburger -->
            <div class="md:hidden bg-white border-b px-4 py-3 flex items-center justify-between">
              <button onclick="toggleSidebar()" class="btn btn-outline btn-sm">
                <i data-lucide="menu" class="icon"></i>
              </button>
              <h1 class="text-lg font-semibold">Zurg Serverless</h1>
              <div class="w-10"></div>
            </div>
            
            <!-- Header -->
            <div class="bg-white border-b">
              <div class="px-4 py-4">
                <div class="flex items-center justify-between">
                  <div>
                    <h1 class="text-2xl font-bold text-gray-900 hidden md:block">Zurg Serverless</h1>
                    <p class="text-muted-foreground hidden md:block">Real Debrid media server dashboard</p>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Content -->
            <div class="p-6">
              <!-- Status Cards -->
              <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
                ${userInfo ? `
                  <div class="card p-6">
                    <div class="flex items-center gap-4">
                      <div class="p-3 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400">
                        <i data-lucide="user" class="icon-lg"></i>
                      </div>
                      <div>
                        <h3 class="font-semibold">Account Status</h3>
                        <p class="text-sm text-muted-foreground">Connected as ${this.escapeHtml(userInfo.user?.username || 'User')}</p>
                        <p class="text-xs text-muted-foreground">Premium: ${userInfo.user?.type === 'premium' ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div class="card p-6">
                    <div class="flex items-center gap-4">
                      <div class="p-3 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                        <i data-lucide="activity" class="icon-lg"></i>
                      </div>
                      <div>
                        <h3 class="font-semibold">Points</h3>
                        <p class="text-sm text-muted-foreground">${userInfo.user?.points || 0} points</p>
                        <p class="text-xs text-muted-foreground">Premium expires: ${userInfo.user?.expiration || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                ` : ''}
                
                <div class="card p-6">
                  <div class="flex items-center gap-4">
                    <div class="p-3 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                      <i data-lucide="server" class="icon-lg"></i>
                    </div>
                    <div>
                      <h3 class="font-semibold">Service Status</h3>
                      <div class="status-indicator status-success">
                        <i data-lucide="check-circle" class="icon"></i>
                        Online
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Quick Access -->
              <div class="card">
                <div class="p-6 border-b border-border">
                  <h2 class="text-lg font-semibold">Quick Access</h2>
                  <p class="text-sm text-muted-foreground">Access your media through different interfaces</p>
                </div>
                <div class="p-6 pt-0">
                  <div class="grid gap-3">
                    <div class="p-3 rounded-lg border border-border bg-muted/50 hover:bg-muted transition-colors">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                          <div class="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            <i data-lucide="monitor" class="icon"></i>
                          </div>
                          <div>
                            <h4 class="font-medium text-sm">HTML File Browser</h4>
                            <p class="text-xs text-muted-foreground">Interactive web interface</p>
                          </div>
                        </div>
                        <a href="${this.baseURL}/html" class="btn btn-outline btn-sm">
                          <i data-lucide="external-link" class="icon mr-2"></i>
                          Open
                        </a>
                      </div>
                    </div>
                    <div class="p-3 rounded-lg border border-border bg-muted/50 hover:bg-muted transition-colors">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                          <div class="p-2 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400">
                            <i data-lucide="server" class="icon"></i>
                          </div>
                          <div>
                            <h4 class="font-medium text-sm">WebDAV Standard</h4>
                            <p class="text-xs text-muted-foreground font-mono">${this.baseURL}/dav</p>
                          </div>
                        </div>
                        <button onclick="copyToClipboard('${this.baseURL}/dav')" class="btn btn-outline btn-sm">
                          <i data-lucide="copy" class="icon mr-2"></i>
                          Copy
                        </button>
                      </div>
                    </div>
                    <div class="p-3 rounded-lg border border-border bg-muted/50 hover:bg-muted transition-colors">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                          <div class="p-2 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
                            <i data-lucide="server" class="icon"></i>
                          </div>
                          <div>
                            <h4 class="font-medium text-sm">WebDAV for Infuse</h4>
                            <p class="text-xs text-muted-foreground font-mono">${this.baseURL}/infuse</p>
                          </div>
                        </div>
                        <button onclick="copyToClipboard('${this.baseURL}/infuse')" class="btn btn-outline btn-sm">
                          <i data-lucide="copy" class="icon mr-2"></i>
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        ${this.getBaseScripts()}
      </body>
      </html>
    `;
  }
}