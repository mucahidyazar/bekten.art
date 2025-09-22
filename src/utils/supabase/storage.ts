'use client'

import {createClient} from '@/utils/supabase/client'

export type FileUploadOptions = {
  bucket?: string
  folder?: string
  maxSizeInMB?: number
  allowedTypes?: string[]
  overwrite?: boolean
}

// File upload types
export type UploadedFile = {
  id: string
  name: string
  url: string
  size: number
  type: string
  uploaded_at: string
  bucket: string
  path: string
}

const DEFAULT_OPTIONS: Required<FileUploadOptions> = {
  bucket: 'images',
  folder: 'gallery',
  maxSizeInMB: 10,
  allowedTypes: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ],
  overwrite: false,
}

// Delete file
export const deleteFile = async (fileId: string): Promise<void> => {
  const supabase = createClient()

  // Get file info first
  const {data: fileInfo, error: fetchError} = await supabase
    .from('uploaded_files')
    .select('file_path, bucket_name')
    .eq('id', fileId)
    .single()

  if (fetchError) {
    throw new Error(`File not found: ${fetchError.message}`)
  }

  // Delete from storage
  const {error: storageError} = await supabase.storage
    .from(fileInfo.bucket_name)
    .remove([fileInfo.file_path])

  if (storageError) {
    throw new Error(`Storage deletion failed: ${storageError.message}`)
  }

  // Delete from database
  const {error: dbError} = await supabase
    .from('uploaded_files')
    .delete()
    .eq('id', fileId)

  if (dbError) {
    throw new Error(`Database deletion failed: ${dbError.message}`)
  }
}

// Generate thumbnail URL (if using Supabase image transformations)
export const getThumbnailUrl = (
  originalUrl: string,
  width: number = 300,
  height: number = 300,
): string => {
  if (originalUrl.includes('supabase')) {
    return `${originalUrl}?width=${width}&height=${height}&resize=cover&quality=80`
  }

  return originalUrl
}

// Get uploaded files from database
export const getUploadedFiles = async (
  bucket: string = 'images',
  folder?: string,
): Promise<UploadedFile[]> => {
  const supabase = createClient()

  let query = supabase
    .from('uploaded_files')
    .select('*')
    .eq('bucket_name', bucket)
    .order('uploaded_at', {ascending: false})

  if (folder) {
    query = query.like('file_path', `${folder}%`)
  }

  const {data, error} = await query

  if (error) {
    throw new Error(`Failed to fetch files: ${error.message}`)
  }

  return data.map(file => ({
    id: file.id,
    name: file.name,
    url: file.public_url,
    size: file.file_size,
    type: file.file_type,
    uploaded_at: file.uploaded_at,
    bucket: file.bucket_name,
    path: file.file_path,
  }))
}

// Upload single file
export const uploadFile = async (
  file: File,
  options: FileUploadOptions = {},
): Promise<UploadedFile> => {
  const supabase = createClient()
  const opts = {...DEFAULT_OPTIONS, ...options}

  // Validate file size
  if (file.size > opts.maxSizeInMB * 1024 * 1024) {
    throw new Error(`File size must be less than ${opts.maxSizeInMB}MB`)
  }

  // Validate file type
  if (!opts.allowedTypes.includes(file.type)) {
    throw new Error(
      `File type ${file.type} is not allowed. Allowed types: ${opts.allowedTypes.join(', ')}`,
    )
  }

  // Generate unique filename
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
  const filePath = `${opts.folder}/${fileName}`

  try {
    // Upload to Supabase Storage
    const {error} = await supabase.storage
      .from(opts.bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: opts.overwrite,
      })

    if (error) {
      throw new Error(`Upload failed: ${error.message}`)
    }

    // Get public URL
    const {
      data: {publicUrl},
    } = supabase.storage.from(opts.bucket).getPublicUrl(filePath)

    // Save file metadata to database
    const fileMetadata = {
      name: file.name,
      original_name: file.name,
      file_path: filePath,
      file_size: file.size,
      file_type: file.type,
      bucket_name: opts.bucket,
      public_url: publicUrl,
      uploaded_at: new Date().toISOString(),
    }

    const {data: savedFile, error: dbError} = await supabase
      .from('uploaded_files')
      .insert(fileMetadata)
      .select()
      .single()

    if (dbError) {
      // If DB save fails, try to delete the uploaded file
      await supabase.storage.from(opts.bucket).remove([filePath])
      throw new Error(`Database save failed: ${dbError.message}`)
    }

    return {
      id: savedFile.id,
      name: savedFile.name,
      url: publicUrl,
      size: file.size,
      type: file.type,
      uploaded_at: savedFile.uploaded_at,
      bucket: opts.bucket,
      path: filePath,
    }
  } catch (error) {
    console.error('Upload error:', error)
    throw error
  }
}

// Upload multiple files
export const uploadFiles = async (
  files: File[],
  options: FileUploadOptions = {},
): Promise<UploadedFile[]> => {
  const uploadPromises = files.map(file => uploadFile(file, options))

  return Promise.all(uploadPromises)
}

// Validate image URL
export const validateImageUrl = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, {method: 'HEAD'})
    const contentType = response.headers.get('content-type')

    return response.ok && contentType?.startsWith('image/') === true
  } catch {
    return false
  }
}
