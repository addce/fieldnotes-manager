import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Dialog,
  DialogContent,
  CircularProgress,
  Alert,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Tooltip,
  Paper,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  ZoomIn as ZoomInIcon,
  Close as CloseIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api/v1';

// 图片信息接口
export interface RecordImage {
  id: number;
  record_id: number;
  filename: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  description?: string;
  sort_order: number;
  created_at: string;
  url: string;
}

interface ImageUploadProps {
  recordId: number | null;  // 记录ID，创建模式时为null
  images: RecordImage[];
  onImagesChange: (images: RecordImage[]) => void;
  disabled?: boolean;  // 查看模式时禁用上传
  maxImages?: number;  // 最大图片数量
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  recordId,
  images,
  onImagesChange,
  disabled = false,
  maxImages = 10,
}) => {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<RecordImage | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // 获取图片完整URL
  const getImageUrl = (image: RecordImage): string => {
    return `${API_BASE}${image.url}`;
  };

  // 上传图片
  const uploadImage = async (file: File) => {
    if (!recordId) {
      setError(t('images.saveFirst'));
      return;
    }

    if (images.length >= maxImages) {
      setError(t('images.maxImages', { max: maxImages }));
      return;
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError(t('images.unsupportedFormat'));
      return;
    }

    // 验证文件大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(t('images.fileTooLarge'));
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        `${API_BASE}/records/${recordId}/images`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const progress = progressEvent.total
              ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
              : 0;
            setUploadProgress(progress);
          },
        }
      );

      // 添加新图片到列表
      onImagesChange([...images, response.data]);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err.response?.data?.detail || t('images.uploadFailed'));
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // 删除图片
  const deleteImage = async (imageId: number) => {
    if (!recordId) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE}/records/${recordId}/images/${imageId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // 从列表中移除
      onImagesChange(images.filter((img) => img.id !== imageId));
    } catch (err: any) {
      console.error('Delete failed:', err);
      setError(err.response?.data?.detail || t('images.deleteFailed'));
    }
  };

  // 处理文件选择
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => uploadImage(file));
    }
    // 清空input，允许重复选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 处理拖拽
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => {
        if (file.type.startsWith('image/')) {
          uploadImage(file);
        }
      });
    }
  }, [disabled, recordId, images]);

  return (
    <Box>
      {/* 错误提示 */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 上传区域 - 仅在非禁用模式显示 */}
      {!disabled && (
        <Paper
          variant="outlined"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          sx={{
            p: 3,
            mb: 2,
            textAlign: 'center',
            cursor: uploading ? 'default' : 'pointer',
            borderStyle: 'dashed',
            borderWidth: 2,
            borderColor: isDragOver ? 'primary.main' : '#D7CCC8',
            backgroundColor: isDragOver ? 'rgba(93, 64, 55, 0.05)' : '#FFFDF8',
            transition: 'all 0.2s',
            '&:hover': {
              borderColor: 'primary.main',
              backgroundColor: 'rgba(93, 64, 55, 0.02)',
            },
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg,image/webp"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />

          {uploading ? (
            <Box>
              <CircularProgress
                variant="determinate"
                value={uploadProgress}
                size={48}
                sx={{ color: 'primary.main' }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {t('images.uploading')} {uploadProgress}%
              </Typography>
            </Box>
          ) : (
            <Box>
              <UploadIcon sx={{ fontSize: 48, color: '#A1887F', mb: 1 }} />
              <Typography
                variant="body1"
                sx={{ fontFamily: '"STKaiti", "KaiTi", "楷体", serif', color: '#5D4037' }}
              >
                {t('images.uploadTitle')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('images.uploadHint')}
                {recordId ? ` (${images.length}/${maxImages})` : ''}
              </Typography>
              {!recordId && (
                <Typography variant="caption" color="warning.main" display="block" sx={{ mt: 1 }}>
                  {t('images.saveFirst')}
                </Typography>
              )}
            </Box>
          )}
        </Paper>
      )}

      {/* 图片列表 */}
      {images.length > 0 && (
        <Box>
          <Typography
            variant="subtitle2"
            sx={{ mb: 1, fontFamily: '"STKaiti", "KaiTi", "楷体", serif', color: '#5D4037' }}
          >
            <ImageIcon sx={{ fontSize: 18, mr: 0.5, verticalAlign: 'text-bottom' }} />
            {t('images.uploadedImages')} ({images.length})
          </Typography>
          <ImageList cols={4} gap={8} sx={{ mt: 0 }}>
            {images.map((image) => (
              <ImageListItem
                key={image.id}
                sx={{
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: '1px solid #E8DCC8',
                  '&:hover .image-actions': {
                    opacity: 1,
                  },
                }}
              >
                <img
                  src={getImageUrl(image)}
                  alt={image.original_filename}
                  loading="lazy"
                  style={{
                    height: 120,
                    objectFit: 'cover',
                    cursor: 'pointer',
                  }}
                  onClick={() => setPreviewImage(image)}
                />
                <ImageListItemBar
                  className="image-actions"
                  sx={{
                    background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)',
                    opacity: 0,
                    transition: 'opacity 0.2s',
                  }}
                  title={
                    <Typography variant="caption" noWrap>
                      {image.original_filename}
                    </Typography>
                  }
                  subtitle={formatFileSize(image.file_size)}
                  actionIcon={
                    <Box>
                      <Tooltip title={t('images.zoomIn')}>
                        <IconButton
                          size="small"
                          sx={{ color: 'white' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewImage(image);
                          }}
                        >
                          <ZoomInIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {!disabled && (
                        <Tooltip title={t('common.delete')}>
                          <IconButton
                            size="small"
                            sx={{ color: 'white' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteImage(image.id);
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  }
                />
              </ImageListItem>
            ))}
          </ImageList>
        </Box>
      )}

      {/* 无图片提示 - 仅在查看模式显示 */}
      {disabled && images.length === 0 && (
        <Box
          sx={{
            p: 3,
            textAlign: 'center',
            backgroundColor: '#FFFDF8',
            borderRadius: 2,
            border: '1px dashed #E8DCC8',
          }}
        >
          <ImageIcon sx={{ fontSize: 36, color: '#D7CCC8', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            {t('images.noImages')}
          </Typography>
        </Box>
      )}

      {/* 图片预览对话框 */}
      <Dialog
        open={!!previewImage}
        onClose={() => setPreviewImage(null)}
        maxWidth="lg"
        PaperProps={{
          sx: {
            backgroundColor: 'transparent',
            boxShadow: 'none',
          },
        }}
      >
        <DialogContent sx={{ p: 0, position: 'relative' }}>
          <IconButton
            onClick={() => setPreviewImage(null)}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              backgroundColor: 'rgba(0,0,0,0.5)',
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(0,0,0,0.7)',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
          {previewImage && (
            <img
              src={getImageUrl(previewImage)}
              alt={previewImage.original_filename}
              style={{
                maxWidth: '90vw',
                maxHeight: '90vh',
                objectFit: 'contain',
                borderRadius: 8,
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ImageUpload;
