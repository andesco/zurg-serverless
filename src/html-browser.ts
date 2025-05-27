import { Env, Torrent } from './types';
import { STRMCacheManager } from './strm-cache';

export class HTMLBrowser {
  private env: Env;
  private baseURL: string;

  constructor(env: Env, request: Request) {
    this.env = env;
    this.baseURL = env.BASE_URL || new URL(request.url).origin;
  }

  generateRootPage(directories: string[]): string {
    const directoryCards = directories
      .filter(d => !d.startsWith('int__'))
      .map(dir => `
        <div class="group relative overflow-hidden rounded-lg border bg-background p-2 hover:bg-accent hover:text-accent-foreground transition-colors">
          <a href="/html/${encodeURIComponent(dir)}/" class="absolute inset-0 z-10">
            <span class="sr-only">Browse ${this.escapeHtml(dir)}</span>
          </a>
          <div class="flex h-[180px] flex-col justify-between rounded-md p-6">
            <div class="space-y-2">
              <div class="inline-flex items-center rounded-lg bg-muted px-3 py-1 text-xs font-medium">
                📁 Directory
              </div>
              <h3 class="font-semibold">${this.escapeHtml(dir)}</h3>
              <p class="text-sm text-muted-foreground">
                Browse torrents and media files
              </p>
            </div>
            <div class="flex items-center space-x-1 rounded-md bg-secondary text-secondary-foreground">
              <div class="flex items-center space-x-1 text-xs">
                <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
                <span>Enter</span>
              </div>
            </div>
          </div>
        </div>
      `).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Zurg Serverless - Media Library</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            border: "hsl(var(--border))",
            input: "hsl(var(--input))",
            ring: "hsl(var(--ring))",
            background: "hsl(var(--background))",
            foreground: "hsl(var(--foreground))",
            primary: {
              DEFAULT: "hsl(var(--primary))",
              foreground: "hsl(var(--primary-foreground))",
            },
            secondary: {
              DEFAULT: "hsl(var(--secondary))",
              foreground: "hsl(var(--secondary-foreground))",
            },
            muted: {
              DEFAULT: "hsl(var(--muted))",
              foreground: "hsl(var(--muted-foreground))",
            },
            accent: {
              DEFAULT: "hsl(var(--accent))",
              foreground: "hsl(var(--accent-foreground))",
            },
            destructive: {
              DEFAULT: "hsl(var(--destructive))",
              foreground: "hsl(var(--destructive-foreground))",
            },
            card: {
              DEFAULT: "hsl(var(--card))",
              foreground: "hsl(var(--card-foreground))",
            },
          },
        }
      }
    }
  </script>
  <style>
    :root {
      --background: 0 0% 100%;
      --foreground: 222.2 84% 4.9%;
      --card: 0 0% 100%;
      --card-foreground: 222.2 84% 4.9%;
      --primary: 222.2 47.4% 11.2%;
      --primary-foreground: 210 40% 98%;
      --secondary: 210 40% 96%;
      --secondary-foreground: 222.2 84% 4.9%;
      --muted: 210 40% 96%;
      --muted-foreground: 215.4 16.3% 46.9%;
      --accent: 210 40% 96%;
      --accent-foreground: 222.2 84% 4.9%;
      --destructive: 0 84.2% 60.2%;
      --destructive-foreground: 210 40% 98%;
      --border: 214.3 31.8% 91.4%;
      --input: 214.3 31.8% 91.4%;
      --ring: 222.2 84% 4.9%;
    }
    
    @media (prefers-color-scheme: dark) {
      :root {
        --background: 222.2 84% 4.9%;
        --foreground: 210 40% 98%;
        --card: 222.2 84% 4.9%;
        --card-foreground: 210 40% 98%;
        --primary: 210 40% 98%;
        --primary-foreground: 222.2 47.4% 11.2%;
        --secondary: 217.2 32.6% 17.5%;
        --secondary-foreground: 210 40% 98%;
        --muted: 217.2 32.6% 17.5%;
        --muted-foreground: 215 20.2% 65.1%;
        --accent: 217.2 32.6% 17.5%;
        --accent-foreground: 210 40% 98%;
        --destructive: 0 62.8% 30.6%;
        --destructive-foreground: 210 40% 98%;
        --border: 217.2 32.6% 17.5%;
        --input: 217.2 32.6% 17.5%;
        --ring: 212.7 26.8% 83.9%;
      }
    }
  </style>
