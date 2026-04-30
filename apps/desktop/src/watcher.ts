import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { EventEmitter } from 'events';
import * as chokidar from 'chokidar';

export class JournalWatcher extends EventEmitter {
  private watcher: chokidar.FSWatcher | null = null;
  private journalPath: string;
  private processedFiles: Set<string> = new Set();
  private lastPosition: Map<string, number> = new Map();

  constructor(journalPath: string) {
    super();
    this.journalPath = journalPath;
  }

  start(): void {
    // Watch for new journal files and changes
    this.watcher = chokidar.watch(path.join(this.journalPath, '*.log'), {
      ignored: /^\./,
      persistent: true,
      ignoreInitial: false,
      awaitWriteFinish: {
        stabilityThreshold: 1000,
        pollInterval: 100,
      },
    });

    this.watcher
      .on('add', (filePath: string) => this.processFile(filePath))
      .on('change', (filePath: string) => this.processFile(filePath))
      .on('error', (error: Error) => this.emit('error', error));

    console.log(`Watching journal directory: ${this.journalPath}`);
  }

  stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }

  private async processFile(filePath: string): Promise<void> {
    try {
      const stat = await fs.promises.stat(filePath);
      const lastPos = this.lastPosition.get(filePath) || 0;

      // Skip if file hasn't grown
      if (stat.size <= lastPos) {
        return;
      }

      const fileStream = fs.createReadStream(filePath, {
        start: lastPos,
        encoding: 'utf8',
      });

      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
      });

      let linesProcessed = 0;

      for await (const line of rl) {
        if (line.trim()) {
          try {
            const event = JSON.parse(line);
            this.emit('event', event);
            linesProcessed++;
          } catch (e) {
            // Skip malformed lines
            console.warn('Failed to parse journal line:', line);
          }
        }
      }

      // Update last position
      this.lastPosition.set(filePath, stat.size);

      if (linesProcessed > 0) {
        console.log(`Processed ${linesProcessed} events from ${path.basename(filePath)}`);
      }
    } catch (error) {
      this.emit('error', error);
    }
  }
}