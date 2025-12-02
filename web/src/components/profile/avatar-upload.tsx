'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Camera, Upload, X, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AvatarUploadProps {
  userId: string
  currentAvatarUrl?: string | null
  onUploadComplete?: (url: string) => void
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
}

const iconSizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
}

export function AvatarUpload({
  userId,
  currentAvatarUrl,
  onUploadComplete,
  size = 'md',
  className,
}: AvatarUploadProps) {
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setError('Please upload a JPEG, PNG, GIF, or WebP image')
      return
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      setError('Image must be less than 5MB')
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/${Date.now()}.${fileExt}`

      // Delete old avatar if exists
      if (avatarUrl) {
        const oldPath = avatarUrl.split('/').slice(-2).join('/')
        await supabase.storage.from('avatars').remove([oldPath])
      }

      // Upload new avatar
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw new Error(uploadError.message)
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path)

      const newAvatarUrl = urlData.publicUrl

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: newAvatarUrl })
        .eq('id', userId)

      if (updateError) {
        console.error('Profile update error:', updateError)
        throw new Error('Failed to update profile')
      }

      setAvatarUrl(newAvatarUrl)
      onUploadComplete?.(newAvatarUrl)

    } catch (err: any) {
      console.error('Avatar upload error:', err)
      setError(err.message || 'Failed to upload avatar')
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveAvatar = async () => {
    if (!avatarUrl) return

    setIsUploading(true)
    setError(null)

    try {
      // Extract path from URL
      const path = avatarUrl.split('/').slice(-2).join('/')

      // Delete from storage
      await supabase.storage.from('avatars').remove([path])

      // Update profile to remove avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', userId)

      if (updateError) {
        throw new Error('Failed to update profile')
      }

      setAvatarUrl(null)
      onUploadComplete?.('')

    } catch (err: any) {
      console.error('Remove avatar error:', err)
      setError(err.message || 'Failed to remove avatar')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      {/* Avatar Display */}
      <div className="relative group">
        <div
          className={cn(
            'rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-gray-200',
            sizeClasses[size]
          )}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <User className={cn('text-gray-400', iconSizeClasses[size])} />
          )}

          {/* Loading Overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
              <Spinner size="sm" className="text-white" />
            </div>
          )}
        </div>

        {/* Hover Overlay */}
        <button
          onClick={handleFileSelect}
          disabled={isUploading}
          className={cn(
            'absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer',
            isUploading && 'cursor-not-allowed'
          )}
        >
          <Camera className="w-6 h-6 text-white" />
        </button>

        {/* Remove Button */}
        {avatarUrl && !isUploading && (
          <button
            onClick={handleRemoveAvatar}
            className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-sm"
            title="Remove avatar"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Upload Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleFileSelect}
        disabled={isUploading}
        className="flex items-center gap-2"
      >
        {isUploading ? (
          <>
            <Spinner size="sm" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            {avatarUrl ? 'Change Photo' : 'Upload Photo'}
          </>
        )}
      </Button>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600 text-center">{error}</p>
      )}

      {/* Help Text */}
      <p className="text-xs text-gray-500 text-center">
        JPEG, PNG, GIF or WebP. Max 5MB.
      </p>
    </div>
  )
}