</head>
<body class="min-h-screen bg-background font-sans antialiased">
  <div class="relative flex min-h-screen flex-col">
    <header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div class="container flex h-14 items-center">
        <div class="mr-4 hidden md:flex">
          <a class="mr-6 flex items-center space-x-2" href="/html/">
            <span class="hidden font-bold sm:inline-block">🎬 Zurg Serverless</span>
          </a>
          <nav class="flex items-center space-x-6 text-sm font-medium">
            <a class="transition-colors hover:text-foreground/80 text-foreground" href="/html/">Browse</a>
            <a class="transition-colors hover:text-foreground/80 text-muted-foreground" href="/dav/">WebDAV</a>
            <a class="transition-colors hover:text-foreground/80 text-muted-foreground" href="/infuse/">Infuse</a>
          </nav>
        </div>
        <button class="inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:text-accent-foreground h-9 py-2 mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden">
          <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
          <span class="sr-only">Toggle Menu</span>
        </button>
        <div class="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div class="w-full flex-1 md:w-auto md:flex-none">
          </div>
        </div>
      </div>
    </header>
    <main class="flex-1">
      <div class="container py-6">
        <div class="flex flex-col space-y-8">
          <div class="flex flex-col space-y-2">
            <h1 class="text-3xl font-bold tracking-tight">Media Library</h1>
            <p class="text-muted-foreground">
              Browse your Real-Debrid collection and generate STRM files for streaming
            </p>
          </div>
          
          <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            ${directoryCards || '<div class="col-span-full text-center text-muted-foreground">No directories found</div>'}
          </div>
          
          <div class="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div class="flex flex-col space-y-1.5 p-6">
              <h3 class="text-2xl font-semibold leading-none tracking-tight">Quick Access</h3>
              <p class="text-sm text-muted-foreground">Direct links to WebDAV endpoints</p>
            </div>
            <div class="p-6 pt-0">
              <div class="grid gap-2">
                <a href="/dav/" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input hover:bg-accent hover:text-accent-foreground h-10 py-2 px-4">
                  <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5h8"/>
                  </svg>
                  WebDAV Mount Point
                </a>
                <a href="/infuse/" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input hover:bg-accent hover:text-accent-foreground h-10 py-2 px-4">
                  <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-9-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Infuse Pro Compatible
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</body>
</html>`;
  }

  generateDirectoryPage(directory: string, torrents: { [key: string]: Torrent }): string {
    const torrentCards = Object.entries(torrents)
      .map(([accessKey, torrent]) => `
        <div class="group relative overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-colors hover:bg-accent/50">
          <a href="/html/${encodeURIComponent(directory)}/${encodeURIComponent(torrent.name)}/" class="absolute inset-0 z-10">
            <span class="sr-only">Browse ${this.escapeHtml(torrent.name)}</span>
          </a>
          <div class="p-6">
            <div class="flex items-start justify-between space-y-0 pb-2">
              <div class="space-y-1 flex-1 min-w-0">
                <div class="inline-flex items-center rounded-lg bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  🎬 Torrent
                </div>
                <h3 class="font-semibold leading-none tracking-tight text-sm truncate" title="${this.escapeHtml(torrent.name)}">
                  ${this.escapeHtml(torrent.name)}
                </h3>
                <p class="text-xs text-muted-foreground">
                  ${Object.keys(torrent.selectedFiles).length} files available
                </p>
              </div>
            </div>
            <div class="flex items-center space-x-1 rounded-md bg-secondary/50 px-2 py-1 text-xs text-secondary-foreground mt-4">
              <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
              <span>View STRM Files</span>
            </div>
          </div>
        </div>
      `).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Directory: ${this.escapeHtml(directory)} - Zurg Serverless</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            border: "hsl(var(--border))",
            input: "hsl(var(--input))",
            ring: "hsl(var(--ring))",
            background: "hsl(var(--background))",
            foreground: "hsl(var(--foreground))",
            primary: {
              DEFAULT: "hsl(var(--primary))",
              foreground: "hsl(var(--primary-foreground))",
            },
            secondary: {
              DEFAULT: "hsl(var(--secondary))",
              foreground: "hsl(var(--secondary-foreground))",
            },
            muted: {
              DEFAULT: "hsl(var(--muted))",
              foreground: "hsl(var(--muted-foreground))",
            },
            accent: {
              DEFAULT: "hsl(var(--accent))",
              foreground: "hsl(var(--accent-foreground))",
            },
            card: {
              DEFAULT: "hsl(var(--card))",
              foreground: "hsl(var(--card-foreground))",
            },
          },
        }
      }
    }
  </script>
  <style>
    :root {
      --background: 0 0% 100%;
      --foreground: 222.2 84% 4.9%;
      --card: 0 0% 100%;
      --card-foreground: 222.2 84% 4.9%;
      --primary: 222.2 47.4% 11.2%;
      --primary-foreground: 210 40% 98%;
      --secondary: 210 40% 96%;
      --secondary-foreground: 222.2 84% 4.9%;
      --muted: 210 40% 96%;
      --muted-foreground: 215.4 16.3% 46.9%;
      --accent: 210 40% 96%;
      --accent-foreground: 222.2 84% 4.9%;
      --border: 214.3 31.8% 91.4%;
      --input: 214.3 31.8% 91.4%;
      --ring: 222.2 84% 4.9%;
    }
    
    @media (prefers-color-scheme: dark) {
      :root {
        --background: 222.2 84% 4.9%;
        --foreground: 210 40% 98%;
        --card: 222.2 84% 4.9%;
        --card-foreground: 210 40% 98%;
        --primary: 210 40% 98%;
        --primary-foreground: 222.2 47.4% 11.2%;
        --secondary: 217.2 32.6% 17.5%;
        --secondary-foreground: 210 40% 98%;
        --muted: 217.2 32.6% 17.5%;
        --muted-foreground: 215 20.2% 65.1%;
        --accent: 217.2 32.6% 17.5%;
        --accent-foreground: 210 40% 98%;
        --border: 217.2 32.6% 17.5%;
        --input: 217.2 32.6% 17.5%;
        --ring: 212.7 26.8% 83.9%;
      }
    }
  </style>
</head>
<body class="min-h-screen bg-background font-sans antialiased">
  <div class="relative flex min-h-screen flex-col">
    <header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div class="container flex h-14 items-center">
        <div class="mr-4 flex">
          <a class="mr-6 flex items-center space-x-2" href="/html/">
            <span class="font-bold">🎬 Zurg</span>
          </a>
          <nav class="flex items-center space-x-6 text-sm font-medium">
            <a class="transition-colors hover:text-foreground/80 text-muted-foreground" href="/html/">Browse</a>
            <span class="text-muted-foreground">/</span>
            <span class="text-foreground">${this.escapeHtml(directory)}</span>
          </nav>
        </div>
      </div>
    </header>
    <main class="flex-1">
      <div class="container py-6">
        <div class="flex flex-col space-y-6">
          <div class="flex flex-col space-y-2">
            <div class="flex items-center space-x-2">
              <a href="/html/" class="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                <svg class="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                </svg>
                Back to Root
              </a>
            </div>
            <h1 class="text-3xl font-bold tracking-tight">📁 ${this.escapeHtml(directory)}</h1>
            <p class="text-muted-foreground">
              ${Object.keys(torrents).length} torrents available for streaming
            </p>
          </div>
          
          <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            ${torrentCards || '<div class="col-span-full text-center text-muted-foreground py-8">No torrents found</div>'}
          </div>
        </div>
      </div>
    </main>
  </div>
</body>
</html>`;
  }

  generateTorrentPage(directory: string, torrent: Torrent, torrentName: string): string {
    const fileCards = Object.entries(torrent.selectedFiles)
      .map(([filename, file]) => {
        if (file.state !== 'ok_file') return '';
        const strmFilename = this.generateSTRMFilename(filename);
        return `
          <div class="group relative overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-colors hover:bg-accent/50">
            <a href="/html/${encodeURIComponent(directory)}/${encodeURIComponent(torrentName)}/${encodeURIComponent(strmFilename)}" class="absolute inset-0 z-10">
              <span class="sr-only">View STRM content for ${this.escapeHtml(strmFilename)}</span>
            </a>
            <div class="p-4">
              <div class="flex items-start justify-between space-y-0 pb-2">
                <div class="space-y-1 flex-1 min-w-0">
                  <div class="inline-flex items-center rounded-lg bg-green-100 dark:bg-green-900/20 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-400">
                    📄 STRM
                  </div>
                  <h3 class="font-medium leading-none tracking-tight text-sm truncate" title="${this.escapeHtml(strmFilename)}">
                    ${this.escapeHtml(strmFilename)}
                  </h3>
                  <p class="text-xs text-muted-foreground truncate" title="${this.escapeHtml(filename)}">
                    Original: ${this.escapeHtml(filename)}
                  </p>
                  <p class="text-xs text-muted-foreground">
                    ${this.formatBytes(file.bytes)}
                  </p>
                </div>
              </div>
              <div class="flex items-center space-x-1 rounded-md bg-secondary/50 px-2 py-1 text-xs text-secondary-foreground mt-3">
                <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
                <span>View Content</span>
              </div>
            </div>
          </div>
        `;
      }).filter(Boolean).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(torrent.name)} - Zurg Serverless</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            border: "hsl(var(--border))",
            input: "hsl(var(--input))",
            ring: "hsl(var(--ring))",
            background: "hsl(var(--background))",
            foreground: "hsl(var(--foreground))",
            primary: {
              DEFAULT: "hsl(var(--primary))",
              foreground: "hsl(var(--primary-foreground))",
            },
            secondary: {
              DEFAULT: "hsl(var(--secondary))",
              foreground: "hsl(var(--secondary-foreground))",
            },
            muted: {
              DEFAULT: "hsl(var(--muted))",
              foreground: "hsl(var(--muted-foreground))",
            },
            accent: {
              DEFAULT: "hsl(var(--accent))",
              foreground: "hsl(var(--accent-foreground))",
            },
            card: {
              DEFAULT: "hsl(var(--card))",
              foreground: "hsl(var(--card-foreground))",
            },
          },
        }
      }
    }
  </script>
  <style>
    :root {
      --background: 0 0% 100%;
      --foreground: 222.2 84% 4.9%;
      --card: 0 0% 100%;
      --card-foreground: 222.2 84% 4.9%;
      --primary: 222.2 47.4% 11.2%;
      --primary-foreground: 210 40% 98%;
      --secondary: 210 40% 96%;
      --secondary-foreground: 222.2 84% 4.9%;
      --muted: 210 40% 96%;
      --muted-foreground: 215.4 16.3% 46.9%;
      --accent: 210 40% 96%;
      --accent-foreground: 222.2 84% 4.9%;
      --border: 214.3 31.8% 91.4%;
      --input: 214.3 31.8% 91.4%;
      --ring: 222.2 84% 4.9%;
    }
    
    @media (prefers-color-scheme: dark) {
      :root {
        --background: 222.2 84% 4.9%;
        --foreground: 210 40% 98%;
        --card: 222.2 84% 4.9%;
        --card-foreground: 210 40% 98%;
        --primary: 210 40% 98%;
        --primary-foreground: 222.2 47.4% 11.2%;
        --secondary: 217.2 32.6% 17.5%;
        --secondary-foreground: 210 40% 98%;
        --muted: 217.2 32.6% 17.5%;
        --muted-foreground: 215 20.2% 65.1%;
        --accent: 217.2 32.6% 17.5%;
        --accent-foreground: 210 40% 98%;
        --border: 217.2 32.6% 17.5%;
        --input: 217.2 32.6% 17.5%;
        --ring: 212.7 26.8% 83.9%;
      }
    }
  </style>
