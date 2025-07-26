import { syncEmails } from '@/lib/email-service'
import { prisma } from '@/lib/prisma'

interface ActiveConfig {
  id: string
  name: string
  syncInterval: number
  lastConfigHash: string
}

class EmailCronManager {
  private intervals: Map<string, NodeJS.Timeout> = new Map()
  private configHashes: Map<string, string> = new Map()
  private isRunning: boolean = false
  private checkInterval: NodeJS.Timeout | null = null

  async start() {
    if (this.isRunning) {
      return
    }

    this.isRunning = true
    await this.setupIndividualIntervals()
    
    // Check for configuration changes every 60 seconds
    this.checkInterval = setInterval(async () => {
      await this.checkForConfigChanges()
    }, 60 * 1000)
  }

  stop() {
    if (!this.isRunning) {
      return
    }

    this.isRunning = false

    // Clear check interval
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }

    // Clear all individual intervals
    this.clearAllIntervals()
  }

  private clearAllIntervals() {
    for (const [configId, interval] of this.intervals) {
      clearInterval(interval)
    }
    this.intervals.clear()
    this.configHashes.clear()
  }

  private async checkForConfigChanges() {
    try {
      const activeConfigs = await prisma.emailConfiguration.findMany({
        where: {
          isActive: true,
          enableAutoSync: true
        }
      })

      let hasChanges = false
      const currentConfigIds = new Set(activeConfigs.map(config => config.id))
      
      // Check if any configs were added or removed
      if (currentConfigIds.size !== this.intervals.size) {
        hasChanges = true
      } else {
        // Check if any existing configs have different IDs
        for (const configId of currentConfigIds) {
          if (!this.intervals.has(configId)) {
            hasChanges = true
            break
          }
        }
      }

      // Check if any existing configs have changed settings
      if (!hasChanges) {
        for (const config of activeConfigs) {
          const newHash = this.createConfigHash(config)
          const oldHash = this.configHashes.get(config.id)
          
          if (oldHash !== newHash) {
            hasChanges = true
            break
          }
        }
      }

      if (hasChanges) {
        await this.restartAllIntervals()
      }
    } catch (error) {
      console.error('Error checking for config changes:', error)
    }
  }

  private createConfigHash(config: Record<string, unknown>): string {
    return `${config.syncInterval}-${config.isActive}-${config.enableAutoSync}-${config.emailAction}-${config.moveToFolder || ''}`
  }

  private async restartAllIntervals() {
    // Stop all current intervals
    this.clearAllIntervals()
    
    // Setup new intervals
    await this.setupIndividualIntervals()
  }

  private async setupIndividualIntervals() {
    try {
      const activeConfigs = await prisma.emailConfiguration.findMany({
        where: {
          isActive: true,
          enableAutoSync: true
        }
      })

      for (const config of activeConfigs) {
        const intervalMs = config.syncInterval * 1000
        
        // Store config hash for change detection
        this.configHashes.set(config.id, this.createConfigHash(config))
        
        // Create interval that fetches fresh config data each time
        const interval = setInterval(async () => {
          await this.syncSingleConfigById(config.id)
        }, intervalMs)

        this.intervals.set(config.id, interval)
      }
    } catch (error) {
      console.error('Error setting up email intervals:', error)
    }
  }

  private async syncSingleConfigById(configId: string) {
    try {
      // Fetch fresh config data to avoid stale closure data
      const config = await prisma.emailConfiguration.findUnique({
        where: { id: configId }
      })

      if (!config || !config.isActive || !config.enableAutoSync) {
        // Config was deactivated, interval will be cleaned up on next check
        return
      }

      const result = await syncEmails(config)
      
      // Update last sync timestamp
      await prisma.emailConfiguration.update({
        where: { id: configId },
        data: { lastSync: new Date() }
      })
    } catch (error) {
      console.error(`Scheduled sync failed for config ${configId}:`, error)
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      activeIntervals: this.intervals.size,
      configurationIds: Array.from(this.intervals.keys())
    }
  }

  // Public method to trigger restart when configs are modified
  async onConfigChanged() {
    if (this.isRunning) {
      await this.restartAllIntervals()
    }
  }
}

// Singleton instance
export const emailCronManager = new EmailCronManager()

// Auto-start when the module is imported (server-side only)
if (typeof window === 'undefined') {
  emailCronManager.start().catch(console.error)
}