import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Description as JsonIcon,
  TableChart as CsvIcon,
  Article as MarkdownIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api/v1';

type ExportFormat = 'json' | 'csv' | 'markdown';

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  selectedIds?: number[];  // 选中的记录ID，为空则导出全部
}

const getFormatOptions = (t: (key: string) => string) => [
  {
    value: 'csv' as ExportFormat,
    label: t('export.formats.csv'),
    description: t('export.formats.csvDesc'),
    icon: <CsvIcon />,
  },
  {
    value: 'json' as ExportFormat,
    label: t('export.formats.json'),
    description: t('export.formats.jsonDesc'),
    icon: <JsonIcon />,
  },
  {
    value: 'markdown' as ExportFormat,
    label: t('export.formats.markdown'),
    description: t('export.formats.markdownDesc'),
    icon: <MarkdownIcon />,
  },
];

const ExportDialog: React.FC<ExportDialogProps> = ({
  open,
  onClose,
  selectedIds = [],
}) => {
  const { t } = useTranslation();
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formatOptions = getFormatOptions(t);

  const handleExport = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      if (selectedIds.length > 0) {
        params.append('record_ids', selectedIds.join(','));
      }

      const response = await axios.get(
        `${API_BASE}/export/records/${format}?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob',
        }
      );

      // 从响应头获取文件名
      const contentDisposition = response.headers['content-disposition'];
      let filename = `export.${format}`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename\*=UTF-8''(.+)/);
        if (filenameMatch) {
          filename = decodeURIComponent(filenameMatch[1]);
        }
      }

      // 创建下载链接
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      onClose();
    } catch (err: any) {
      console.error('Export failed:', err);
      if (err.response?.status === 404) {
        setError(t('export.noRecords'));
      } else {
        setError(err.response?.data?.detail || t('export.exportFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontFamily: '"STKaiti", "KaiTi", "楷体", serif' }}>
        {t('export.title')}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {selectedIds.length > 0 ? (
              <>
                {t('export.selectedRecords')} <Chip label={selectedIds.length} size="small" color="primary" /> {t('export.records')}
              </>
            ) : (
              t('export.exportAll')
            )}
          </Typography>
        </Box>

        <FormControl component="fieldset" fullWidth>
          <FormLabel 
            component="legend" 
            sx={{ 
              mb: 2, 
              fontFamily: '"STKaiti", "KaiTi", "楷体", serif',
              color: '#5D4037',
            }}
          >
            {t('export.selectFormat')}
          </FormLabel>
          <RadioGroup
            value={format}
            onChange={(e) => setFormat(e.target.value as ExportFormat)}
          >
            {formatOptions.map((option) => (
              <Box
                key={option.value}
                sx={{
                  border: '1px solid',
                  borderColor: format === option.value ? 'primary.main' : '#E8DCC8',
                  borderRadius: 2,
                  p: 2,
                  mb: 1,
                  cursor: 'pointer',
                  backgroundColor: format === option.value ? 'rgba(93, 64, 55, 0.05)' : 'transparent',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: 'rgba(93, 64, 55, 0.02)',
                  },
                }}
                onClick={() => setFormat(option.value)}
              >
                <FormControlLabel
                  value={option.value}
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {option.icon}
                      <Box>
                        <Typography variant="subtitle2">{option.label}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.description}
                        </Typography>
                      </Box>
                    </Box>
                  }
                  sx={{ m: 0, width: '100%' }}
                />
              </Box>
            ))}
          </RadioGroup>
        </FormControl>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          {t('common.cancel')}
        </Button>
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : <DownloadIcon />}
          onClick={handleExport}
          disabled={loading}
          sx={{ fontFamily: '"STKaiti", "KaiTi", "楷体", serif' }}
        >
          {loading ? t('export.exporting') : t('export.startExport')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportDialog;
