import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { migrateLegacyTemplates, createDefaultEmailTemplates } from '@/lib/email-template-service'

// POST - Migrate legacy templates to unified template system
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action } = body

    let result: { message: string; migratedCount?: number } = { message: '' }

    switch (action) {
      case 'migrate':
        // Migrate existing legacy templates to unified system
        await migrateLegacyTemplates()
        result = { 
          message: 'Legacy templates migrated to unified template system successfully',
          migratedCount: 0 // TODO: Return actual count from migrateLegacyTemplates
        }
        break

      case 'init_defaults':
        // Create default unified templates
        await createDefaultEmailTemplates()
        result = { 
          message: 'Default unified email templates created successfully' 
        }
        break

      case 'migrate_and_init':
        // Migrate existing and create defaults
        await migrateLegacyTemplates()
        await createDefaultEmailTemplates()
        result = { 
          message: 'Legacy templates migrated and default unified templates created successfully' 
        }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use "migrate", "init_defaults", or "migrate_and_init"' },
          { status: 400 }
        )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error during template migration:', error)
    return NextResponse.json(
      { error: 'Internal server error during migration' },
      { status: 500 }
    )
  }
}