</head>
<body class="min-h-screen bg-background font-sans antialiased">
  <div class="relative flex min-h-screen flex-col">
    <header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div class="container flex h-14 items-center">
        <div class="mr-4 flex">
          <a class="mr-6 flex items-center space-x-2" href="/html/">
            <span class="font-bold">🎬 Zurg</span>
          </a>
          <nav class="flex items-center space-x-2 text-sm font-medium">
            <a class="transition-colors hover:text-foreground/80 text-muted-foreground" href="/html/">Browse</a>
            <span class="text-muted-foreground">/</span>
            <a class="transition-colors hover:text-foreground/80 text-muted-foreground" href="/html/${encodeURIComponent(directory)}/">${this.escapeHtml(directory)}</a>
            <span class="text-muted-foreground">/</span>
            <span class="text-foreground truncate max-w-48">${this.escapeHtml(torrent.name)}</span>
          </nav>
        </div>
      </div>
    </header>
    <main class="flex-1">
      <div class="container py-6">
        <div class="flex flex-col space-y-6">
          <div class="flex flex-col space-y-2">
            <div class="flex items-center space-x-2">
              <a href="/html/${encodeURIComponent(directory)}/" class="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                <svg class="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                </svg>
                Back to ${this.escapeHtml(directory)}
              </a>
            </div>
            <h1 class="text-2xl font-bold tracking-tight">🎬 ${this.escapeHtml(torrent.name)}</h1>
            <p class="text-muted-foreground">
              ${Object.keys(torrent.selectedFiles).length} STRM files ready for streaming
            </p>
          </div>
          
          <div class="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            ${fileCards || '<div class="col-span-full text-center text-muted-foreground py-8">No files available</div>'}
          </div>
        </div>
      </div>
    </main>
  </div>
