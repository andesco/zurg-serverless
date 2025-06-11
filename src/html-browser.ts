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
            --primary-foreground: 9 9 11;
            --secondary: 39 39 42;
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
          color: rgb(var(--foreground));
        }

        .btn-outline:hover {
          background-color: rgb(var(--accent));
          color: rgb(var(--accent-foreground));
        }

        .btn-ghost {
          background-color: transparent;
          color: rgb(var(--foreground));
        }

        .btn-ghost:hover {
          background-color: rgb(var(--accent));
          color: rgb(var(--accent-foreground));
        }

        /* Input styles */
        .input {
          display: flex;
          height: 2.5rem;
          width: 100%;
          border-radius: 0.375rem;
          border: 1px solid rgb(var(--input));
          background-color: rgb(var(--background));
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          transition: all 0.2s;
        }

        .input:focus {
          outline: none;
          ring: 2px;
          ring-color: rgb(var(--ring));
        }

        /* Mobile sidebar styles */
        .sidebar-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 40;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.3s ease, visibility 0.3s ease;
        }

        .sidebar-backdrop.show {
          opacity: 1;
          visibility: visible;
        }

        .mobile-sidebar {
          position: fixed;
          top: 0;
          left: 0;
          height: 100vh;
          width: 16rem;
          background-color: rgb(var(--background));
          border-right: 1px solid rgb(var(--border));
          z-index: 50;
          transform: translateX(-100%);
          transition: transform 0.3s ease;
        }

        .mobile-sidebar.show {
          transform: translateX(0);
        }

        @media (min-width: 768px) {
          .mobile-sidebar {
            position: static;
            transform: translateX(0);
            z-index: auto;
          }
          
          .sidebar-backdrop {
            display: none;
          }
        }

        /* Card and other styles */
        .card {
          border-radius: 0.5rem;
          border: 1px solid rgb(var(--border));
          background-color: rgb(var(--card));
          color: rgb(var(--card-foreground));
          box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
        }

        .card:hover {
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
        }

        .badge {
          display: inline-flex;
          align-items: center;
          border-radius: 9999px;
          padding: 0.125rem 0.625rem;
          font-size: 0.75rem;
          font-weight: 600;
          transition: all 0.2s;
        }

        .badge-secondary {
          background-color: rgb(var(--secondary));
          color: rgb(var(--secondary-foreground));
        }

        .badge-outline {
          color: rgb(var(--foreground));
          border: 1px solid rgb(var(--border));
        }

        .separator {
          height: 1px;
          width: 100%;
          background-color: rgb(var(--border));
        }

        .truncate {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .truncate-left {
          overflow: hidden;
          white-space: nowrap;
          direction: rtl;
          text-align: left;
        }

        .truncate-left > span {
          direction: ltr;
        }

        .icon {
          width: 1rem;
          height: 1rem;
        }

        .icon-lg {
          width: 1.25rem;
          height: 1.25rem;
        }

        .icon-xl {
          width: 2rem;
          height: 2rem;
        }

        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: rgb(var(--muted));
        }

        ::-webkit-scrollbar-thumb {
          background: rgb(var(--muted-foreground));
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgb(var(--foreground));
        }

        .lucide {
          width: 1rem;
          height: 1rem;
          stroke-width: 2;
        }
      </style>
      <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
    `;
  }

  private getBaseScripts(): string {
    return `
      <script>
        // Enhanced navigation
        function navigateToFolder(path) {
          console.log('Navigating to folder:', path);
          window.location.href = path;
        }

        function refreshCache() {
          console.log('Refreshing cache...');
          // Force cache refresh by adding refresh parameter
          const currentUrl = new URL(window.location.href);
          currentUrl.searchParams.set('refresh', 'true');
          console.log('Refreshing with URL:', currentUrl.toString());
          window.location.href = currentUrl.toString();
        }

        // Initialize Lucide icons
        lucide.createIcons();

        // Mobile sidebar functionality
        function toggleSidebar() {
          const sidebar = document.getElementById('mobile-sidebar');
          const backdrop = document.getElementById('sidebar-backdrop');
          
          if (sidebar && backdrop) {
            sidebar.classList.toggle('show');
            backdrop.classList.toggle('show');
          }
        }

        // Close sidebar when clicking on a link (mobile)
        function closeSidebarOnNavigate() {
          const sidebar = document.getElementById('mobile-sidebar');
          const backdrop = document.getElementById('sidebar-backdrop');
          
          if (window.innerWidth < 768 && sidebar && backdrop) {
            sidebar.classList.remove('show');
            backdrop.classList.remove('show');
          }
        }

        // View mode functionality
        let currentViewMode = 'list'; // Always default to list (localStorage not available in Workers)

        function setViewMode(mode) {
          currentViewMode = mode;
          // Note: localStorage not available in Workers environment
          
          const gridView = document.getElementById('grid-view');
          const listView = document.getElementById('list-view');
          const gridBtn = document.getElementById('grid-btn');
          const listBtn = document.getElementById('list-btn');
          
          if (mode === 'grid') {
            if (gridView) gridView.classList.remove('hidden');
            if (listView) listView.classList.add('hidden');
            if (gridBtn) {
              gridBtn.classList.remove('btn-ghost');
              gridBtn.classList.add('btn-primary');
            }
            if (listBtn) {
              listBtn.classList.remove('btn-primary');
              listBtn.classList.add('btn-ghost');
            }
          } else {
            if (gridView) gridView.classList.add('hidden');
            if (listView) listView.classList.remove('hidden');
            if (listBtn) {
              listBtn.classList.remove('btn-ghost');
              listBtn.classList.add('btn-primary');
            }
            if (gridBtn) {
              gridBtn.classList.remove('btn-primary');
              gridBtn.classList.add('btn-ghost');
            }
          }
        }

        // Search functionality
        function handleSearch(event) {
          const searchTerm = event.target.value.toLowerCase();
          const items = document.querySelectorAll('[data-searchable]');
          
          items.forEach(item => {
            const text = item.getAttribute('data-searchable').toLowerCase();
            const parent = item.closest('.search-item');
            if (parent) {
              if (text.includes(searchTerm)) {
                parent.style.display = '';
              } else {
                parent.style.display = 'none';
              }
            }
          });
        }

        // Copy to clipboard
        async function copyToClipboard(text, buttonId) {
          try {
            await navigator.clipboard.writeText(text);
            const button = document.getElementById(buttonId);
            if (button) {
              const originalText = button.innerHTML;
              button.innerHTML = '<i data-lucide="check" class="icon mr-2"></i>Copied!';
              button.classList.add('btn-primary');
              lucide.createIcons();
              
              setTimeout(() => {
                button.innerHTML = originalText;
                button.classList.remove('btn-primary');
                lucide.createIcons();
              }, 2000);
            }
          } catch (err) {
            console.error('Failed to copy:', err);
            alert('Failed to copy to clipboard');
          }
        }

        // Update cache with progress tracking
        let currentRefreshId = null;
        let progressInterval = null;

        async function updateCache() {
          const button = document.getElementById('update-cache-btn');
          const buttonText = document.getElementById('update-cache-text');
          const progressDiv = document.getElementById('cache-progress');
          const progressText = document.getElementById('progress-text');
          const progressBar = document.getElementById('progress-bar');

          try {
            // Disable button and show loading state
            button.disabled = true;
            buttonText.textContent = 'Starting...';
            
            // Start cache refresh
            const response = await fetch('/refresh-cache', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            });
            
            const result = await response.json();
            
            if (!result.success) {
              const errorMsg = result.error || result.message || 'Failed to start cache refresh';
              
              // Special handling for "already in progress" error
              if (result.message && result.message.includes('already in progress')) {
                if (result.details) {
                  alert('Cache refresh is already running!\\n\\n' + result.details + '\\n\\nPlease wait for it to complete or try again in a few minutes.');
                } else {
                  alert('Cache refresh is already in progress. Please wait for it to complete.');
                }
                return;
              }
              
              throw new Error(errorMsg);
            }

            // Show progress UI
            currentRefreshId = result.refreshId;
            progressDiv.classList.remove('hidden');
            buttonText.textContent = 'Refreshing...';
            progressText.textContent = \`Processing 0/\${result.totalTorrents} torrents...\`;

            // Start polling for progress
            progressInterval = setInterval(pollProgress, 2000);
            
          } catch (error) {
            console.error('Cache refresh failed:', error);
            buttonText.textContent = 'Update Cache';
            button.disabled = false;
            alert('Failed to start cache refresh: ' + error.message);
          }
        }

        async function pollProgress() {
          if (!currentRefreshId) return;

          try {
            const response = await fetch(\`/refresh-status?id=\${currentRefreshId}\`);
            const result = await response.json();

            if (!result.success) {
              throw new Error('Failed to get refresh status');
            }

            const progressText = document.getElementById('progress-text');
            const progressBar = document.getElementById('progress-bar');
            const buttonText = document.getElementById('update-cache-text');

            // Update progress display
            const current = result.processed_torrents || 0;
            const total = result.total_torrents || 0;
            const progress = result.progress || 0;
            
            progressText.textContent = \`Processing \${current}/\${total} torrents...\`;
            if (result.current_torrent) {
              progressText.textContent += \` (\${result.current_torrent})\`;
            }
            progressBar.style.width = \`\${progress}%\`;

            // Check if completed
            if (result.status === 'completed') {
              clearInterval(progressInterval);
              progressInterval = null;
              currentRefreshId = null;
              
              // Show success state
              progressText.textContent = 'Cache refresh completed!';
              progressBar.style.width = '100%';
              buttonText.textContent = 'Update Cache';
              document.getElementById('update-cache-btn').disabled = false;
              
              // Reload page after 2 seconds to show updated cache stats
              setTimeout(() => {
                window.location.reload();
              }, 2000);
              
            } else if (result.status === 'failed') {
              clearInterval(progressInterval);
              progressInterval = null;
              currentRefreshId = null;
              
              // Show error state
              progressText.textContent = \`Cache refresh failed: \${result.error_message || 'Unknown error'}\`;
              buttonText.textContent = 'Update Cache';
              document.getElementById('update-cache-btn').disabled = false;
            }

          } catch (error) {
            console.error('Failed to poll progress:', error);
            clearInterval(progressInterval);
            progressInterval = null;
            currentRefreshId = null;
            
            document.getElementById('update-cache-text').textContent = 'Update Cache';
            document.getElementById('update-cache-btn').disabled = false;
          }
        }

        // Close sidebar on resize if screen becomes large
        window.addEventListener('resize', () => {
          if (window.innerWidth >= 768) {
            const sidebar = document.getElementById('mobile-sidebar');
            const backdrop = document.getElementById('sidebar-backdrop');
            
            if (sidebar && backdrop) {
              sidebar.classList.remove('show');
              backdrop.classList.remove('show');
            }
          }
        });

        // Initialize on DOM load
        document.addEventListener('DOMContentLoaded', () => {
          setViewMode(currentViewMode);
          lucide.createIcons();
          
          // Add click listener to all sidebar links to close on mobile
          const sidebarLinks = document.querySelectorAll('#mobile-sidebar a');
          sidebarLinks.forEach(link => {
            link.addEventListener('click', closeSidebarOnNavigate);
          });
        });
      </script>
    `;
  }

  private generateSidebar(activePage: string): string {
    const navItems = [
      { href: '/', icon: 'home', label: 'Home', id: 'home' },
      { href: '/files/', icon: 'folder', label: 'File Browser', id: 'files' },
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
              <button onclick="toggleSidebar()" class="md:hidden p-1 rounded-md hover:bg-accent">
                <i data-lucide="x" class="icon"></i>
              </button>
            </div>
          </div>
          
          <!-- Sidebar Content -->
          <div class="flex-1 p-4">
            <nav class="space-y-2">
              ${navItems.map(item => `
                <a href="${item.href}"
                   class="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground hover:bg-accent ${
                     activePage === item.id ? 'bg-accent text-accent-foreground' : ''
                   }">
                  <i data-lucide="${item.icon}" class="icon"></i>
                  <span>${item.label}</span>
                </a>
              `).join('')}
            </nav>
          </div>
          
          <!-- Sidebar Footer -->
          <div class="p-4 border-t border-border">
            <div class="text-xs text-muted-foreground">Serverless v1.0</div>
          </div>
        </div>
      </div>
    `;
  }

  async generateRootPage(directories: string[], debugInfo?: any): Promise<string> {
    // Show all directories except "__all__" and internal directories
    const validDirectories = directories.filter(d => d !== '__all__' && !d.startsWith('int__'));
    
    // Get torrent counts for each directory
    const storage = new (await import('./storage')).StorageManager(this.env);
    
    // Get cache statistics quickly
    const cacheStats = await storage.getCacheStatistics();
    
    const directoryCards = await Promise.all(validDirectories.map(async dir => {
      const torrents = await storage.getDirectory(dir);
      const itemCount = torrents ? Object.keys(torrents).length : 0;
      const itemText = itemCount === 1 ? '1 item' : `${itemCount} items`;
      
      // Grid view card
      const gridCard = `
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
                <p class="text-xs text-muted-foreground">${itemText}</p>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // List view row
      const listRow = `
        <div class="search-item">
          <div class="card cursor-pointer transition-shadow hover:shadow-md"
               data-searchable="${this.escapeHtml(dir)}"
               onclick="navigateToFolder('/html/${encodeURIComponent(dir)}/')">
            <div class="p-3">
              <div class="flex items-center gap-3">
                <div class="flex justify-center">
                  <i data-lucide="folder" class="icon-xl text-yellow-500"></i>
                </div>
                <div class="flex-1">
                  <p class="font-medium text-sm truncate">${this.escapeHtml(dir)}</p>
                  <p class="text-xs text-muted-foreground">${itemText}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      
      return { gridCard, listRow };
    }));

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Media Library - Zurg Serverless</title>
  ${this.getBaseStyles()}
</head>
<body class="min-h-screen bg-gray-50">
  <div class="flex h-screen w-full">
    ${this.generateSidebar('html')}
    
    <!-- Main Content -->
    <div class="flex-1 min-w-0 overflow-auto bg-gray-50">
      <!-- Mobile Header with Hamburger -->
      <div class="md:hidden bg-white border-b px-4 py-3 flex items-center justify-between">
        <button onclick="toggleSidebar()" class="p-2 rounded-md hover:bg-gray-100">
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
              <p class="text-gray-600">${validDirectories.length} media folders</p>
              <p class="text-xs text-muted-foreground">
                ${cacheStats.total} unique torrents: ${cacheStats.cached} cached, ${cacheStats.pending} pending
              </p>
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
                <button id="grid-btn" onclick="setViewMode('grid')" class="btn btn-sm btn-ghost">
                  <i data-lucide="grid-3x3" class="icon"></i>
                </button>
                <button id="list-btn" onclick="setViewMode('list')" class="btn btn-sm btn-ghost">
                  <i data-lucide="list" class="icon"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="p-4">
        <!-- Folders -->
        <div class="mb-8">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <i data-lucide="folder" class="icon-lg"></i>
            Directories
          </h2>
          <!-- Grid View -->
          <div id="grid-view" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 hidden">
            ${directoryCards.map(item => item.gridCard).join('') || '<div class="col-span-full text-center text-muted-foreground py-12">No directories found</div>'}
          </div>
          
          <!-- List View -->
          <div id="list-view" class="space-y-2">
            ${directoryCards.map(item => item.listRow).join('') || '<div class="text-center text-muted-foreground py-12">No directories found</div>'}
          </div>
        </div>
      </div>
    </div>
  </div>
  
  ${this.getBaseScripts()}
</body>
</html>`;
  }

  generateDirectoryPage(directory: string, torrents: { [key: string]: Torrent }): string {
    const torrentEntries = Object.entries(torrents);
    
    const torrentItems = torrentEntries.map(([accessKey, torrent]) => {
      const itemCount = Object.keys(torrent.selectedFiles).length;
      
      // Grid view card
      const gridCard = `
        <div class="search-item">
          <div class="card cursor-pointer transition-shadow hover:shadow-md"
               data-searchable="${this.escapeHtml(torrent.name)}"
               onclick="navigateToFolder('/html/${encodeURIComponent(directory)}/${encodeURIComponent(torrent.name)}/')">
            <div class="p-4 text-center">
              <div class="space-y-2">
                <div class="flex justify-center">
                  <i data-lucide="folder" class="icon-xl text-yellow-500"></i>
                </div>
                <div class="space-y-1">
                  <p class="font-medium text-sm truncate" title="${this.escapeHtml(torrent.name)}">${this.escapeHtml(torrent.name)}</p>
                  <p class="text-xs text-muted-foreground">${itemCount} items</p>
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
               data-searchable="${this.escapeHtml(torrent.name)}"
               onclick="navigateToFolder('/html/${encodeURIComponent(directory)}/${encodeURIComponent(torrent.name)}/')">
            <div class="p-3">
              <div class="flex items-center gap-3">
                <div class="flex justify-center">
                  <i data-lucide="folder" class="icon-xl text-yellow-500"></i>
                </div>
                <div class="flex-1">
                  <p class="font-medium text-sm truncate">${this.escapeHtml(torrent.name)}</p>
                  <p class="text-xs text-muted-foreground">${itemCount} items</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      
      return { gridCard, listRow };
    });

    return `<!DOCTYPE html>
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
        <button onclick="toggleSidebar()" class="p-2 rounded-md hover:bg-gray-100">
          <i data-lucide="menu" class="icon"></i>
        </button>
        <h1 class="text-lg font-semibold truncate">${this.escapeHtml(directory)}</h1>
        <div class="w-10"></div> <!-- Spacer for centering -->
      </div>
      
      <!-- Header -->
      <div class="bg-white border-b">
        <div class="px-4 py-4">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900 hidden md:block">Media Library</h1>
              <p class="text-gray-600">${torrentEntries.length} items</p>
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
                <button id="grid-btn" onclick="setViewMode('grid')" class="btn btn-sm btn-ghost">
                  <i data-lucide="grid-3x3" class="icon"></i>
                </button>
                <button id="list-btn" onclick="setViewMode('list')" class="btn btn-sm btn-ghost">
                  <i data-lucide="list" class="icon"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Breadcrumbs -->
          <div class="flex items-center gap-2 mt-4 text-sm hidden md:flex">
            <button onclick="window.location.href='/html/'" class="btn btn-ghost btn-sm h-auto p-1 text-gray-600 hover:text-gray-900">
              <i data-lucide="home" class="icon"></i>
            </button>
            <i data-lucide="chevron-right" class="icon text-gray-400"></i>
            <span class="text-gray-900">${this.escapeHtml(directory)}</span>
          </div>
        </div>
      </div>

      <div class="p-4">
        <!-- Folders -->
        <div class="mb-8">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <i data-lucide="folder" class="icon-lg"></i>
            Folders
          </h2>
          <!-- Grid View -->
          <div id="grid-view" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 hidden">
            ${torrentItems.map(item => item.gridCard).join('') || '<div class="col-span-full text-center text-muted-foreground py-12">No torrents found</div>'}
          </div>
          
          <!-- List View -->
          <div id="list-view" class="space-y-2">
            ${torrentItems.map(item => item.listRow).join('') || '<div class="text-center text-muted-foreground py-12">No torrents found</div>'}
          </div>
        </div>
      </div>
    </div>
  </div>
  
  ${this.getBaseScripts()}
</body>
</html>`;
  }

  generateTorrentPage(directory: string, torrent: Torrent, torrentName: string): string {
    const fileItems = Object.entries(torrent.selectedFiles)
      .filter(([_, file]) => file.state === 'ok_file')
      .map(([filename, file]) => {
        const strmFilename = this.generateSTRMFilename(filename);
        const { title, year, season, episode } = this.extractMediaInfo(filename);
        
        // Grid view card
        const gridCard = `
          <div class="search-item">
            <div class="card cursor-pointer transition-shadow hover:shadow-md"
                 data-searchable="${this.escapeHtml(filename)}"
                 onclick="window.location.href='/html/${encodeURIComponent(directory)}/${encodeURIComponent(torrentName)}/${encodeURIComponent(strmFilename)}'">
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
                      ${year ? `<span class="badge badge-secondary">${year}</span>` : ''}
                      ${season && episode ? `<span class="badge badge-outline">S${season.toString().padStart(2, '0')}E${episode.toString().padStart(2, '0')}</span>` : ''}
                    </div>
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
                 onclick="window.location.href='/html/${encodeURIComponent(directory)}/${encodeURIComponent(torrentName)}/${encodeURIComponent(strmFilename)}'">
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
                      Original: ${this.escapeHtml(filename)}
                    </p>
                  </div>
                  <div class="text-sm text-muted-foreground">
                    ${this.formatBytes(file.bytes)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
        
        return { gridCard, listRow, filename, strmFilename, file };
      });

    return `<!DOCTYPE html>
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
        <button onclick="toggleSidebar()" class="p-2 rounded-md hover:bg-gray-100">
          <i data-lucide="menu" class="icon"></i>
        </button>
        <h1 class="text-lg font-semibold truncate max-w-[200px]" title="${this.escapeHtml(torrent.name)}">
          ${this.escapeHtml(torrent.name)}
        </h1>
        <div class="w-10"></div> <!-- Spacer for centering -->
      </div>
      
      <!-- Header -->
      <div class="bg-white border-b">
        <div class="px-4 py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <div class="flex-1 min-w-0">
                <h1 class="text-xl font-bold truncate hidden md:block" title="${this.escapeHtml(torrent.name)}">
                  ${this.escapeHtml(torrent.name)}
                </h1>
                <p class="text-gray-600">${fileItems.length === 1 ? '1 STRM file ready' : `${fileItems.length} STRM files ready`}</p>
              </div>
            </div>
            
            <div class="flex items-center gap-4">
              <div class="relative">
                <i data-lucide="search" class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 icon"></i>
                <input
                  type="text"
                  placeholder="Search files..."
                  oninput="handleSearch(event)"
                  class="input pl-10 w-60 md:w-80" />
              </div>
              
              <div class="flex border rounded-md">
                <button id="grid-btn" onclick="setViewMode('grid')" class="btn btn-sm btn-ghost">
                  <i data-lucide="grid-3x3" class="icon"></i>
                </button>
                <button id="list-btn" onclick="setViewMode('list')" class="btn btn-sm btn-ghost">
                  <i data-lucide="list" class="icon"></i>
                </button>
              </div>
            </div>
          </div>
          
          <!-- Breadcrumbs -->
          <nav class="flex items-center gap-2 mt-4 text-sm overflow-x-auto hidden md:flex">
            <button onclick="window.location.href='/html/'" class="btn btn-ghost btn-sm h-auto p-1 text-gray-600 hover:text-gray-900">
              <i data-lucide="home" class="icon"></i>
            </button>
            <i data-lucide="chevron-right" class="icon text-gray-400"></i>
            <button onclick="window.location.href='/html/${encodeURIComponent(directory)}/'" class="btn btn-ghost btn-sm h-auto p-1 text-gray-600 hover:text-gray-900 truncate-left max-w-[150px]">
              <span>${this.escapeHtml(directory)}</span>
            </button>
            <i data-lucide="chevron-right" class="icon text-gray-400"></i>
            <span class="text-gray-900 truncate-left max-w-[250px]"><span>${this.escapeHtml(torrent.name)}</span></span>
          </nav>
        </div>
      </div>
      
      <!-- Content -->
      <main class="p-4">
        <!-- Files -->
        <div>
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <i data-lucide="film" class="icon-lg"></i>
            Files
          </h2>
          <!-- Grid View -->
          <div id="grid-view" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 hidden">
            ${fileItems.map(item => item.gridCard).join('') || '<div class="col-span-full text-center text-muted-foreground py-12">No files available</div>'}
          </div>
          
          <!-- List View -->
          <div id="list-view" class="space-y-2">
            ${fileItems.map(item => item.listRow).join('') || '<div class="text-center text-muted-foreground py-12">No files available</div>'}
          </div>
        </div>
      </main>
    </div>
  </div>
  
  ${this.getBaseScripts()}
</body>
</html>`;
  }

  async generateSTRMFilePage(directory: string, torrentName: string, filename: string, torrent: Torrent): Promise<string> {
    // Remove .strm extension to get base filename
    const baseFilename = filename.endsWith('.strm') ? filename.slice(0, -5) : filename;
    
    // Find the actual file by matching the base name
    const actualFilename = Object.keys(torrent.selectedFiles).find(f => {
      const actualBase = f.lastIndexOf('.') !== -1 ? f.substring(0, f.lastIndexOf('.')) : f;
      return actualBase === baseFilename;
    });
    
    if (!actualFilename) {
      return this.generateErrorPage('File not found', `Could not find file matching: ${baseFilename}`);
    }
    
    const file = torrent.selectedFiles[actualFilename];
    
    if (!file || file.state !== 'ok_file' || !file.link) {
      return this.generateErrorPage('File not available', `File state: ${file?.state || 'unknown'}`);
    }

    const strmContent = await this.generateSTRMContent(directory, torrent.id, actualFilename, file.link);
    
    // Fetch additional cache data for this file
    let cacheData: Record<string, any> = {};
    try {
      const cacheManager = new STRMCacheManager(this.env);
      const strmCode = await cacheManager.getOrCreateSTRMCode(directory, torrent.id, actualFilename, file.link);
      // With D1, we could potentially fetch additional metadata here if needed
      cacheData = { strmCode, createdAt: Date.now() };
    } catch (error) {
      console.error('Failed to fetch cache data:', error);
    }
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>STRM: ${this.escapeHtml(filename)} - Zurg Serverless</title>
  ${this.getBaseStyles()}
</head>
<body class="min-h-screen bg-gray-50">
  <div class="flex h-screen w-full">
    ${this.generateSidebar('html')}
    
    <!-- Main Content -->
    <div class="flex-1 min-w-0 overflow-auto bg-gray-50">
      <!-- Mobile Header with Hamburger -->
      <div class="md:hidden bg-white border-b px-4 py-3 flex items-center justify-between">
        <button onclick="toggleSidebar()" class="p-2 rounded-md hover:bg-gray-100">
          <i data-lucide="menu" class="icon"></i>
        </button>
        <h1 class="text-lg font-semibold truncate max-w-[200px]" title="${this.escapeHtml(filename)}">
          ${this.escapeHtml(filename)}
        </h1>
        <div class="w-10"></div> <!-- Spacer for centering -->
      </div>
      
      <!-- Header -->
      <div class="bg-white border-b">
        <div class="px-4 py-4">
          <div class="flex items-center gap-4">
            <div class="flex-1 min-w-0">
              <h1 class="text-xl font-bold truncate hidden md:block" title="${this.escapeHtml(filename)}">
                ${this.escapeHtml(filename)}
              </h1>
              <p class="text-gray-600">STRM file content</p>
            </div>
          </div>
          
          <!-- Breadcrumbs -->
          <nav class="flex items-center gap-2 mt-4 text-sm overflow-x-auto hidden md:flex">
            <button onclick="window.location.href='/html/'" class="btn btn-ghost btn-sm h-auto p-1 text-gray-600 hover:text-gray-900">
              <i data-lucide="home" class="icon"></i>
            </button>
            <i data-lucide="chevron-right" class="icon text-gray-400"></i>
            <button onclick="window.location.href='/html/${encodeURIComponent(directory)}/'" class="btn btn-ghost btn-sm h-auto p-1 text-gray-600 hover:text-gray-900 truncate-left max-w-[120px]">
              <span>${this.escapeHtml(directory)}</span>
            </button>
            <i data-lucide="chevron-right" class="icon text-gray-400"></i>
            <button onclick="window.location.href='/html/${encodeURIComponent(directory)}/${encodeURIComponent(torrentName)}/'" class="btn btn-ghost btn-sm h-auto p-1 text-gray-600 hover:text-gray-900 truncate-left max-w-[150px]">
              <span>${this.escapeHtml(torrent.name)}</span>
            </button>
            <i data-lucide="chevron-right" class="icon text-gray-400"></i>
            <span class="text-gray-900 truncate max-w-[200px]">${this.escapeHtml(filename)}</span>
          </nav>
        </div>
      </div>
      
      <!-- Content -->
      <main class="p-6">
        <div class="max-w-4xl mx-auto grid gap-6 lg:grid-cols-2">
          <!-- File Information Card -->
          <div class="card p-4 md:p-6">
            <h2 class="text-lg font-semibold mb-4">File Information</h2>
            <dl class="space-y-3">
              <div class="flex flex-col sm:flex-row sm:justify-between">
                <dt class="text-sm text-muted-foreground">Original file:</dt>
                <dd class="text-sm font-medium break-all sm:text-right sm:ml-2">${this.escapeHtml(actualFilename)}</dd>
              </div>
              <div class="flex flex-col sm:flex-row sm:justify-between">
                <dt class="text-sm text-muted-foreground">STRM size:</dt>
                <dd class="text-sm font-medium">${strmContent.size} bytes</dd>
              </div>
              <div class="flex flex-col sm:flex-row sm:justify-between">
                <dt class="text-sm text-muted-foreground">File size:</dt>
                <dd class="text-sm font-medium">${this.formatBytes(file.bytes)}</dd>
              </div>
              ${cacheData ? `
              <div class="flex flex-col sm:flex-row sm:justify-between">
                <dt class="text-sm text-muted-foreground">Directory:</dt>
                <dd class="text-sm font-medium">${this.escapeHtml(directory)}</dd>
              </div>
              ` : ''}
              ${torrent.id ? `
              <div class="flex flex-col sm:flex-row sm:justify-between">
                <dt class="text-sm text-muted-foreground">Torrent ID:</dt>
                <dd class="text-sm font-medium font-mono break-all">${this.escapeHtml(torrent.id)}</dd>
              </div>
              ` : ''}
              ${filename ? `
              <div class="flex flex-col sm:flex-row sm:justify-between">
                <dt class="text-sm text-muted-foreground">Cached filename:</dt>
                <dd class="text-sm font-medium break-all sm:text-right sm:ml-2">${this.escapeHtml(actualFilename)}</dd>
              </div>
              ` : ''}
              ${file.link ? `
              <div class="flex flex-col sm:flex-row sm:justify-between">
                <dt class="text-sm text-muted-foreground">RD Link:</dt>
                <dd class="text-sm font-medium break-all sm:text-right sm:ml-2">
                  <a href="${this.escapeHtml(file.link)}" target="_blank" class="text-blue-600 hover:text-blue-800">
                    ${this.escapeHtml(file.link.substring(0, 50))}...
                  </a>
                </dd>
              </div>
              ` : ''}
              <div class="flex flex-col sm:flex-row sm:justify-between">
                <dt class="text-sm text-muted-foreground">Status:</dt>
                <dd class="text-sm font-medium">
                  <span class="badge badge-secondary">
                    <i data-lucide="check-circle" class="icon mr-1"></i>
                    Ready to stream
                  </span>
                </dd>
              </div>
            </dl>
          </div>
          
          <!-- STRM Content Card -->
          <div class="card p-4 md:p-6">
            <h2 class="text-lg font-semibold mb-4">STRM Content</h2>
            <div class="space-y-4">
              <div class="p-4 rounded-lg bg-muted font-mono text-sm break-all">
                ${this.escapeHtml(strmContent.content)}
              </div>
              <div class="flex gap-2">
                <button id="copy-btn" onclick="copyToClipboard('${this.escapeAttr(strmContent.content)}', 'copy-btn')"
                        class="btn btn-outline btn-sm">
                  <i data-lucide="copy" class="icon mr-2"></i>
                  Copy URL
                </button>
              </div>
            </div>
          </div>
          
          <!-- File Path Card -->
          <div class="card p-4 md:p-6 lg:col-span-2">
            <h2 class="text-lg font-semibold mb-4">File Path</h2>
            <div class="p-4 rounded-lg bg-muted font-mono text-xs break-all text-muted-foreground">
              /dav/${this.escapeHtml(directory)}/${this.escapeHtml(torrentName)}/${this.escapeHtml(filename)}
            </div>
            <div class="mt-3">
              <a href="/dav/${encodeURIComponent(directory)}/${encodeURIComponent(torrentName)}/${encodeURIComponent(filename)}"
                 download="${this.escapeHtml(filename)}"
                 class="btn btn-primary btn-sm">
                <i data-lucide="download" class="icon mr-2"></i>
                Download STRM File
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
  
  ${this.getBaseScripts()}
</body>
</html>`;
  }

  private generateErrorPage(title: string, message: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error - Zurg Serverless</title>
  ${this.getBaseStyles()}
</head>
<body class="min-h-screen bg-gray-50 flex items-center justify-center">
  <div class="text-center">
    <i data-lucide="alert-triangle" class="icon-xl text-red-500 mb-4 mx-auto"></i>
    <h1 class="text-2xl font-bold mb-2">${this.escapeHtml(title)}</h1>
    <p class="text-muted-foreground mb-6">${this.escapeHtml(message)}</p>
    <button onclick="window.location.href='/html/'" class="btn btn-primary">
      <i data-lucide="home" class="icon mr-2"></i>
      Back to Home
    </button>
  </div>
  ${this.getBaseScripts()}
</body>
</html>`;
  }

  private extractMediaInfo(filename: string) {
    // Extract year from movie files
    const yearMatch = filename.match(/\((\d{4})\)/);
    const year = yearMatch ? parseInt(yearMatch[1]) : undefined;

    // Extract season/episode from TV files
    const episodeMatch = filename.match(/S(\d+)E(\d+)/i);
    const season = episodeMatch ? parseInt(episodeMatch[1]) : undefined;
    const episode = episodeMatch ? parseInt(episodeMatch[2]) : undefined;

    // Clean title
    const title = filename
      .replace(/\.\w+$/, '') // Remove extension
      .replace(/\(\d{4}\)/, '') // Remove year
      .replace(/S\d+E\d+.*/i, '') // Remove episode info
      .replace(/\[.*?\]/g, '') // Remove brackets content
      .replace(/\./g, ' ') // Replace dots with spaces
      .trim();

    return { title, year, season, episode };
  }

  private async generateSTRMContent(directory: string, torrentKey: string, filename: string, fileLink: string): Promise<{ content: string; size: number }> {
    const cacheManager = new STRMCacheManager(this.env);
    const strmCode = await cacheManager.getOrCreateSTRMCode(directory, torrentKey, filename, fileLink);
    
    const url = `${this.baseURL}/strm/${strmCode}`;
    const content = url;
    const size = new TextEncoder().encode(content).length;
    
    return { content, size };
  }

  private generateSTRMFilename(filename: string): string {
    const ext = filename.lastIndexOf('.');
    if (ext !== -1) {
      return filename.substring(0, ext) + '.strm';
    }
    return filename + '.strm';
  }

  private escapeHtml(text: string): string {
    return text.replace(/[&<>"']/g, (match) => {
      const escapes: { [key: string]: string } = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      };
      return escapes[match];
    });
  }

  private escapeAttr(text: string): string {
    return text.replace(/[&<>"'\\]/g, (match) => {
      const escapes: { [key: string]: string } = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '\\': '\\\\'
      };
      return escapes[match];
    });
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async generateHomePage(userInfo: {user: any; traffic: any} | null = null): Promise<string> {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Zurg Serverless - Home</title>
  ${this.getBaseStyles()}
</head>
<body class="min-h-screen bg-gray-50">
  <div class="flex h-screen w-full">
    ${this.generateSidebar('home')}
    
    <!-- Main Content -->
    <div class="flex-1 min-w-0 overflow-auto bg-gray-50">
      <!-- Mobile Header with Hamburger -->
      <div class="md:hidden bg-white border-b px-4 py-3 flex items-center justify-between">
        <button onclick="toggleSidebar()" class="p-2 rounded-md hover:bg-gray-100">
          <i data-lucide="menu" class="icon"></i>
        </button>
        <h1 class="text-lg font-semibold">Zurg Serverless</h1>
        <div class="w-10"></div> <!-- Spacer for centering -->
      </div>
      
      <!-- Header -->
      <div class="bg-white border-b">
        <div class="px-4 py-4">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900 hidden md:block">Zurg Serverless</h1>
              <p class="text-gray-600">serverless webdav with an infinite library of movies and series</p>
            </div>
          </div>
        </div>
      </div>

      <div class="p-4">
        <div class="grid gap-6">
          ${this.generateFilesBlock()}
          <div class="grid gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 min-w-0">
            ${this.generateConfigurationBlock()}
            ${await this.generateRealDebridCacheBlock()}
            ${this.generateRealDebridBlock(userInfo)}
          </div>
        </div>
      </div>
    </div>
  </div>
  
  ${this.getBaseScripts()}
</body>
</html>`;
  }

  private generateFilesBlock(): string {
    return `
      <!-- Files Block -->
      <div class="card">
        <div class="flex flex-col space-y-1.5 p-6">
          <h3 class="text-lg font-semibold leading-none tracking-tight">Files</h3>
          <p class="text-sm text-muted-foreground">Access your media library through different interfaces</p>
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
                    <h4 class="font-medium text-sm">File Browser</h4>
                    <p class="text-xs text-muted-foreground font-mono">${this.baseURL}/files</p>
                  </div>
                </div>
                <a href="${this.baseURL}/files" class="btn btn-outline btn-sm">
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
                <button id="copy-dav-btn" onclick="copyToClipboard('${this.escapeAttr(this.baseURL)}/dav', 'copy-dav-btn')" class="btn btn-outline btn-sm">
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
                <button id="copy-infuse-btn" onclick="copyToClipboard('${this.escapeAttr(this.baseURL)}/infuse', 'copy-infuse-btn')" class="btn btn-outline btn-sm">
                  <i data-lucide="copy" class="icon mr-2"></i>
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private generateConfigurationBlock(): string {
    const hasToken = !!this.env.RD_TOKEN;
    const hasUsername = !!this.env.USERNAME;
    const hasPassword = !!this.env.PASSWORD;
    const hasAuth = hasUsername && hasPassword;
    const hasDB = !!this.env.DB;
    
    // Check if any secrets are missing
    const missingSecrets = !hasToken || !hasUsername || !hasPassword;
    
    return `
      <!-- Configuration Block -->
      <div class="card min-w-[280px]">
        <div class="flex flex-col space-y-1.5 p-6">
          <h3 class="text-lg font-semibold leading-none tracking-tight">Configuration</h3>
          <p class="text-sm text-muted-foreground">Server configuration and environment details</p>
        </div>
        <div class="p-6 pt-0">
          <dl class="grid gap-3">
            <div class="flex justify-between">
              <dt class="text-sm text-muted-foreground">Base URL:</dt>
              <dd class="text-sm font-medium">${this.escapeHtml(this.baseURL)}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-sm text-muted-foreground">Real Debrid Token:</dt>
              <dd class="text-sm font-medium">
                <span class="inline-flex items-center rounded-full ${hasToken ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'} px-2 py-1 text-xs font-medium">
                  ${hasToken ? '✓ Configured' : '✗ Missing'}
                </span>
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-sm text-muted-foreground">Username & Password:</dt>
              <dd class="text-sm font-medium">
                <span class="inline-flex items-center rounded-full ${hasAuth ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'} px-2 py-1 text-xs font-medium">
                  ${hasAuth ? '✓ Configured' : '✗ Missing'}
                </span>
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-sm text-muted-foreground">Database:</dt>
              <dd class="text-sm font-medium">
                <span class="inline-flex items-center rounded-full ${hasDB ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'} px-2 py-1 text-xs font-medium">
                  ${hasDB ? '✓ Available' : '✗ Not Configured'}
                </span>
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-sm text-muted-foreground">Version:</dt>
              <dd class="text-sm font-medium">Serverless v1.0</dd>
            </div>
          </dl>
          ${missingSecrets ? `
          <div class="mt-4 pt-4 border-t">
            <a href="https://dash.cloudflare.com/${this.env.API_ACCOUNT_ID}/workers-and-pages" target="_blank" class="btn btn-outline btn-sm inline-flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mr-2"><path d="M15 3h6v6"></path><path d="M10 14 21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path></svg>
              Add Missing Secrets
            </a>
          </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  // Generate Real Debrid Cache block - NEW: Added cache statistics
  private async generateRealDebridCacheBlock(): Promise<string> {
    try {
      const storage = new (await import('./storage')).StorageManager(this.env);
      const cacheStats = await storage.getCacheStatistics();
      
      return `
        <!-- Real Debrid Cache Block -->
        <div class="card min-w-[280px]">
          <div class="flex flex-col space-y-1.5 p-6">
            <h3 class="text-lg font-semibold leading-none tracking-tight">Real Debrid Cache</h3>
            <p class="text-sm text-muted-foreground">Cache status and statistics</p>
          </div>
          <div class="p-6 pt-0">
            <dl class="grid gap-3">
              <div class="flex justify-between">
                <dt class="text-sm text-muted-foreground">Total Torrents:</dt>
                <dd class="text-sm font-medium">${cacheStats.total}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-sm text-muted-foreground">Cached:</dt>
                <dd class="text-sm font-medium">${cacheStats.cached}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-sm text-muted-foreground">Pending:</dt>
                <dd class="text-sm font-medium">${cacheStats.pending}</dd>
              </div>
              ${cacheStats.duplicates > 0 ? `
              <div class="flex justify-between">
                <dt class="text-sm text-muted-foreground">Duplicates:</dt>
                <dd class="text-sm font-medium">${cacheStats.duplicates}</dd>
              </div>
              ` : ''}
              <div class="flex justify-between">
                <dt class="text-sm text-muted-foreground">Cache Status:</dt>
                <dd class="text-sm font-medium">
                  <span class="inline-flex items-center rounded-full ${cacheStats.total === 0 ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400' : cacheStats.pending === 0 ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'} px-2 py-1 text-xs font-medium">
                    <i data-lucide="${cacheStats.total === 0 ? 'clock' : cacheStats.pending === 0 ? 'check' : 'clock'}" class="w-3 h-3 mr-1"></i>
                    ${cacheStats.total === 0 ? 'Pending' : cacheStats.pending === 0 ? 'Complete' : 'In Progress'}
                  </span>
                </dd>
              </div>
            </dl>
            ${cacheStats.pending > 0 || cacheStats.total === 0 ? `
            <div class="mt-4 pt-4 border-t">
              <button id="update-cache-btn" onclick="updateCache()" class="btn btn-outline btn-sm inline-flex items-center">
                <i data-lucide="refresh-cw" class="w-4 h-4 mr-2"></i>
                <span id="update-cache-text">Update Cache</span>
              </button>
              <div id="cache-progress" class="mt-3 hidden">
                <div class="text-sm text-muted-foreground mb-2">
                  <span id="progress-text">Starting cache refresh...</span>
                </div>
                <div class="w-full bg-muted rounded-full h-2">
                  <div id="progress-bar" class="bg-primary h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                </div>
              </div>
            </div>
            ` : ''}
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Failed to generate cache block:', error);
      return `
        <!-- Real Debrid Cache Block -->
        <div class="card min-w-[280px]">
          <div class="flex flex-col space-y-1.5 p-6">
            <h3 class="text-lg font-semibold leading-none tracking-tight">Real Debrid Cache</h3>
            <p class="text-sm text-muted-foreground">Unable to fetch cache information</p>
          </div>
        </div>
      `;
    }
  }

  private generateRealDebridBlock(userInfo: {user: any; traffic: any} | null): string {
    if (!userInfo) {
      return `
        <!-- Real Debrid Account Block -->
        <div class="card min-w-[280px]">
          <div class="flex flex-col space-y-1.5 p-6">
            <h3 class="text-lg font-semibold leading-none tracking-tight">Real Debrid Account</h3>
            <p class="text-sm text-muted-foreground">Unable to fetch account information</p>
          </div>
        </div>
      `;
    }

    const { user, traffic } = userInfo;
    const points = this.formatPoints(user.points);
    const daysRemaining = this.calculateDaysRemaining(user.expiration);
    const totalTrafficBytes = this.calculateTotalTrafficServed(traffic);
    const trafficGB = this.formatTrafficServed(totalTrafficBytes);
    
    return `
      <!-- Real Debrid Account Block -->
      <div class="card min-w-[280px]">
        <div class="flex flex-col space-y-1.5 p-6">
          <h3 class="text-lg font-semibold leading-none tracking-tight">Real Debrid Account</h3>
          <p class="text-sm text-muted-foreground">Connected account information</p>
        </div>
        <div class="p-6 pt-0">
          <dl class="grid gap-3">
            <div class="flex justify-between">
              <dt class="text-sm text-muted-foreground">Username:</dt>
              <dd class="text-sm font-medium">${this.escapeHtml(user.username)}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-sm text-muted-foreground">Points:</dt>
              <dd class="text-sm font-medium">${points}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-sm text-muted-foreground">Traffic Served:</dt>
              <dd class="text-sm font-medium">${trafficGB} GB</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-sm text-muted-foreground">Days Remaining:</dt>
              <dd class="text-sm font-medium">
                <span class="inline-flex items-center rounded-full ${daysRemaining > 30 ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' : daysRemaining > 7 ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400' : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'} px-2 py-1 text-xs font-medium">
                  ${daysRemaining} days
                </span>
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-sm text-muted-foreground">Premium:</dt>
              <dd class="text-sm font-medium">
                <span class="inline-flex items-center rounded-full ${user.premium ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400'} px-2 py-1 text-xs font-medium">
                  ${user.premium ? '✓ Active' : 'Inactive'}
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    `;
  }

  // Helper methods for formatting data
  private formatPoints(points: number): string {
    return points.toLocaleString();
  }

  private calculateDaysRemaining(expiration: string): number {
    const expirationDate = new Date(expiration);
    const today = new Date();
    const diffTime = expirationDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  private calculateTotalTrafficServed(traffic: any): number {
    // Sum up all traffic from the traffic object
    let total = 0;
    if (traffic && typeof traffic === 'object') {
      for (const [date, bytes] of Object.entries(traffic)) {
        if (typeof bytes === 'number') {
          total += bytes;
        }
      }
    }
    return total;
  }

  private formatTrafficServed(bytes: number): string {
    const gb = bytes / (1024 * 1024 * 1024);
    return gb.toFixed(2);
  }

  // Generate files root page - shows all torrents as individual folders
  async generateFilesRootPage(directories: string[]): Promise<string> {
    const storage = new (await import('./storage')).StorageManager(this.env);
    const cacheStats = await storage.getCacheStatistics();
    
    const torrentCards = await Promise.all(directories.map(async torrentName => {
      const torrents = await storage.getDirectory(torrentName);
      const torrent = torrents ? Object.values(torrents)[0] : null;
      const fileCount = torrent ? Object.keys(torrent.selectedFiles).length : 0;
      const fileText = fileCount === 1 ? '1 file' : `${fileCount} files`;
      
      // Grid view card
      const gridCard = `
        <div class="search-item">
          <a href="/files/${encodeURIComponent(torrentName)}/" class="block">
            <div class="card cursor-pointer transition-shadow hover:shadow-md"
                 data-searchable="${this.escapeHtml(torrentName)}">
              <div class="p-6">
                <div class="flex items-center justify-between mb-4">
                  <div class="flex justify-center">
                    <i data-lucide="folder" class="icon-xl text-blue-500"></i>
                  </div>
                  <i data-lucide="chevron-right" class="icon text-muted-foreground"></i>
                </div>
                <div class="space-y-1">
                  <p class="font-medium text-sm truncate">${this.escapeHtml(torrentName)}</p>
                  <p class="text-xs text-muted-foreground">${fileText}</p>
                </div>
              </div>
            </div>
          </a>
        </div>
      `;
      
      // List view row
      const listRow = `
        <div class="search-item">
          <a href="/files/${encodeURIComponent(torrentName)}/" class="block">
            <div class="card cursor-pointer transition-shadow hover:shadow-md"
                 data-searchable="${this.escapeHtml(torrentName)}">
              <div class="p-3">
                <div class="flex items-center gap-3">
                  <div class="flex justify-center">
                    <i data-lucide="folder" class="icon-xl text-blue-500"></i>
                  </div>
                  <div class="flex-1">
                    <p class="font-medium text-sm truncate">${this.escapeHtml(torrentName)}</p>
                    <p class="text-xs text-muted-foreground">${fileText}</p>
                  </div>
                </div>
              </div>
            </div>
          </a>
        </div>
      `;
      
      return { gridCard, listRow };
    }));

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Files - Zurg Serverless</title>
  ${this.getBaseStyles()}
</head>
<body class="min-h-screen bg-gray-50">
  <div class="flex h-screen w-full">
    ${this.generateSidebar('files')}
    
    <div class="flex-1 min-w-0 overflow-auto bg-gray-50">
      <!-- Mobile Header with Hamburger -->
      <div class="md:hidden bg-white border-b px-4 py-3 flex items-center justify-between">
        <button onclick="toggleSidebar()" class="p-2 rounded-md hover:bg-gray-100">
          <i data-lucide="menu" class="icon"></i>
        </button>
        <h1 class="text-lg font-semibold">Files</h1>
        <div class="w-10"></div> <!-- Spacer for centering -->
      </div>
      
      <div class="bg-white border-b">
        <div class="px-4 py-4">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900 hidden md:block">Files</h1>
              <p class="text-gray-600">${directories.length} media folders</p>
              <p class="text-xs text-muted-foreground">
                ${cacheStats.total} unique torrents: ${cacheStats.cached} cached, ${cacheStats.pending} pending
              </p>
            </div>
            <div class="flex items-center gap-4">
              <div class="relative">
                <i data-lucide="search" class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 icon"></i>
                <input
                  type="text"
                  placeholder="Search torrents..."
                  oninput="handleSearch(event)"
                  class="input pl-10 w-60 md:w-80" />
              </div>
              <div class="flex border rounded-md">
                <button id="grid-btn" onclick="setViewMode('grid')" class="btn btn-sm btn-ghost">
                  <i data-lucide="grid-3x3" class="icon"></i>
                </button>
                <button id="list-btn" onclick="setViewMode('list')" class="btn btn-sm btn-ghost">
                  <i data-lucide="list" class="icon"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="p-4">
        <div class="mb-8">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <i data-lucide="folder" class="icon-lg"></i>
            Torrents
          </h2>
          <!-- Grid View -->
          <div id="grid-view" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 hidden">
            ${torrentCards.map(item => item.gridCard).join('') || '<div class="col-span-full text-center text-muted-foreground py-12">No torrents found</div>'}
          </div>
          
          <!-- List View -->
          <div id="list-view" class="space-y-2">
            ${torrentCards.map(item => item.listRow).join('') || '<div class="text-center text-muted-foreground py-12">No torrents found</div>'}
          </div>
        </div>
      </div>
    </div>
  </div>
  
  ${this.getBaseScripts()}
</body>
</html>`;
  }

  // Generate torrent files page - shows files within a torrent
  async generateTorrentFilesPage(torrentName: string, torrent: Torrent): Promise<string> {
    const fileItems = Object.entries(torrent.selectedFiles)
      .map(([filename, file]) => {
        
        // Grid view card
        const gridCard = `
          <div class="search-item">
            <div class="card cursor-pointer transition-shadow hover:shadow-md"
                 data-searchable="${this.escapeHtml(filename)}"
                 onclick="window.location.href='/files/${encodeURIComponent(torrentName)}/${encodeURIComponent(filename)}/'">
              <div class="p-4 text-center">
                <div class="space-y-2">
                  <div class="w-16 h-24 bg-gradient-to-br from-green-200 to-green-300 rounded mx-auto flex items-center justify-center">
                    <i data-lucide="file-video" class="icon-xl text-green-600"></i>
                  </div>
                  <div class="space-y-1">
                    <p class="font-medium text-sm line-clamp-2" title="${this.escapeHtml(filename)}">${this.escapeHtml(filename)}</p>
                    <p class="text-xs text-muted-foreground">${this.formatBytes(file.bytes)}</p>
                    ${file.state !== 'ok_file' ? '<p class="text-xs text-orange-600">⚠️ File unavailable</p>' : ''}
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
                 onclick="window.location.href='/files/${encodeURIComponent(torrentName)}/${encodeURIComponent(filename)}/'">
              <div class="p-3">
                <div class="flex items-center gap-3">
                  <div class="p-2 rounded-lg bg-green-500/10 text-green-600">
                    <i data-lucide="file-video" class="icon-lg"></i>
                  </div>
                  <div class="flex-1 min-w-0">
                    <h3 class="font-medium text-sm truncate">${this.escapeHtml(filename)}</h3>
                    <p class="text-xs text-muted-foreground">${this.formatBytes(file.bytes)}</p>
                    ${file.state !== 'ok_file' ? '<p class="text-xs text-orange-600">⚠️ File unavailable</p>' : ''}
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
        
        return { gridCard, listRow };
      });

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(torrentName)} - Files</title>
  ${this.getBaseStyles()}
</head>
<body class="min-h-screen bg-gray-50">
  <div class="flex h-screen w-full">
    ${this.generateSidebar('files')}
    
    <div class="flex-1 min-w-0 overflow-auto bg-gray-50">
      <!-- Mobile Header with Hamburger -->
      <div class="md:hidden bg-white border-b px-4 py-3 flex items-center justify-between">
        <button onclick="toggleSidebar()" class="p-2 rounded-md hover:bg-gray-100">
          <i data-lucide="menu" class="icon"></i>
        </button>
        <h1 class="text-lg font-semibold truncate">${this.escapeHtml(torrentName)}</h1>
        <div class="w-10"></div> <!-- Spacer for centering -->
      </div>
      
      <div class="bg-white border-b">
        <div class="px-4 py-4">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900 hidden md:block">Files</h1>
              <p class="text-gray-600">${fileItems.length === 0 ? 'No files' : fileItems.length === 1 ? '1 file' : `${fileItems.length} files`}</p>
            </div>
            <div class="flex items-center gap-4">
              <div class="relative">
                <i data-lucide="search" class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 icon"></i>
                <input
                  type="text"
                  placeholder="Search files..."
                  oninput="handleSearch(event)"
                  class="input pl-10 w-60 md:w-80" />
              </div>
              <div class="flex border rounded-md">
                <button id="grid-btn" onclick="setViewMode('grid')" class="btn btn-sm btn-ghost">
                  <i data-lucide="grid-3x3" class="icon"></i>
                </button>
                <button id="list-btn" onclick="setViewMode('list')" class="btn btn-sm btn-ghost">
                  <i data-lucide="list" class="icon"></i>
                </button>
              </div>
            </div>
          </div>
          
          <!-- Breadcrumbs -->
          <div class="flex items-center gap-2 mt-4 text-sm hidden md:flex">
            <button onclick="window.location.href='/files/'" class="btn btn-ghost btn-sm h-auto p-1 text-gray-600 hover:text-gray-900">
              <i data-lucide="home" class="icon"></i>
            </button>
            <i data-lucide="chevron-right" class="icon text-gray-400"></i>
            <span class="text-gray-900 truncate">${this.escapeHtml(torrentName)}</span>
          </div>
        </div>
      </div>

      <div class="p-4">
        <div class="mb-8">
          <h2 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <i data-lucide="folder" class="icon-lg"></i>
            Files
          </h2>
          <!-- Grid View -->
          <div id="grid-view" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 hidden">
            ${fileItems.map(item => item.gridCard).join('') || '<div class="col-span-full text-center text-muted-foreground py-12">No files available</div>'}
          </div>
          
          <!-- List View -->
          <div id="list-view" class="space-y-2">
            ${fileItems.map(item => item.listRow).join('') || '<div class="text-center text-muted-foreground py-12">No files available</div>'}
          </div>
        </div>
      </div>
    </div>
  </div>
  
  ${this.getBaseScripts()}
</body>
</html>`;
  }

  // Generate file details page - shows details for a specific file
  async generateFileDetailsPage(torrentName: string, fileName: string, file: any): Promise<string> {
    const strmFilename = this.generateSTRMFilename(fileName);
    const { title, year, season, episode } = this.extractMediaInfo(fileName);
    
    // Generate STRM content to get short link
    const webdav = new (await import('./webdav')).WebDAVGenerator(this.env, this.request);
    const strmContent = await webdav.generateSTRMContent(torrentName, 'TORRENT_ID', fileName, file.link);
    const strmShortUrl = strmContent.content.trim();
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(fileName)} - File Details</title>
  ${this.getBaseStyles()}
</head>
<body class="min-h-screen bg-gray-50">
  <div class="flex h-screen w-full">
    ${this.generateSidebar('files')}
    
    <div class="flex-1 min-w-0 overflow-auto bg-gray-50">
      <div class="bg-white border-b">
        <div class="px-4 py-4">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900 hidden md:block">File Details</h1>
              <p class="text-gray-600">${this.escapeHtml(title || fileName)}</p>
            </div>
          </div>
          
          <div class="flex items-center gap-2 mt-4 text-sm">
            <button onclick="window.location.href='/files/'" class="btn btn-ghost btn-sm h-auto p-1 text-gray-600 hover:text-gray-900">
              <i data-lucide="home" class="icon"></i>
            </button>
            <i data-lucide="chevron-right" class="icon text-gray-400"></i>
            <button onclick="window.location.href='/files/${encodeURIComponent(torrentName)}/'" class="btn btn-ghost btn-sm h-auto p-1 text-gray-600 hover:text-gray-900 truncate max-w-xs">
              ${this.escapeHtml(torrentName)}
            </button>
            <i data-lucide="chevron-right" class="icon text-gray-400"></i>
            <span class="text-gray-900 truncate max-w-xs">${this.escapeHtml(fileName)}</span>
          </div>
        </div>
      </div>

      <div class="p-4">
        <div class="card p-6">
          <div class="space-y-6">
            <div class="text-center">
              <div class="w-20 h-28 bg-gradient-to-br from-blue-200 to-blue-300 rounded mx-auto mb-4 flex items-center justify-center">
                <i data-lucide="film" class="icon-2xl text-blue-600"></i>
              </div>
              <h2 class="text-xl font-bold">${this.escapeHtml(title || fileName)}</h2>
              ${year ? `<p class="text-muted-foreground">${year}</p>` : ''}
              ${season && episode ? `<p class="text-sm text-muted-foreground">Season ${season}, Episode ${episode}</p>` : ''}
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 class="font-semibold mb-3">File Information</h3>
                <dl class="space-y-2">
                  <div class="flex justify-between">
                    <dt class="text-sm text-muted-foreground">Original Name:</dt>
                    <dd class="text-sm font-medium truncate ml-2">${this.escapeHtml(fileName)}</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-sm text-muted-foreground">STRM Name:</dt>
                    <dd class="text-sm font-medium truncate ml-2">${this.escapeHtml(strmFilename)}</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-sm text-muted-foreground">Size:</dt>
                    <dd class="text-sm font-medium">${this.formatBytes(file.bytes)}</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-sm text-muted-foreground">Status:</dt>
                    <dd class="text-sm font-medium">
                      <span class="badge badge-success">${file.state}</span>
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-sm text-muted-foreground">STRM Short Link:</dt>
                    <dd class="text-sm font-medium">
                      <code class="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">${strmShortUrl}</code>
                    </dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-sm text-muted-foreground">Cached URL:</dt>
                    <dd class="text-sm font-medium">
                      <code class="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">${file.link || 'Not cached'}</code>
                    </dd>
                  </div>
                </dl>
              </div>
              
              <div>
                <h3 class="font-semibold mb-3">Actions</h3>
                <div class="space-y-3">
                  <a href="/files/${encodeURIComponent(torrentName)}/${encodeURIComponent(fileName)}/${encodeURIComponent(strmFilename)}"
                     class="btn btn-primary w-full">
                    <i data-lucide="download" class="icon mr-2"></i>
                    Download STRM File
                  </a>
                  ${file.link ? `
                  <a href="${file.link}" target="_blank" class="btn btn-secondary w-full">
                    <i data-lucide="external-link" class="icon mr-2"></i>
                    Direct Download Link
                  </a>
                  ` : ''}
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
</html>`;
  }
}
