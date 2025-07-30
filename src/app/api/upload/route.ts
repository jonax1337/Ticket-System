import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { strictRateLimit } from '@/lib/rate-limit'
import { APP_CONFIG } from '@/lib/config'

// Security constants from config
const { maxFileSize, maxFilesPerRequest, allowedMimeTypes } = APP_CONFIG.upload

function sanitizeFilename(filename: string): string {
  // Remove or replace dangerous characters
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/\.+/g, '.')
    .replace(/^\./, '')
    .substring(0, 255)
}

function validateFileType(file: File): boolean {
  // Check MIME type
  if (!allowedMimeTypes.includes(file.type as typeof allowedMimeTypes[number])) {
    return false
  }
  
  // Additional check: verify file extension matches MIME type
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (!extension) return false
  
  const mimeToExtension: Record<string, string[]> = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/gif': ['gif'],
    'image/webp': ['webp'],
    'application/pdf': ['pdf'],
    'text/plain': ['txt'],
    'text/csv': ['csv'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['xlsx'],
    'application/zip': ['zip'],
    'application/x-zip-compressed': ['zip']
  }
  
  return mimeToExtension[file.type]?.includes(extension) || false
}

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = strictRateLimit(request)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.message },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
          }
        }
      )
    }

    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }

    // Validate file count
    if (files.length > maxFilesPerRequest) {
      return NextResponse.json(
        { error: `Maximum ${maxFilesPerRequest} files allowed per request` },
        { status: 400 }
      )
    }

    const uploadDir = join(process.cwd(), 'public', 'uploads')
    
    // Create upload directory if it doesn't exist
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    const uploadedFiles = []
    const errors = []

    for (const file of files) {
      if (!file || typeof file === 'string') continue

      // Validate file size
      if (file.size > maxFileSize) {
        errors.push(`File ${file.name} exceeds maximum size of ${maxFileSize / 1024 / 1024}MB`)
        continue
      }

      // Validate file type
      if (!validateFileType(file)) {
        errors.push(`File ${file.name} has unsupported type: ${file.type}`)
        continue
      }

      // Generate unique filename with sanitization
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 15)
      const sanitizedName = sanitizeFilename(file.name)
      const extension = sanitizedName.split('.').pop()
      const uniqueFilename = `${timestamp}-${randomString}.${extension}`
      
      const filePath = join(uploadDir, uniqueFilename)
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      await writeFile(filePath, buffer)
      
      uploadedFiles.push({
        filename: file.name,
        filepath: `/uploads/${uniqueFilename}`,
        mimetype: file.type,
        size: file.size
      })
    }

    return NextResponse.json({ 
      success: true, 
      files: uploadedFiles,
      ...(errors.length > 0 && { warnings: errors })
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}