</body>
</html>`;
  }

  async generateSTRMFilePage(directory: string, torrentName: string, filename: string, torrent: Torrent): Promise<string> {
    // Remove .strm extension to get base filename
    const baseFilename = filename.endsWith('.strm') ? filename.slice(0, -5) : filename;
    
    // Find the actual file by matching the base name (since STRM removes the original extension)
    const actualFilename = Object.keys(torrent.selectedFiles).find(f => {
      // Remove extension from actual filename to compare with base
      const actualBase = f.lastIndexOf('.') !== -1 ? f.substring(0, f.lastIndexOf('.')) : f;
      return actualBase === baseFilename;
    });
    
    console.log('HTML STRM File Page - Debug:', {
      filename,
      baseFilename,
      actualFilename,
      availableFiles: Object.keys(torrent.selectedFiles)
    });
    
    if (!actualFilename) {
      console.log('HTML STRM File Page - No matching file found for base:', baseFilename);
      
      return `<!DOCTYPE html>
<html>
<head><title>Error</title></head>
<body>
<h1>File not found or unavailable</h1>
<p><strong>Looking for base name:</strong> ${this.escapeHtml(baseFilename)}</p>
<p><strong>Available files:</strong></p>
<ul>
${Object.keys(torrent.selectedFiles).map(f => `<li>${this.escapeHtml(f)}</li>`).join('')}
</ul>
</body>
</html>`;
    }
    
    const file = torrent.selectedFiles[actualFilename];
    
    if (!file || file.state !== 'ok_file' || !file.link) {
      console.log('HTML STRM File Page - File exists but not available:', {
        actualFilename,
        fileState: file?.state,
        hasLink: !!file?.link
      });
      
      return `<!DOCTYPE html>
