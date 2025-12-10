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
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress,
  InputAdornment,
  TablePagination,
} from '@mui/material';
import {
  AddCircleOutline as AddIcon,
  BorderColorOutlined as EditIcon,
  DeleteOutlined as DeleteIcon,
  BookmarkBorderOutlined as LabelIcon,
  CategoryOutlined as CategoryIcon,
  SearchOutlined as SearchIcon,
  CloseOutlined as CloseIcon,
} from '@mui/icons-material';
import axios from 'axios';

// ============ 类型定义 ============
interface TagCategory {
  id: number;
  name: string;
  type: 'theme' | 'content' | 'analysis';
  description?: string;
  color?: string;
  tag_count: number;
  created_at: string;
  updated_at: string;
}

interface Tag {
  id: number;
  name: string;
  description?: string;
  category_id: number;
  category?: {
    id: number;
    name: string;
    type: string;
    color?: string;
  };
  usage_count: number;
  created_at: string;
}

// ============ 常量 ============
const API_BASE = 'http://localhost:8000/api/v1';

const CATEGORY_TYPE_OPTIONS = [
  { value: 'theme', labelKey: 'tags.categoryTypes.theme', color: '#2196F3' },
  { value: 'content', labelKey: 'tags.categoryTypes.content', color: '#4CAF50' },
  { value: 'analysis', labelKey: 'tags.categoryTypes.analysis', color: '#FF9800' },
];

const DEFAULT_COLORS = [
  '#2196F3', '#4CAF50', '#F44336', '#FF9800', '#9C27B0',
  '#00BCD4', '#795548', '#607D8B', '#E91E63', '#3F51B5',
];

