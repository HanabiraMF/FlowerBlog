import { useRef, useState, type DragEvent } from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { api, errorMessage } from '../api'
import { useToast } from '../context/ToastContext'

interface Props {
  value: string | null | undefined
  onChange: (url: string | null) => void
  label?: string
  hint?: string
  variant?: 'cover' | 'avatar'
}

export function ImageUploader({
  value,
  onChange,
  label = '封面图片',
  hint = '建议比例 16:10，支持 JPG / PNG / WebP，最大 5MB',
  variant = 'cover',
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const { toast } = useToast()

  async function handleFile(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast('请选择图片文件', 'error')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast('图片不能超过 5MB', 'error')
      return
    }
    setUploading(true)
    try {
      const result = await api.upload(file)
      onChange(result.url)
      toast('图片上传成功')
    } catch (error) {
      toast(errorMessage(error), 'error')
    } finally {
      setUploading(false)
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    void handleFile(event.dataTransfer.files[0])
  }

  return (
    <div className={`image-upload image-upload--${variant}`}>
      {label && <span className="field__label">{label}</span>}
      <div
        className={`image-upload__drop ${dragging ? 'is-dragging' : ''} ${value ? 'has-image' : ''}`}
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click()
        }}
        aria-label={value ? '更换图片' : '上传图片'}
      >
        {value ? (
          <>
            <img src={value} alt="" className="image-upload__preview" />
            <div className="image-upload__overlay">
              <span>{uploading ? '上传中…' : '点击更换图片'}</span>
            </div>
            <button
              type="button"
              className="image-upload__remove"
              onClick={(event) => {
                event.stopPropagation()
                onChange(null)
              }}
              aria-label="移除图片"
            >
              <X size={15} />
            </button>
          </>
        ) : (
          <div className="image-upload__placeholder">
            {uploading ? (
              <Loader2 size={26} className="spin" />
            ) : (
              <span className="image-upload__icon">
                <ImagePlus size={26} />
              </span>
            )}
            <strong>{uploading ? '正在上传…' : '拖入或点击上传'}</strong>
            <span>{hint}</span>
          </div>
        )}
        {uploading && value && <span className="image-upload__loading" />}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        hidden
        onChange={(event) => {
          void handleFile(event.target.files?.[0])
          event.target.value = ''
        }}
      />
    </div>
  )
}
