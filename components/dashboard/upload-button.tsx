'use client'

import { useRef, useState, useCallback } from 'react'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

interface UploadButtonProps {
  onSuccess: () => void
}

export function UploadButton({ onSuccess }: UploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusText, setStatusText] = useState('')
  const [dragging, setDragging] = useState(false)

  const upload = useCallback(
    async (file: File) => {
      setUploading(true)
      setProgress(0)
      setStatusText('Preparing…')

      try {
        // Step 1: Get signed upload URL from Shotstack
        const signRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'sign',
            filename: file.name,
            filesize: file.size,
          }),
        })

        if (!signRes.ok) {
          const err = await signRes.json()
          throw new Error(err.error ?? 'Failed to get upload URL')
        }

        const { uploadUrl, ingestId } = await signRes.json()

        // Step 2: PUT file directly to Shotstack S3 with XHR for real progress
        setStatusText('Uploading…')
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhr.open('PUT', uploadUrl)
          xhr.setRequestHeader('Content-Type', file.type || 'video/mp4')
          xhr.setRequestHeader('x-amz-acl', 'public-read')

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              setProgress(Math.round((e.loaded / e.total) * 90))
            }
          }

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve()
            else reject(new Error(`Upload failed: ${xhr.status}`))
          }
          xhr.onerror = () => reject(new Error('Upload network error'))

          xhr.send(file)
        })

        // Step 3: Confirm upload — create Directus video record
        // Server polls Shotstack for source URL, may take a few seconds
        setStatusText('Processing…')
        setProgress(95)

        const title = file.name.replace(/\.[^.]+$/, '')
        const confirmRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'confirm',
            title,
            filesize: file.size,
            ingestId,
          }),
        })

        if (confirmRes.ok) {
          setProgress(100)
          await new Promise((r) => setTimeout(r, 300))
          onSuccess()
        }
      } catch (err) {
        console.error('Upload failed:', err)
      } finally {
        setUploading(false)
        setProgress(0)
        setStatusText('')
      }
    },
    [onSuccess]
  )

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return
      upload(files[0])
    },
    [upload]
  )

  return (
    <div
      className={cn(
        'relative border-2 border-dashed rounded-xl p-4 transition-colors cursor-pointer',
        dragging
          ? 'border-brand-500 bg-brand-50'
          : 'border-border hover:border-brand-400 hover:bg-surface-raised'
      )}
      onClick={() => !uploading && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        handleFiles(e.dataTransfer.files)
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div className="flex items-center gap-3">
        {uploading ? (
          <Spinner size="sm" className="text-brand-500 shrink-0" />
        ) : (
          <svg
            className="w-5 h-5 text-brand-500 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
            />
          </svg>
        )}
        <span className="text-sm font-medium text-foreground">
          {uploading ? `${statusText} ${progress}%` : 'Upload video'}
        </span>
      </div>

      {uploading && (
        <div className="mt-2 h-1 rounded-full bg-surface-overlay overflow-hidden">
          <div
            className="h-full bg-brand-500 rounded-full transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  )
}
