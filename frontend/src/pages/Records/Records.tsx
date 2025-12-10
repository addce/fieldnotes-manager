import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  Snackbar,
  CircularProgress,
  InputAdornment,
  TablePagination,
  Autocomplete,
  Checkbox,
  ListItemText,
  Collapse,
  Divider,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  AddCircleOutline as AddIcon,
  BorderColorOutlined as EditIcon,
  DeleteOutlined as DeleteIcon,
  VisibilityOutlined as ViewIcon,
  SearchOutlined as SearchIcon,
  CloseOutlined as CloseIcon,
  CheckBoxOutlineBlank as CheckBoxBlankIcon,
  CheckBox as CheckBoxIcon,
  PlaceOutlined as LocationIcon,
  LocalOfferOutlined as TagIcon,
  PersonOutlined as PersonIcon,
  FilterListOutlined as FilterIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ClearAll as ClearAllIcon,
  CloudUpload as UploadIcon,
  Image as ImageIcon,
  ZoomIn as ZoomInIcon,
  FileDownloadOutlined as ExportIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { ImageUpload } from '../../components/ImageUpload';
import { ExportDialog } from '../../components/ExportDialog';

// ============ 类型定义 ============
interface Participant {
  id: number;
  name_or_code: string;
  gender?: string;
  occupation?: string;
}

interface Field {
  id: number;
  region: string;
  location: string;
  sub_field?: string;
}

// 标签分类信息
interface TagCategory {
  id: number;
  name: string;
  type: string;
  color?: string;
}

// 标签信息
interface Tag {
  id: number;
  name: string;
  description?: string;
  category_id: number;
  category?: TagCategory;
  usage_count: number;
}

interface Record {
  id: number;
  title: string;
  type: 'field_note' | 'interview' | 'observation' | 'other';
  record_date: string;
  time_range?: string;
  duration?: number;
  field_id?: number;
  specific_location?: string;
  content: any;
  status: 'draft' | 'completed' | 'archived';
  version: number;
  created_by: number;
  created_at: string;
  updated_at: string;
  field?: Field;
  participants: Participant[];
  tags?: { id: number; name: string; color?: string }[];
}