<html>
<head><title>Error</title></head>
<body>
<h1>File not available</h1>
<p><strong>File:</strong> ${this.escapeHtml(actualFilename)}</p>
<p><strong>State:</strong> ${this.escapeHtml(file?.state || 'unknown')}</p>
<p><strong>Has Link:</strong> ${file?.link ? 'Yes' : 'No'}</p>
</body>
</html>`;
    }

    const strmContent = await this.generateSTRMContent(directory, torrent.id, actualFilename, file.link);
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>STRM: ${this.escapeHtml(filename)} - Zurg Serverless</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            border: "hsl(var(--border))",
            input: "hsl(var(--input))",
            ring: "hsl(var(--ring))",
            background: "hsl(var(--background))",
            foreground: "hsl(var(--foreground))",
            primary: {
              DEFAULT: "hsl(var(--primary))",
              foreground: "hsl(var(--primary-foreground))",
            },
            secondary: {
              DEFAULT: "hsl(var(--secondary))",
              foreground: "hsl(var(--secondary-foreground))",
            },
            muted: {
              DEFAULT: "hsl(var(--muted))",
              foreground: "hsl(var(--muted-foreground))",
            },
            accent: {
              DEFAULT: "hsl(var(--accent))",
              foreground: "hsl(var(--accent-foreground))",
            },
            card: {
              DEFAULT: "hsl(var(--card))",
              foreground: "hsl(var(--card-foreground))",
            },
          },
        }
      }
    }
  </script>
  <style>
    :root {
      --background: 0 0% 100%;
      --foreground: 222.2 84% 4.9%;
      --card: 0 0% 100%;
      --card-foreground: 222.2 84% 4.9%;
      --primary: 222.2 47.4% 11.2%;
      --primary-foreground: 210 40% 98%;
      --secondary: 210 40% 96%;
      --secondary-foreground: 222.2 84% 4.9%;
      --muted: 210 40% 96%;
      --muted-foreground: 215.4 16.3% 46.9%;
      --accent: 210 40% 96%;
      --accent-foreground: 222.2 84% 4.9%;
      --border: 214.3 31.8% 91.4%;
      --input: 214.3 31.8% 91.4%;
      --ring: 222.2 84% 4.9%;
    }
    
    @media (prefers-color-scheme: dark) {
      :root {
        --background: 222.2 84% 4.9%;
        --foreground: 210 40% 98%;
        --card: 222.2 84% 4.9%;
        --card-foreground: 210 40% 98%;
        --primary: 210 40% 98%;
        --primary-foreground: 222.2 47.4% 11.2%;
        --secondary: 217.2 32.6% 17.5%;
        --secondary-foreground: 210 40% 98%;
        --muted: 217.2 32.6% 17.5%;
        --muted-foreground: 215 20.2% 65.1%;
        --accent: 217.2 32.6% 17.5%;
        --accent-foreground: 210 40% 98%;
        --border: 217.2 32.6% 17.5%;
        --input: 217.2 32.6% 17.5%;
        --ring: 212.7 26.8% 83.9%;
      }
    }
  </style>
</head>
<body class="min-h-screen bg-background font-sans antialiased">
  <div class="relative flex min-h-screen flex-col">
    <header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div class="container flex h-14 items-center">
        <div class="mr-4 flex">
          <a class="mr-6 flex items-center space-x-2" href="/html/">
            <span class="font-bold">🎬 Zurg</span>
          </a>
          <nav class="flex items-center space-x-2 text-sm font-medium">
            <a class="transition-colors hover:text-foreground/80 text-muted-foreground" href="/html/">Browse</a>
            <span class="text-muted-foreground">/</span>
            <a class="transition-colors hover:text-foreground/80 text-muted-foreground" href="/html/${encodeURIComponent(directory)}/">${this.escapeHtml(directory)}</a>
            <span class="text-muted-foreground">/</span>
            <a class="transition-colors hover:text-foreground/80 text-muted-foreground" href="/html/${encodeURIComponent(directory)}/${encodeURIComponent(torrentName)}/">${this.escapeHtml(torrent.name.length > 20 ? torrent.name.substring(0, 20) + '...' : torrent.name)}</a>
            <span class="text-muted-foreground">/</span>
            <span class="text-foreground">${this.escapeHtml(filename)}</span>
          </nav>
        </div>
      </div>
    </header>
    <main class="flex-1">
      <div class="container py-6">
        <div class="flex flex-col space-y-6">
          <div class="flex flex-col space-y-2">
            <div class="flex items-center space-x-2">
              <a href="/html/${encodeURIComponent(directory)}/${encodeURIComponent(torrentName)}/" class="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                <svg class="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                </svg>
                Back to Torrent
              </a>
            </div>
            <h1 class="text-2xl font-bold tracking-tight">📄 ${this.escapeHtml(filename)}</h1>
            <p class="text-muted-foreground">
              STRM file content for streaming
            </p>
          </div>
          
          <div class="grid gap-6 lg:grid-cols-2">
            <div class="rounded-lg border bg-card text-card-foreground shadow-sm">
              <div class="flex flex-col space-y-1.5 p-6">
                <h3 class="text-lg font-semibold leading-none tracking-tight">File Information</h3>
                <p class="text-sm text-muted-foreground">Details about the original media file</p>
              </div>
              <div class="p-6 pt-0">
                <dl class="grid gap-3">
                  <div class="flex justify-between">
                    <dt class="text-sm text-muted-foreground">Original file:</dt>
                    <dd class="text-sm font-medium break-all">${this.escapeHtml(actualFilename)}</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-sm text-muted-foreground">STRM size:</dt>
                    <dd class="text-sm font-medium">${strmContent.size} bytes</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-sm text-muted-foreground">Status:</dt>
                    <dd class="text-sm font-medium">
                      <span class="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/20 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-400">
                        ✓ Ready to stream
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
            
            <div class="rounded-lg border bg-card text-card-foreground shadow-sm">
              <div class="flex flex-col space-y-1.5 p-6">
                <h3 class="text-lg font-semibold leading-none tracking-tight">STRM Content</h3>
                <p class="text-sm text-muted-foreground">The streaming URL contained in this file</p>
              </div>
              <div class="p-6 pt-0">
                <div class="rounded-lg bg-muted p-4">
                  <code class="text-sm break-all font-mono">${this.escapeHtml(strmContent.content)}</code>
                </div>
                <div class="mt-4">
                  <a href="${this.escapeHtml(strmContent.content)}" target="_blank" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4">
                    <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-9-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    Test Stream URL
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</body>
</html>`;
  }

  private async generateSTRMContent(directory: string, torrentKey: string, filename: string, fileLink: string): Promise<{ content: string; size: number }> {
    // Use the cache manager to get or create a short STRM code
    const cacheManager = new STRMCacheManager(this.env);
    const strmCode = await cacheManager.getOrCreateSTRMCode(directory, torrentKey, filename, fileLink);
    
    console.log('HTML STRM Content Generation:', { directory, torrentKey, filename, strmCode });
    
    // STRM content should point to our short /strm/ endpoint
    const url = `${this.baseURL}/strm/${strmCode}`;
    
    const content = url;
    const size = new TextEncoder().encode(content).length;
    
    console.log('HTML STRM Content Generated:', { url, size });
    
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

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