// TabPanel 组件
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tags-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Tags: React.FC = () => {
  const { t } = useTranslation();
  
  // ============ 状态 ============
  const [tabValue, setTabValue] = useState(0);

  // 分类状态
  const [categories, setCategories] = useState<TagCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // 标签状态
  const [tags, setTags] = useState<Tag[]>([]);
  const [loadingTags, setLoadingTags] = useState(true);
  const [totalTags, setTotalTags] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | ''>('');

  // 分类对话框状态
  const [categoryDialog, setCategoryDialog] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    data: TagCategory | null;
  }>({ open: false, mode: 'create', data: null });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    type: 'theme' as 'theme' | 'content' | 'analysis',
    description: '',
    color: '#2196F3',
  });

  // 标签对话框状态
  const [tagDialog, setTagDialog] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    data: Tag | null;
  }>({ open: false, mode: 'create', data: null });

  const [tagForm, setTagForm] = useState({
    name: '',
    description: '',
    category_id: 0,
  });

  // 删除确认状态
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    type: 'category' | 'tag';
    id: number | null;
    name: string;
  }>({ open: false, type: 'category', id: null, name: '' });

  // 提示消息
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  // ============ 获取分类列表 ============
  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/tags/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(response.data.items || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setSnackbar({ open: true, message: t('common.error'), severity: 'error' });
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  // ============ 获取标签列表 ============
  const fetchTags = useCallback(async () => {
    setLoadingTags(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        skip: String(page * rowsPerPage),
        limit: String(rowsPerPage),
      });
      if (search) params.append('search', search);
      if (categoryFilter) params.append('category_id', String(categoryFilter));

      const response = await axios.get(`${API_BASE}/tags/?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTags(response.data.items || []);
      setTotalTags(response.data.total || 0);
    } catch (error) {
      console.error('Failed to fetch tags:', error);
      setSnackbar({ open: true, message: t('common.error'), severity: 'error' });
    } finally {
      setLoadingTags(false);
    }
  }, [page, rowsPerPage, search, categoryFilter]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  // ============ 分类操作 ============
  const handleOpenCategoryCreate = () => {
    setCategoryForm({ name: '', type: 'theme', description: '', color: '#2196F3' });
    setCategoryDialog({ open: true, mode: 'create', data: null });
  };

  const handleOpenCategoryEdit = (category: TagCategory) => {
    setCategoryForm({
      name: category.name,
      type: category.type,
      description: category.description || '',
      color: category.color || '#2196F3',
    });
    setCategoryDialog({ open: true, mode: 'edit', data: category });
  };

  const handleCloseCategoryDialog = () => {
    setCategoryDialog({ open: false, mode: 'create', data: null });
  };

  const handleSubmitCategory = async () => {
    try {
      const token = localStorage.getItem('token');
      const payload = { ...categoryForm };

      if (categoryDialog.mode === 'create') {
        await axios.post(`${API_BASE}/tags/categories`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSnackbar({ open: true, message: t('tags.createCategorySuccess'), severity: 'success' });
      } else if (categoryDialog.data) {
        await axios.put(`${API_BASE}/tags/categories/${categoryDialog.data.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSnackbar({ open: true, message: t('tags.updateCategorySuccess'), severity: 'success' });
      }

      handleCloseCategoryDialog();
      fetchCategories();
    } catch (error: any) {
      console.error('Failed to save category:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || t('common.error'),
        severity: 'error',
      });
    }
  };

  // ============ 标签操作 ============
  const handleOpenTagCreate = () => {
    setTagForm({ name: '', description: '', category_id: categories[0]?.id || 0 });
    setTagDialog({ open: true, mode: 'create', data: null });
  };

  const handleOpenTagEdit = (tag: Tag) => {
    setTagForm({
      name: tag.name,
      description: tag.description || '',
      category_id: tag.category_id,
    });
    setTagDialog({ open: true, mode: 'edit', data: tag });
  };

  const handleCloseTagDialog = () => {
    setTagDialog({ open: false, mode: 'create', data: null });
  };

  const handleSubmitTag = async () => {
    try {
      const token = localStorage.getItem('token');
      const payload = { ...tagForm };

      if (tagDialog.mode === 'create') {
        await axios.post(`${API_BASE}/tags/`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSnackbar({ open: true, message: t('tags.createTagSuccess'), severity: 'success' });
      } else if (tagDialog.data) {
        await axios.put(`${API_BASE}/tags/${tagDialog.data.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSnackbar({ open: true, message: t('tags.updateTagSuccess'), severity: 'success' });
      }

      handleCloseTagDialog();
      fetchTags();
      fetchCategories(); // 刷新分类以更新标签数量
    } catch (error: any) {
      console.error('Failed to save tag:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || t('common.error'),
        severity: 'error',
      });
    }
  };

  // ============ 删除操作 ============
  const handleDelete = async () => {
    if (!deleteConfirm.id) return;

    try {
      const token = localStorage.getItem('token');
      const url = deleteConfirm.type === 'category'
        ? `${API_BASE}/tags/categories/${deleteConfirm.id}`
        : `${API_BASE}/tags/${deleteConfirm.id}`;

      await axios.delete(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSnackbar({
        open: true,
        message: deleteConfirm.type === 'category' ? t('tags.deleteCategorySuccess') : t('tags.deleteTagSuccess'),
        severity: 'success',
      });
      setDeleteConfirm({ open: false, type: 'category', id: null, name: '' });

      if (deleteConfirm.type === 'category') {
        fetchCategories();
      } else {
        fetchTags();
        fetchCategories();
      }
    } catch (error: any) {
      console.error('Failed to delete:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || t('common.error'),
        severity: 'error',
      });
    }
  };

  // ============ 辅助函数 ============
  const getTypeLabel = (type: string) => {
    const option = CATEGORY_TYPE_OPTIONS.find(opt => opt.value === type);
    return option ? t(option.labelKey) : type;
  };

  // ============ 渲染 ============
  return (
    <Box>
      {/* 页面标题 */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ fontFamily: '"STKaiti", "KaiTi", "楷体", serif' }}>
          ▸ {t('tags.management')}
        </Typography>
      </Box>

      {/* 标签页 */}
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: '2px dashed #E8DCC8' }}
        >
          <Tab label={t('tags.categories')} sx={{ fontFamily: '"STKaiti", "KaiTi", "楷体", serif' }} />
          <Tab label={t('tags.tagList')} sx={{ fontFamily: '"STKaiti", "KaiTi", "楷体", serif' }} />
        </Tabs>

        {/* ============ 标签分类面板 ============ */}
        <TabPanel value={tabValue} index={0}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6" sx={{ fontFamily: '"STKaiti", "KaiTi", "楷体", serif' }}>
              {t('tags.categoryManagement')}
            </Typography>
            <Button
              variant="contained"
              startIcon={<CategoryIcon />}
              onClick={handleOpenCategoryCreate}
              sx={{ fontFamily: '"STKaiti", "KaiTi", "楷体", serif' }}
            >
              {t('tags.newCategory')}
            </Button>
          </Box>

          {loadingCategories ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : categories.length === 0 ? (
            <Box textAlign="center" py={6}>
              <Typography color="text.secondary">
                {t('tags.noCategoryData')}
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {categories.map((category) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={category.id}>
                  <Card
                    sx={{
                      height: '100%',
                      borderLeft: `4px solid ${category.color || '#2196F3'}`,
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'translateY(-4px)' },
                    }}
                  >
                    <CardContent>
                      <Box display="flex" alignItems="center" mb={2}>
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            backgroundColor: category.color || '#2196F3',
                            borderRadius: 1,
                            mr: 1,
                          }}
                        />
                        <Typography variant="h6" sx={{ flex: 1 }}>
                          {category.name}
                        </Typography>
                        <Chip
                          label={getTypeLabel(category.type)}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" mb={2} sx={{ minHeight: 40 }}>
                        {category.description || t('tags.noDescription')}
                      </Typography>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Chip
                          label={t('tags.tagCount', { count: category.tag_count })}
                          size="small"
                          sx={{ backgroundColor: category.color || '#2196F3', color: 'white' }}
                        />
                        <Box>
                          <Tooltip title={t('common.edit')}>
                            <IconButton size="small" onClick={() => handleOpenCategoryEdit(category)}>
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={t('common.delete')}>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setDeleteConfirm({
                                open: true,
                                type: 'category',
                                id: category.id,
                                name: category.name,
                              })}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        {/* ============ 标签列表面板 ============ */}
        <TabPanel value={tabValue} index={1}>
          {/* 搜索和筛选栏 */}
          <Box mb={3}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  placeholder={t('tags.searchTagPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4, md: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>{t('tags.categoryFilter')}</InputLabel>
                  <Select
                    value={categoryFilter}
                    label={t('tags.categoryFilter')}
                    onChange={(e) => setCategoryFilter(e.target.value as number | '')}
                  >
                    <MenuItem value="">{t('tags.allCategories')}</MenuItem>
                    {categories.map((cat) => (
                      <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 2, md: 5 }} sx={{ textAlign: 'right' }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleOpenTagCreate}
                  disabled={categories.length === 0}
                  sx={{ fontFamily: '"STKaiti", "KaiTi", "楷体", serif' }}
                >
                  {t('tags.newTag')}
                </Button>
              </Grid>
            </Grid>
          </Box>

          {/* 标签表格 */}
          <TableContainer>
            {loadingTags ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'rgba(93, 64, 55, 0.05)' }}>
                      <TableCell sx={{ fontWeight: 600 }}>{t('tags.tagName')}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{t('common.description')}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{t('tags.belongsToCategory')}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{t('tags.usageCount')}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>{t('common.actions')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tags.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                          <Typography color="text.secondary">
                            {categories.length === 0
                              ? t('tags.createCategoryFirst')
                              : t('tags.noTagData')}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      tags.map((tag) => (
                        <TableRow key={tag.id} hover>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <LabelIcon
                                sx={{ mr: 1, color: tag.category?.color || '#2196F3', fontSize: 20 }}
                              />
                              <Typography variant="subtitle2">{tag.name}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 200 }}>
                              {tag.description || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={tag.category?.name || t('tags.unknownCategory')}
                              size="small"
                              sx={{
                                backgroundColor: tag.category?.color || '#2196F3',
                                color: 'white',
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip label={tag.usage_count} variant="outlined" size="small" />
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title={t('common.edit')}>
                              <IconButton size="small" onClick={() => handleOpenTagEdit(tag)}>
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={t('common.delete')}>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => setDeleteConfirm({
                                  open: true,
                                  type: 'tag',
                                  id: tag.id,
                                  name: tag.name,
                                })}
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
                  count={totalTags}
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
        </TabPanel>
      </Paper>

      {/* ============ 分类对话框 ============ */}
      <Dialog open={categoryDialog.open} onClose={handleCloseCategoryDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '2px dashed #E8DCC8',
          fontFamily: '"STKaiti", "KaiTi", "楷体", serif',
        }}>
          {categoryDialog.mode === 'create' ? `✎ ${t('tags.newCategory')}` : `✎ ${t('tags.editTag')}`}
          <IconButton onClick={handleCloseCategoryDialog} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label={t('tags.categoryName')}
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                required
                placeholder={t('tags.categoryNamePlaceholder')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>{t('tags.categoryType')}</InputLabel>
                <Select
                  value={categoryForm.type}
                  label={t('tags.categoryType')}
                  onChange={(e) => setCategoryForm({ ...categoryForm, type: e.target.value as any })}
                >
                  {CATEGORY_TYPE_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>{t(opt.labelKey)}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>{t('tags.color')}</InputLabel>
                <Select
                  value={categoryForm.color}
                  label={t('tags.color')}
                  onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                >
                  {DEFAULT_COLORS.map((color) => (
                    <MenuItem key={color} value={color}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            backgroundColor: color,
                            borderRadius: 1,
                          }}
                        />
                        {color}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label={t('tags.categoryDescription')}
                multiline
                rows={2}
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                placeholder={t('tags.categoryDescPlaceholder')}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px dashed #E8DCC8' }}>
          <Button onClick={handleCloseCategoryDialog}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            onClick={handleSubmitCategory}
            disabled={!categoryForm.name.trim()}
          >
            {categoryDialog.mode === 'create' ? t('tags.createCategory') : t('tags.saveChanges')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ============ 标签对话框 ============ */}
      <Dialog open={tagDialog.open} onClose={handleCloseTagDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '2px dashed #E8DCC8',
          fontFamily: '"STKaiti", "KaiTi", "楷体", serif',
        }}>
          {tagDialog.mode === 'create' ? `✎ ${t('tags.newTag')}` : `✎ ${t('tags.editTag')}`}
          <IconButton onClick={handleCloseTagDialog} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label={t('tags.tagName')}
                value={tagForm.name}
                onChange={(e) => setTagForm({ ...tagForm, name: e.target.value })}
                required
                placeholder={t('tags.tagNamePlaceholder')}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth required>
                <InputLabel>{t('tags.belongsToCategory')}</InputLabel>
                <Select
                  value={tagForm.category_id || ''}
                  label={t('tags.belongsToCategory')}
                  onChange={(e) => setTagForm({ ...tagForm, category_id: e.target.value as number })}
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            backgroundColor: cat.color || '#2196F3',
                            borderRadius: 0.5,
                          }}
                        />
                        {cat.name}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label={t('tags.tagDescription')}
                multiline
                rows={2}
                value={tagForm.description}
                onChange={(e) => setTagForm({ ...tagForm, description: e.target.value })}
                placeholder={t('tags.tagDescPlaceholder')}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px dashed #E8DCC8' }}>
          <Button onClick={handleCloseTagDialog}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            onClick={handleSubmitTag}
            disabled={!tagForm.name.trim() || !tagForm.category_id}
          >
            {tagDialog.mode === 'create' ? t('tags.createTag') : t('tags.saveChanges')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ============ 删除确认对话框 ============ */}
      <Dialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ ...deleteConfirm, open: false })}>
        <DialogTitle>{t('common.confirmDelete')}</DialogTitle>
        <DialogContent>
          <Typography>
            {deleteConfirm.type === 'category' 
              ? t('tags.category') 
              : t('tags.tagName')}: "<strong>{deleteConfirm.name}</strong>" - {t('common.deleteWarning')}
          </Typography>
          {deleteConfirm.type === 'category' && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              {t('tags.deleteCategoryWarning')}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm({ ...deleteConfirm, open: false })}>{t('common.cancel')}</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>{t('common.confirm')}</Button>
        </DialogActions>
      </Dialog>

      {/* ============ 提示消息 ============ */}
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
    </Box>
  );
};

export default Tags;