// 图片信息
interface RecordImage {
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

// ============ 常量 ============
const TYPE_OPTIONS_CONFIG = [
  { value: 'field_note', labelKey: 'records.types.field_note', color: 'primary' },
  { value: 'interview', labelKey: 'records.types.interview', color: 'secondary' },
  { value: 'observation', labelKey: 'records.types.observation', color: 'info' },
  { value: 'other', labelKey: 'records.types.other', color: 'default' },
];

const STATUS_OPTIONS_CONFIG = [
  { value: 'draft', labelKey: 'records.statuses.draft', color: 'default' },
  { value: 'completed', labelKey: 'records.statuses.completed', color: 'success' },
  { value: 'archived', labelKey: 'records.statuses.archived', color: 'warning' },
];

const API_BASE = 'http://localhost:8000/api/v1';

const Records: React.FC = () => {
  const { t } = useTranslation();

  // Generate translated options
  const TYPE_OPTIONS = TYPE_OPTIONS_CONFIG.map(opt => ({
    ...opt,
    label: t(opt.labelKey),
  }));

  const STATUS_OPTIONS = STATUS_OPTIONS_CONFIG.map(opt => ({
    ...opt,
    label: t(opt.labelKey),
  }));
  // ============ 状态 ============
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');

  // 关联数据列表状态
  const [allParticipants, setAllParticipants] = useState<Participant[]>([]);
  const [allFields, setAllFields] = useState<Field[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [loadingRelatedData, setLoadingRelatedData] = useState(false);

  // 对话框状态
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>('create');
  const [currentRecord, setCurrentRecord] = useState<Record | null>(null);

  // 选择器状态
  const [selectedParticipants, setSelectedParticipants] = useState<Participant[]>([]);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);

  // 表单状态
  const [formData, setFormData] = useState<{
    title: string;
    type: 'field_note' | 'interview' | 'observation' | 'other';
    record_date: Date;
    time_range: string;
    duration: number;
    specific_location: string;
    content: { description: string; reflection: string; notes: string };
    status: 'draft' | 'completed' | 'archived';
  }>({
    title: '',
    type: 'field_note',
    record_date: new Date(),
    time_range: '',
    duration: 0,
    specific_location: '',
    content: { description: '', reflection: '', notes: '' },
    status: 'draft',
  });

  // 提示消息
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // 删除确认
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });

  // 图片状态
  const [recordImages, setRecordImages] = useState<RecordImage[]>([]);

  // 导出对话框状态
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  // ============ 筛选器状态 ============
  const [filterExpanded, setFilterExpanded] = useState(false);
  const [filterTypes, setFilterTypes] = useState<string[]>([]);
  const [filterStatuses, setFilterStatuses] = useState<string[]>([]);
  const [filterStartDate, setFilterStartDate] = useState<Date | null>(null);
  const [filterEndDate, setFilterEndDate] = useState<Date | null>(null);
  const [filterParticipants, setFilterParticipants] = useState<Participant[]>([]);
  const [filterField, setFilterField] = useState<Field | null>(null);
  const [filterTags, setFilterTags] = useState<Tag[]>([]);

  // ============ 获取记录列表（支持筛选参数） ============
  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        skip: String(page * rowsPerPage),
        limit: String(rowsPerPage),
      });

      // 关键词搜索
      if (search) params.append('search', search);

      // 类型筛选（后端只支持单个类型，如果选了多个则取第一个）
      if (filterTypes.length === 1) {
        params.append('type', filterTypes[0]);
      }

      // 状态筛选（后端只支持单个状态，如果选了多个则取第一个）
      if (filterStatuses.length === 1) {
        params.append('status', filterStatuses[0]);
      }

      // 日期范围筛选
      if (filterStartDate) {
        params.append('start_date', filterStartDate.toISOString());
      }
      if (filterEndDate) {
        // 设置为当天结束时间
        const endOfDay = new Date(filterEndDate);
        endOfDay.setHours(23, 59, 59, 999);
        params.append('end_date', endOfDay.toISOString());
      }

      // 场域筛选
      if (filterField) {
        params.append('field_id', String(filterField.id));
      }

      // 参与者筛选
      if (filterParticipants.length > 0) {
        params.append('participant_ids', filterParticipants.map(p => p.id).join(','));
      }

      // 标签筛选
      if (filterTags.length > 0) {
        params.append('tag_ids', filterTags.map(t => t.id).join(','));
      }

      const response = await axios.get(`${API_BASE}/records/?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      let filteredItems = response.data.items;

      // 前端额外过滤：多选类型（如果选了多个类型）
      if (filterTypes.length > 1) {
        filteredItems = filteredItems.filter((r: Record) => filterTypes.includes(r.type));
      }

      // 前端额外过滤：多选状态（如果选了多个状态）
      if (filterStatuses.length > 1) {
        filteredItems = filteredItems.filter((r: Record) => filterStatuses.includes(r.status));
      }

      setRecords(filteredItems);
      setTotal(filterTypes.length > 1 || filterStatuses.length > 1
        ? filteredItems.length
        : response.data.total);
    } catch (error) {
      console.error('获取记录失败:', error);
      setSnackbar({ open: true, message: t('records.fetchFailed'), severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, filterTypes, filterStatuses, filterStartDate, filterEndDate, filterField, filterParticipants, filterTags]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // ============ 获取关联数据（参与者、场域、标签） ============
  const fetchRelatedData = useCallback(async () => {
    // 如果已加载过，则不再重复加载
    if (allParticipants.length > 0 && allFields.length > 0 && allTags.length > 0) {
      return;
    }
    setLoadingRelatedData(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // 并行获取所有关联数据
      const [participantsRes, fieldsRes, tagsRes] = await Promise.all([
        axios.get(`${API_BASE}/participants/?limit=1000`, { headers }),
        axios.get(`${API_BASE}/fields/?limit=1000`, { headers }),
        axios.get(`${API_BASE}/tags/?limit=1000`, { headers }),
      ]);

      setAllParticipants(participantsRes.data.items || []);
      setAllFields(fieldsRes.data.items || []);
      setAllTags(tagsRes.data.items || []);
    } catch (error) {
      console.error('获取关联数据失败:', error);
    } finally {
      setLoadingRelatedData(false);
    }
  }, []);

  // 当对话框打开时获取关联数据
  useEffect(() => {
    if (openDialog && (dialogMode === 'create' || dialogMode === 'edit')) {
      fetchRelatedData();
    }
  }, [openDialog, dialogMode, fetchRelatedData]);

  // 当筛选面板展开时获取关联数据
  useEffect(() => {
    if (filterExpanded) {
      fetchRelatedData();
    }
  }, [filterExpanded, fetchRelatedData]);

  // ============ 筛选相关处理函数 ============

  // 检查是否有激活的筛选条件
  const hasActiveFilters = filterTypes.length > 0 || filterStatuses.length > 0 ||
    filterStartDate !== null || filterEndDate !== null ||
    filterParticipants.length > 0 || filterField !== null || filterTags.length > 0;

  // 清除所有筛选条件
  const handleClearAllFilters = () => {
    setFilterTypes([]);
    setFilterStatuses([]);
    setFilterStartDate(null);
    setFilterEndDate(null);
    setFilterParticipants([]);
    setFilterField(null);
    setFilterTags([]);
    setPage(0); // 重置到第一页
  };

  // 获取激活筛选条件的显示信息
  const getActiveFilterChips = () => {
    const chips: { key: string; label: string; onDelete: () => void }[] = [];

    // 类型筛选
    filterTypes.forEach(type => {
      const typeInfo = TYPE_OPTIONS.find(t => t.value === type);
      chips.push({
        key: `type-${type}`,
        label: `${t('records.filterType')}: ${typeInfo?.label || type}`,
        onDelete: () => setFilterTypes(filterTypes.filter(t => t !== type)),
      });
    });

    // 状态筛选
    filterStatuses.forEach(status => {
      const statusInfo = STATUS_OPTIONS.find(s => s.value === status);
      chips.push({
        key: `status-${status}`,
        label: `${t('records.filterStatus')}: ${statusInfo?.label || status}`,
        onDelete: () => setFilterStatuses(filterStatuses.filter(s => s !== status)),
      });
    });

    // 日期范围
    if (filterStartDate) {
      chips.push({
        key: 'startDate',
        label: `${t('records.filterStart')}: ${filterStartDate.toLocaleDateString()}`,
        onDelete: () => setFilterStartDate(null),
      });
    }
    if (filterEndDate) {
      chips.push({
        key: 'endDate',
        label: `${t('records.filterEnd')}: ${filterEndDate.toLocaleDateString()}`,
        onDelete: () => setFilterEndDate(null),
      });
    }

    // 场域
    if (filterField) {
      chips.push({
        key: 'field',
        label: `${t('records.filterField')}: ${filterField.location}`,
        onDelete: () => setFilterField(null),
      });
    }

    // 参与者
    filterParticipants.forEach(p => {
      chips.push({
        key: `participant-${p.id}`,
        label: `${t('records.filterParticipant')}: ${p.name_or_code}`,
        onDelete: () => setFilterParticipants(filterParticipants.filter(fp => fp.id !== p.id)),
      });
    });

    // 标签
    filterTags.forEach(tag => {
      chips.push({
        key: `tag-${tag.id}`,
        label: `${t('records.filterTag')}: ${tag.name}`,
        onDelete: () => setFilterTags(filterTags.filter(t => t.id !== tag.id)),
      });
    });

    return chips;
  };

  // ============ 处理函数 ============
  const handleOpenCreate = () => {
    setDialogMode('create');
    setCurrentRecord(null);
    setFormData({
      title: '',
      type: 'field_note',
      record_date: new Date(),
      time_range: '',
      duration: 0,
      specific_location: '',
      content: { description: '', reflection: '', notes: '' },
      status: 'draft',
    });
    // 重置选择器状态
    setSelectedParticipants([]);
    setSelectedField(null);
    setSelectedTags([]);
    setRecordImages([]);
    setOpenDialog(true);
  };

  // 获取记录图片
  const fetchRecordImages = async (recordId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/records/${recordId}/images`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecordImages(response.data.items || []);
    } catch (error) {
      console.error('获取图片失败:', error);
      setRecordImages([]);
    }
  };

  const handleOpenEdit = async (record: Record) => {
    setDialogMode('edit');
    setCurrentRecord(record);
    setFormData({
      title: record.title,
      type: record.type,
      record_date: new Date(record.record_date),
      time_range: record.time_range || '',
      duration: record.duration || 0,
      specific_location: record.specific_location || '',
      content: record.content || { description: '', reflection: '', notes: '' },
      status: record.status,
    });

    // 获取完整记录详情（包含标签信息）
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/records/${record.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fullRecord = response.data;

      // 设置已关联的参与者
      if (fullRecord.participants && fullRecord.participants.length > 0) {
        setSelectedParticipants(fullRecord.participants);
      } else {
        setSelectedParticipants([]);
      }

      // 设置已关联的场域
      if (fullRecord.field) {
        setSelectedField(fullRecord.field);
      } else {
        setSelectedField(null);
      }

      // 设置已关联的标签
      if (fullRecord.tags && fullRecord.tags.length > 0) {
        // 需要将简化的标签信息转换为完整格式
        setSelectedTags(fullRecord.tags.map((t: any) => ({
          id: t.id,
          name: t.name,
          description: '',
          category_id: 0,
          category: { id: 0, name: '', type: '', color: t.color },
          usage_count: 0,
        })));
      } else {
        setSelectedTags([]);
      }

      // 获取记录图片
      await fetchRecordImages(record.id);
    } catch (error) {
      console.error('获取记录详情失败:', error);
      // 即使详情获取失败，也重置选择状态
      setSelectedParticipants([]);
      setSelectedField(null);
      setSelectedTags([]);
      setRecordImages([]);
    }

    setOpenDialog(true);
  };

  const handleOpenView = async (record: Record) => {
    setDialogMode('view');
    setCurrentRecord(record);

    // 获取完整记录详情（包含标签信息）
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/records/${record.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrentRecord(response.data);

      // 获取记录图片
      await fetchRecordImages(record.id);
    } catch (error) {
      console.error('获取记录详情失败:', error);
      setRecordImages([]);
    }

    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentRecord(null);
    // 重置选择器状态
    setSelectedParticipants([]);
    setSelectedField(null);
    setSelectedTags([]);
    setRecordImages([]);
  };


  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...formData,
        record_date: formData.record_date.toISOString(),
        field_id: selectedField?.id || null,
        participant_ids: selectedParticipants.map(p => p.id),
        tag_ids: selectedTags.map(t => t.id),
      };

      if (dialogMode === 'create') {
        await axios.post(`${API_BASE}/records/`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSnackbar({ open: true, message: t('records.createSuccess'), severity: 'success' });
      } else if (dialogMode === 'edit' && currentRecord) {
        await axios.put(`${API_BASE}/records/${currentRecord.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSnackbar({ open: true, message: t('records.updateSuccess'), severity: 'success' });
      }

      handleCloseDialog();
      fetchRecords();
    } catch (error: any) {
      console.error('保存失败:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || t('records.saveFailed'),
        severity: 'error'
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.id) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE}/records/${deleteConfirm.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSnackbar({ open: true, message: t('records.deleteSuccess'), severity: 'success' });
      setDeleteConfirm({ open: false, id: null });
      fetchRecords();
    } catch (error: any) {
      console.error('删除失败:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || t('records.deleteFailed'),
        severity: 'error'
      });
    }
  };

  // ============ 辅助函数 ============
  const getTypeLabel = (type: string) => TYPE_OPTIONS.find(t => t.value === type)?.label || type;
  const getTypeColor = (type: string) => TYPE_OPTIONS.find(t => t.value === type)?.color || 'default';
  const getStatusLabel = (status: string) => STATUS_OPTIONS.find(s => s.value === status)?.label || status;
  const getStatusColor = (status: string) => STATUS_OPTIONS.find(s => s.value === status)?.color || 'default';

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getFieldDisplay = (record: Record) => {
    if (record.field) {
      return `${record.field.region} - ${record.field.location}`;
    }
    return record.specific_location || '-';
  };

  // ============ 渲染 ============
  return (
    <Box>
      {/* 页面标题和操作 */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ fontFamily: '"STKaiti", "KaiTi", "楷体", serif' }}>
          ▸ {t('records.title')}
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={() => setExportDialogOpen(true)}
            sx={{ fontFamily: '"STKaiti", "KaiTi", "楷体", serif' }}
          >
            {t('records.exportData')}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
            sx={{ fontFamily: '"STKaiti", "KaiTi", "楷体", serif' }}
          >
            {t('records.newRecord')}
          </Button>
        </Box>
      </Box>

      {/* 搜索栏和筛选面板 */}
      <Paper sx={{ p: 2, mb: 3, backgroundColor: '#FFFDF8' }}>
        {/* 搜索框和筛选按钮 */}
        <Box display="flex" gap={2} alignItems="center">
          <TextField
            fullWidth
            placeholder={t('records.searchPlaceholder')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0); // 搜索时重置页码
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            size="small"
          />
          <Button
            variant={filterExpanded ? 'contained' : 'outlined'}
            startIcon={<FilterIcon />}
            endIcon={filterExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            onClick={() => setFilterExpanded(!filterExpanded)}
            sx={{
              whiteSpace: 'nowrap',
              minWidth: 120,
              fontFamily: '"STKaiti", "KaiTi", "楷体", serif',
            }}
          >
            {filterExpanded ? t('records.collapseFilter') : t('records.expandFilter')}
          </Button>
          {hasActiveFilters && (
            <Tooltip title={t('records.clearAllFilters')}>
              <IconButton onClick={handleClearAllFilters} color="warning">
                <ClearAllIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* 激活的筛选条件显示 */}
        {hasActiveFilters && (
          <Box mt={2} display="flex" flexWrap="wrap" gap={1} alignItems="center">
            <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
              {t('records.currentFilter')}:
            </Typography>
            {getActiveFilterChips().map(chip => (
              <Chip
                key={chip.key}
                label={chip.label}
                size="small"
                onDelete={chip.onDelete}
                sx={{
                  backgroundColor: '#E8DCC8',
                  '&:hover': { backgroundColor: '#DDD0BC' },
                }}
              />
            ))}
          </Box>
        )}

        {/* 可折叠的筛选面板 */}
        <Collapse in={filterExpanded}>
          <Divider sx={{ my: 2, borderStyle: 'dashed' }} />
          <Grid container spacing={2}>
            {/* 记录类型多选 */}
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Autocomplete
                multiple
                options={TYPE_OPTIONS}
                value={TYPE_OPTIONS.filter(opt => filterTypes.includes(opt.value))}
                onChange={(_, newValue) => {
                  setFilterTypes(newValue.map(v => v.value));
                  setPage(0);
                }}
                getOptionLabel={(option) => option.label}
                disableCloseOnSelect
                renderInput={(params) => (
                  <TextField {...params} label={t('records.recordType')} placeholder={t('records.selectType')} size="small" />
                )}
                renderOption={(props, option, { selected }) => {
                  const { key, ...rest } = props;
                  return (
                    <li key={key} {...rest}>
                      <Checkbox
                        icon={<CheckBoxBlankIcon fontSize="small" />}
                        checkedIcon={<CheckBoxIcon fontSize="small" />}
                        style={{ marginRight: 8 }}
                        checked={selected}
                      />
                      <Chip label={option.label} size="small" color={option.color as any} sx={{ ml: 1 }} />
                    </li>
                  );
                }}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => {
                    const { key, ...chipProps } = getTagProps({ index });
                    return (
                      <Chip
                        key={key}
                        label={option.label}
                        size="small"
                        color={option.color as any}
                        {...chipProps}
                      />
                    );
                  })
                }
              />
            </Grid>

            {/* 记录状态多选 */}
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Autocomplete
                multiple
                options={STATUS_OPTIONS}
                value={STATUS_OPTIONS.filter(opt => filterStatuses.includes(opt.value))}
                onChange={(_, newValue) => {
                  setFilterStatuses(newValue.map(v => v.value));
                  setPage(0);
                }}
                getOptionLabel={(option) => option.label}
                disableCloseOnSelect
                renderInput={(params) => (
                  <TextField {...params} label={t('records.recordStatus')} placeholder={t('records.selectStatus')} size="small" />
                )}
                renderOption={(props, option, { selected }) => {
                  const { key, ...rest } = props;
                  return (
                    <li key={key} {...rest}>
                      <Checkbox
                        icon={<CheckBoxBlankIcon fontSize="small" />}
                        checkedIcon={<CheckBoxIcon fontSize="small" />}
                        style={{ marginRight: 8 }}
                        checked={selected}
                      />
                      {option.label}
                    </li>
                  );
                }}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => {
                    const { key, ...chipProps } = getTagProps({ index });
                    return (
                      <Chip
                        key={key}
                        label={option.label}
                        size="small"
                        variant="outlined"
                        {...chipProps}
                      />
                    );
                  })
                }
              />
            </Grid>

            {/* 日期范围 */}
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Box display="flex" gap={1}>
                <DatePicker
                  label={t('records.startDate')}
                  value={filterStartDate}
                  onChange={(newValue) => {
                    setFilterStartDate(newValue);
                    setPage(0);
                  }}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
                <DatePicker
                  label={t('records.endDate')}
                  value={filterEndDate}
                  onChange={(newValue) => {
                    setFilterEndDate(newValue);
                    setPage(0);
                  }}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Box>
            </Grid>

            {/* 场域选择器 */}
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Autocomplete
                options={allFields}
                value={filterField}
                onChange={(_, newValue) => {
                  setFilterField(newValue);
                  setPage(0);
                }}
                getOptionLabel={(option) => {
                  const parts = [option.region, option.location];
                  if (option.sub_field) parts.push(option.sub_field);
                  return parts.join(' - ');
                }}
                groupBy={(option) => option.region}
                loading={loadingRelatedData}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('records.field')}
                    placeholder={t('records.selectField')}
                    size="small"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <LocationIcon sx={{ color: 'text.secondary', fontSize: 18, ml: 0.5 }} />
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                noOptionsText={t('records.noFieldData')}
              />
            </Grid>

            {/* 参与者多选器 */}
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Autocomplete
                multiple
                options={allParticipants}
                value={filterParticipants}
                onChange={(_, newValue) => {
                  setFilterParticipants(newValue);
                  setPage(0);
                }}
                getOptionLabel={(option) => option.name_or_code}
                loading={loadingRelatedData}
                disableCloseOnSelect
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('records.participants')}
                    placeholder={filterParticipants.length === 0 ? t('records.selectParticipants') : ""}
                    size="small"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <PersonIcon sx={{ color: 'text.secondary', fontSize: 18, ml: 0.5 }} />
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option, { selected }) => {
                  const { key, ...rest } = props;
                  return (
                    <li key={key} {...rest}>
                      <Checkbox
                        icon={<CheckBoxBlankIcon fontSize="small" />}
                        checkedIcon={<CheckBoxIcon fontSize="small" />}
                        style={{ marginRight: 8 }}
                        checked={selected}
                      />
                      {option.name_or_code}
                    </li>
                  );
                }}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => {
                    const { key, ...chipProps } = getTagProps({ index });
                    return (
                      <Chip
                        key={key}
                        label={option.name_or_code}
                        size="small"
                        {...chipProps}
                      />
                    );
                  })
                }
                isOptionEqualToValue={(option, value) => option.id === value.id}
                noOptionsText={t('records.noParticipantData')}
              />
            </Grid>

            {/* 标签多选器 */}
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Autocomplete
                multiple
                options={allTags}
                value={filterTags}
                onChange={(_, newValue) => {
                  setFilterTags(newValue);
                  setPage(0);
                }}
                getOptionLabel={(option) => option.name}
                groupBy={(option) => option.category?.name || t('records.uncategorized')}
                loading={loadingRelatedData}
                disableCloseOnSelect
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('records.tags')}
                    placeholder={filterTags.length === 0 ? t('records.selectTags') : ""}
                    size="small"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <TagIcon sx={{ color: 'text.secondary', fontSize: 18, ml: 0.5 }} />
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option, { selected }) => {
                  const { key, ...rest } = props;
                  return (
                    <li key={key} {...rest}>
                      <Checkbox
                        icon={<CheckBoxBlankIcon fontSize="small" />}
                        checkedIcon={<CheckBoxIcon fontSize="small" />}
                        style={{ marginRight: 8 }}
                        checked={selected}
                      />
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          backgroundColor: option.category?.color || '#E8DCC8',
                          mr: 1,
                        }}
                      />
                      {option.name}
                    </li>
                  );
                }}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => {
                    const { key, ...chipProps } = getTagProps({ index });
                    return (
                      <Chip
                        key={key}
                        label={option.name}
                        size="small"
                        sx={{
                          backgroundColor: option.category?.color || '#E8DCC8',
                          color: option.category?.color ? '#fff' : 'inherit',
                        }}
                        {...chipProps}
                      />
                    );
                  })
                }
                isOptionEqualToValue={(option, value) => option.id === value.id}
                noOptionsText={t('records.noTagData')}
              />
            </Grid>
          </Grid>

          {/* 筛选操作按钮 */}
          <Box mt={2} display="flex" justifyContent="flex-end" gap={1}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleClearAllFilters}
              disabled={!hasActiveFilters}
              sx={{ fontFamily: '"STKaiti", "KaiTi", "楷体", serif' }}
            >
              {t('records.clearFilter')}
            </Button>
          </Box>
        </Collapse>
      </Paper>

      {/* 筛选结果提示 */}
      {hasActiveFilters && (
        <Box mb={2}>
          <Alert severity="info" sx={{ backgroundColor: '#FFFBF5', border: '1px dashed #E8DCC8' }}>
            {t('records.foundRecords', { count: total })}
          </Alert>
        </Box>
      )}

      {/* 记录列表 */}
      <TableContainer component={Paper}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'rgba(93, 64, 55, 0.05)' }}>
                  <TableCell sx={{ fontWeight: 600 }}>{t('records.recordTitle')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('common.type')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('common.date')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('common.status')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('records.participants')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('records.field')}/{t('records.specificLocation')}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>{t('common.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <Typography variant="body1" color="text.secondary">
                        {t('records.noRecordData')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map((record) => (
                    <TableRow key={record.id} hover>
                      <TableCell>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            cursor: 'pointer',
                            '&:hover': { color: 'primary.main' }
                          }}
                          onClick={() => handleOpenView(record)}
                        >
                          {record.title}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getTypeLabel(record.type)}
                          color={getTypeColor(record.type) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatDate(record.record_date)}</TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(record.status)}
                          color={getStatusColor(record.status) as any}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {record.participants.length > 0
                          ? record.participants.map(p => p.name_or_code).join(', ')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                          {getFieldDisplay(record)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title={t('records.viewDetails')}>
                          <IconButton size="small" onClick={() => handleOpenView(record)}>
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('common.edit')}>
                          <IconButton size="small" onClick={() => handleOpenEdit(record)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('common.delete')}>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteConfirm({ open: true, id: record.id })}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              labelRowsPerPage={t('records.paginationLabel')}
              labelDisplayedRows={({ from, to, count }) => t('records.paginationDisplay', { from, to, count })}
            />
          </>
        )}
      </TableContainer>

      {/* 创建/编辑/查看对话框 */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '2px dashed #E8DCC8',
          fontFamily: '"STKaiti", "KaiTi", "楷体", serif',
        }}>
          {dialogMode === 'create' && `✎ ${t('records.newFieldRecord')}`}
          {dialogMode === 'edit' && `✎ ${t('records.editRecord')}`}
          {dialogMode === 'view' && `📖 ${t('records.recordDetails')}`}
          <IconButton onClick={handleCloseDialog} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {dialogMode === 'view' && currentRecord ? (
            // 查看模式
            <Box>
              <Typography variant="h5" gutterBottom sx={{ fontFamily: '"STKaiti", "KaiTi", "楷体", serif' }}>
                {currentRecord.title}
              </Typography>
              <Box display="flex" gap={2} mb={3}>
                <Chip label={getTypeLabel(currentRecord.type)} color={getTypeColor(currentRecord.type) as any} />
                <Chip label={getStatusLabel(currentRecord.status)} variant="outlined" />
                <Typography variant="body2" color="text.secondary">
                  {formatDate(currentRecord.record_date)}
                </Typography>
              </Box>

              {/* 关联场域信息 */}
              {currentRecord.field && (
                <Box mb={2}>
                  <Typography variant="subtitle2" color="text.secondary">
                    <LocationIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'text-bottom' }} />
                    {t('records.relatedField')}
                  </Typography>
                  <Typography>
                    {currentRecord.field.region} - {currentRecord.field.location}
                    {currentRecord.field.sub_field && ` - ${currentRecord.field.sub_field}`}
                  </Typography>
                </Box>
              )}

              {currentRecord.specific_location && (
                <Box mb={2}>
                  <Typography variant="subtitle2" color="text.secondary">{t('records.specificLocation')}</Typography>
                  <Typography>{currentRecord.specific_location}</Typography>
                </Box>
              )}

              {/* 关联参与者信息 */}
              {currentRecord.participants && currentRecord.participants.length > 0 && (
                <Box mb={2}>
                  <Typography variant="subtitle2" color="text.secondary">
                    <PersonIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'text-bottom' }} />
                    {t('records.relatedParticipants')}
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap" mt={0.5}>
                    {currentRecord.participants.map(p => (
                      <Chip key={p.id} label={p.name_or_code} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              )}

              {/* 关联标签信息 */}
              {currentRecord.tags && currentRecord.tags.length > 0 && (
                <Box mb={2}>
                  <Typography variant="subtitle2" color="text.secondary">
                    <TagIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'text-bottom' }} />
                    {t('records.relatedTags')}
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap" mt={0.5}>
                    {currentRecord.tags.map(tag => (
                      <Chip
                        key={tag.id}
                        label={tag.name}
                        size="small"
                        sx={{
                          backgroundColor: tag.color || '#E8DCC8',
                          color: tag.color ? '#fff' : 'inherit',
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              <Box mb={2}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>{t('records.recordContent')}</Typography>
                <Paper variant="outlined" sx={{ p: 2, backgroundColor: '#FFFBF5' }}>
                  {currentRecord.content?.description && (
                    <Box mb={2}>
                      <Typography variant="subtitle2">{t('records.contentDescription')}</Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {currentRecord.content.description}
                      </Typography>
                    </Box>
                  )}
                  {currentRecord.content?.reflection && (
                    <Box mb={2}>
                      <Typography variant="subtitle2">{t('records.reflection')}</Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {currentRecord.content.reflection}
                      </Typography>
                    </Box>
                  )}
                  {currentRecord.content?.notes && (
                    <Box>
                      <Typography variant="subtitle2">{t('records.otherNotes')}</Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {currentRecord.content.notes}
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Box>

              {/* 图片展示区域 */}
              <Box mb={2}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  <ImageIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'text-bottom' }} />
                  {t('records.attachmentImages')}
                </Typography>
                <ImageUpload
                  recordId={currentRecord.id}
                  images={recordImages}
                  onImagesChange={setRecordImages}
                  disabled={true}
                />
              </Box>

              <Typography variant="caption" color="text.secondary">
                {t('records.createdAt')}: {new Date(currentRecord.created_at).toLocaleString()} |
                {t('records.version')}: v{currentRecord.version}
              </Typography>
            </Box>
          ) : (
            // 创建/编辑模式
            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label={t('records.recordTitle')}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder={t('records.titlePlaceholder')}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>{t('records.recordType')}</InputLabel>
                  <Select
                    value={formData.type}
                    label={t('records.recordType')}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  >
                    {TYPE_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>{t('common.status')}</InputLabel>
                  <Select
                    value={formData.status}
                    label={t('common.status')}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <DateTimePicker
                  label={t('records.recordDateTime')}
                  value={formData.record_date}
                  onChange={(newValue) => setFormData({ ...formData, record_date: newValue || new Date() })}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label={t('records.durationMinutes')}
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label={t('records.specificLocation')}
                  value={formData.specific_location}
                  onChange={(e) => setFormData({ ...formData, specific_location: e.target.value })}
                  placeholder={t('records.locationPlaceholder')}
                />
              </Grid>

              {/* ========== 关联数据选择器 ========== */}

              {/* 场域选择器 */}
              <Grid size={{ xs: 12 }}>
                <Autocomplete
                  options={allFields}
                  value={selectedField}
                  onChange={(_, newValue) => setSelectedField(newValue)}
                  getOptionLabel={(option) => {
                    const parts = [option.region, option.location];
                    if (option.sub_field) parts.push(option.sub_field);
                    return parts.join(' - ');
                  }}
                  groupBy={(option) => option.region}
                  loading={loadingRelatedData}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t('records.relatedField')}
                      placeholder={t('records.selectField')}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <LocationIcon sx={{ color: 'text.secondary', mr: 1 }} />
                            {params.InputProps.startAdornment}
                          </>
                        ),
                        endAdornment: (
                          <>
                            {loadingRelatedData ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                  renderOption={(props, option) => {
                    const { key, ...rest } = props;
                    return (
                      <li key={key} {...rest}>
                        <Box>
                          <Typography variant="body2">
                            {option.location}
                            {option.sub_field && ` - ${option.sub_field}`}
                          </Typography>
                        </Box>
                      </li>
                    );
                  }}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  noOptionsText={t('records.noFieldData')}
                />
              </Grid>

              {/* 参与者多选器 */}
              <Grid size={{ xs: 12 }}>
                <Autocomplete
                  multiple
                  options={allParticipants}
                  value={selectedParticipants}
                  onChange={(_, newValue) => setSelectedParticipants(newValue)}
                  getOptionLabel={(option) => option.name_or_code}
                  loading={loadingRelatedData}
                  disableCloseOnSelect
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t('records.relatedParticipants')}
                      placeholder={selectedParticipants.length === 0 ? t('records.selectParticipants') : ""}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <PersonIcon sx={{ color: 'text.secondary', mr: 1 }} />
                            {params.InputProps.startAdornment}
                          </>
                        ),
                        endAdornment: (
                          <>
                            {loadingRelatedData ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                  renderOption={(props, option, { selected }) => {
                    const { key, ...rest } = props;
                    return (
                      <li key={key} {...rest}>
                        <Checkbox
                          icon={<CheckBoxBlankIcon fontSize="small" />}
                          checkedIcon={<CheckBoxIcon fontSize="small" />}
                          style={{ marginRight: 8 }}
                          checked={selected}
                        />
                        <ListItemText
                          primary={option.name_or_code}
                          secondary={option.occupation || undefined}
                        />
                      </li>
                    );
                  }}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => {
                      const { key, ...chipProps } = getTagProps({ index });
                      return (
                        <Chip
                          key={key}
                          label={option.name_or_code}
                          size="small"
                          {...chipProps}
                        />
                      );
                    })
                  }
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  noOptionsText={t('records.noParticipantData')}
                />
              </Grid>

              {/* 标签多选器 */}
              <Grid size={{ xs: 12 }}>
                <Autocomplete
                  multiple
                  options={allTags}
                  value={selectedTags}
                  onChange={(_, newValue) => setSelectedTags(newValue)}
                  getOptionLabel={(option) => option.name}
                  groupBy={(option) => option.category?.name || t('records.uncategorized')}
                  loading={loadingRelatedData}
                  disableCloseOnSelect
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t('records.relatedTags')}
                      placeholder={selectedTags.length === 0 ? t('records.selectTags') : ""}
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <TagIcon sx={{ color: 'text.secondary', mr: 1 }} />
                            {params.InputProps.startAdornment}
                          </>
                        ),
                        endAdornment: (
                          <>
                            {loadingRelatedData ? <CircularProgress color="inherit" size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                  renderOption={(props, option, { selected }) => {
                    const { key, ...rest } = props;
                    return (
                      <li key={key} {...rest}>
                        <Checkbox
                          icon={<CheckBoxBlankIcon fontSize="small" />}
                          checkedIcon={<CheckBoxIcon fontSize="small" />}
                          style={{ marginRight: 8 }}
                          checked={selected}
                        />
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            backgroundColor: option.category?.color || '#E8DCC8',
                            mr: 1,
                          }}
                        />
                        <ListItemText
                          primary={option.name}
                          secondary={option.description || undefined}
                        />
                      </li>
                    );
                  }}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => {
                      const { key, ...chipProps } = getTagProps({ index });
                      return (
                        <Chip
                          key={key}
                          label={option.name}
                          size="small"
                          sx={{
                            backgroundColor: option.category?.color || '#E8DCC8',
                            color: option.category?.color ? '#fff' : 'inherit',
                          }}
                          {...chipProps}
                        />
                      );
                    })
                  }
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  noOptionsText={t('records.noTagData')}
                />
              </Grid>

              {/* ========== 记录内容区域 ========== */}

              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary' }}>
                  {t('records.contentDescription')}
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  value={formData.content.description || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    content: { ...formData.content, description: e.target.value }
                  })}
                  placeholder={t('records.descriptionPlaceholder')}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary' }}>
                  {t('records.reflection')}
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={formData.content.reflection || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    content: { ...formData.content, reflection: e.target.value }
                  })}
                  placeholder={t('records.reflectionPlaceholder')}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary' }}>
                  {t('records.otherNotes')}
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  value={formData.content.notes || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    content: { ...formData.content, notes: e.target.value }
                  })}
                  placeholder={t('records.notesPlaceholder')}
                />
              </Grid>

              {/* ========== 图片上传区域 ========== */}
              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
                <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary', mt: 2 }}>
                  <ImageIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'text-bottom' }} />
                  {t('records.attachmentImages')}
                </Typography>
                <ImageUpload
                  recordId={currentRecord?.id || null}
                  images={recordImages}
                  onImagesChange={setRecordImages}
                  disabled={false}
                  maxImages={10}
                />
                {dialogMode === 'create' && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    {t('records.saveFirstHint')}
                  </Typography>
                )}
              </Grid>
            </Grid>
          )}
        </DialogContent>
        {dialogMode !== 'view' && (
          <DialogActions sx={{ px: 3, py: 2, borderTop: '1px dashed #E8DCC8' }}>
            <Button onClick={handleCloseDialog}>{t('common.cancel')}</Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={!formData.title.trim()}
            >
              {dialogMode === 'create' ? t('records.createRecord') : t('records.saveChanges')}
            </Button>
          </DialogActions>
        )}
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, id: null })}>
        <DialogTitle>{t('records.confirmDeleteTitle')}</DialogTitle>
        <DialogContent>
          <Typography>{t('records.confirmDeleteMessage')}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm({ open: false, id: null })}>{t('common.cancel')}</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>{t('common.confirmDelete')}</Button>
        </DialogActions>
      </Dialog>

      {/* 提示消息 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* 导出对话框 */}
      <ExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
      />
    </Box>
  );
};

export default Records;
