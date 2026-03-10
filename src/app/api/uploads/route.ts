import {randomUUID} from 'crypto'

import {NextResponse} from 'next/server'

import {prisma} from '@/lib/db'
import {deleteSharedMedia, uploadSharedMedia} from '@/lib/pocketbase'
import {requireAdmin} from '@/utils/supabase/server'

export async function DELETE(request: Request) {
  try {
    await requireAdmin()

    const {searchParams} = new URL(request.url)
    const fileId = searchParams.get('id')

    if (!fileId) {
      return NextResponse.json({error: 'File ID is required'}, {status: 400})
    }

    const file = await prisma.uploadedFile.findUnique({
      where: {id: fileId},
    })

    if (!file) {
      return NextResponse.json({error: 'File not found'}, {status: 404})
    }

    if (file.storage_record_id) {
      await deleteSharedMedia(file.storage_record_id)
    }

    await prisma.uploadedFile.delete({
      where: {id: file.id},
    })

    return NextResponse.json({success: true})
  } catch (error) {
    console.error('Delete upload API error:', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Delete failed',
      },
      {status: 500},
    )
  }
}

function getExtension(fileName: string) {
  const pieces = fileName.split('.')

  return pieces.length > 1 ? pieces.at(-1) : ''
}

export async function GET(request: Request) {
  try {
    await requireAdmin()

    const {searchParams} = new URL(request.url)
    const bucket = searchParams.get('bucket') || 'images'
    const folder = searchParams.get('folder')

    const files = await prisma.uploadedFile.findMany({
      orderBy: {uploaded_at: 'desc'},
      where: {
        app_key: 'bekten-art',
        bucket_name: bucket,
        ...(folder
          ? {
              file_path: {
                startsWith: `${folder}/`,
              },
            }
          : {}),
      },
    })

    return NextResponse.json({
      files: files.map(file => ({
        bucket: file.bucket_name,
        id: file.id,
        name: file.name,
        path: file.file_path,
        size: file.file_size,
        type: file.file_type,
        uploaded_at: file.uploaded_at.toISOString(),
        url: file.public_url,
      })),
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to list files',
      },
      {status: 500},
    )
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin()

    const formData = await request.formData()
    const bucket = String(formData.get('bucket') || 'images')
    const folder = String(formData.get('folder') || 'gallery')
    const sourceUrl = String(formData.get('sourceUrl') || '')
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({error: 'File is required'}, {status: 400})
    }

    const extension = getExtension(file.name)
    const generatedName = extension
      ? `${Date.now()}-${randomUUID()}.${extension}`
      : `${Date.now()}-${randomUUID()}`
    const filePath = `${folder}/${generatedName}`

    const upload = await uploadSharedMedia({
      bucketName: bucket,
      file,
      filePath,
      folder,
      originalName: file.name,
      sourceUrl: sourceUrl || undefined,
    })

    const savedFile = await prisma.uploadedFile.create({
      data: {
        app_key: upload.app_key,
        bucket_name: upload.bucket_name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        folder,
        name: file.name,
        original_name: file.name,
        public_url: upload.public_url,
        source_url: sourceUrl || null,
        storage_collection: upload.storage_collection,
        storage_provider: 'pocketbase',
        storage_record_id: upload.storage_record_id,
        uploaded_at: new Date(),
      },
    })

    return NextResponse.json({
      file: {
        bucket: savedFile.bucket_name,
        id: savedFile.id,
        name: savedFile.name,
        path: savedFile.file_path,
        size: savedFile.file_size,
        type: savedFile.file_type,
        uploaded_at: savedFile.uploaded_at.toISOString(),
        url: savedFile.public_url,
      },
      success: true,
    })
  } catch (error) {
    console.error('Upload API error:', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Upload failed',
      },
      {status: 500},
    )
  }
}

export const dynamic = 'force-dynamic'
