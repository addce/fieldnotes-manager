import React, { useState, useEffect, useCallback } from 'react';
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
} from '@mui/material';
import {
  AddCircleOutline as AddIcon,
  BorderColorOutlined as EditIcon,
  DeleteOutlined as DeleteIcon,
  VisibilityOutlined as ViewIcon,
  PlaceOutlined as LocationIcon,
  SearchOutlined as SearchIcon,
  CloseOutlined as CloseIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

// ============ 类型定义 ============
interface FieldDescription {
  environment?: string;        // 环境描述
  cultural_background?: string; // 文化背景
  accessibility?: string;       // 访问便利性
}

interface FieldTimeAttributes {
  active_hours?: string;        // 活跃时间段
  seasonal_changes?: string;    // 季节性变化
}

interface Field {
  id: number;
  region: string;
  location: string;
  sub_field?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  description?: FieldDescription;
  time_attributes?: FieldTimeAttributes;
  created_by: number;
  created_at: string;
  updated_at: string;
}

// ============ 常量 ============
const API_BASE = 'http://localhost:8000/api/v1';

// 初始表单数据
const INITIAL_FORM_DATA = {
  region: '',
  location: '',
  sub_field: '',
  latitude: '',
  longitude: '',
  address: '',
  // 描述信息
  environment: '',
  cultural_background: '',
  accessibility: '',
  // 时间属性
  active_hours: '',
  seasonal_changes: '',
};

const Fields: React.FC = () => {
  const { t, i18n } = useTranslation();
  
  // ============ 状态 ============
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [regions, setRegions] = useState<string[]>([]);

  // 对话框状态
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>('create');
  const [currentField, setCurrentField] = useState<Field | null>(null);

  // 表单状态
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  // 提示消息
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // 删除确认
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });

  // ============ 获取区域列表 ============
  const fetchRegions = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/fields/regions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRegions(response.data);
    } catch (error) {
      console.error('获取区域列表失败:', error);
    }
  }, []);

  // ============ 获取场域列表 ============
  const fetchFields = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        skip: String(page * rowsPerPage),
        limit: String(rowsPerPage),
      });
      if (search) params.append('search', search);
      if (regionFilter) params.append('region', regionFilter);

      const response = await axios.get(`${API_BASE}/fields/?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setFields(response.data.items);
      setTotal(response.data.total);
    } catch (error) {
      console.error('获取场域列表失败:', error);
      setSnackbar({ open: true, message: '获取场域列表失败', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, regionFilter]);

  useEffect(() => {
    fetchFields();
  }, [fetchFields]);

  useEffect(() => {
    fetchRegions();
  }, [fetchRegions]);

  // ============ 处理函数 ============
  const handleOpenCreate = () => {
    setDialogMode('create');
    setCurrentField(null);
    setFormData(INITIAL_FORM_DATA);
    setOpenDialog(true);
  };

  const handleOpenEdit = (field: Field) => {
    setDialogMode('edit');
    setCurrentField(field);
    setFormData({
      region: field.region || '',
      location: field.location || '',
      sub_field: field.sub_field || '',
      latitude: field.latitude?.toString() || '',
      longitude: field.longitude?.toString() || '',
      address: field.address || '',
      environment: field.description?.environment || '',
      cultural_background: field.description?.cultural_background || '',
      accessibility: field.description?.accessibility || '',
      active_hours: field.time_attributes?.active_hours || '',
      seasonal_changes: field.time_attributes?.seasonal_changes || '',
    });
    setOpenDialog(true);
  };

  const handleOpenView = (field: Field) => {
    setDialogMode('view');
    setCurrentField(field);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentField(null);
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');

      // 构建请求体，组织description和time_attributes
      const payload = {
        region: formData.region,
        location: formData.location,
        sub_field: formData.sub_field || null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        address: formData.address || null,
        description: {
          environment: formData.environment || null,
          cultural_background: formData.cultural_background || null,
          accessibility: formData.accessibility || null,
        },
        time_attributes: {
          active_hours: formData.active_hours || null,
          seasonal_changes: formData.seasonal_changes || null,
        },
      };

      if (dialogMode === 'create') {
        await axios.post(`${API_BASE}/fields/`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSnackbar({ open: true, message: t('fields.createSuccess'), severity: 'success' });
      } else if (dialogMode === 'edit' && currentField) {
        await axios.put(`${API_BASE}/fields/${currentField.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSnackbar({ open: true, message: t('fields.updateSuccess'), severity: 'success' });
      }

      handleCloseDialog();
      fetchFields();
      fetchRegions(); // 刷新区域列表
    } catch (error: any) {
      console.error('保存失败:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || '保存失败，请重试',
        severity: 'error'
      });
    }
  };

  // 删除场域
  const handleDelete = async () => {
    if (!deleteConfirm.id) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE}/fields/${deleteConfirm.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSnackbar({ open: true, message: t('fields.deleteSuccess'), severity: 'success' });
      setDeleteConfirm({ open: false, id: null });
      fetchFields();
      fetchRegions();
    } catch (error: any) {
      console.error('删除失败:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || '删除失败，请重试',
        severity: 'error'
      });
    }
  };

  // ============ 辅助函数 ============
  // 格式化完整地点显示
  const getFullLocation = (field: Field) => {
    const parts = [field.region, field.location];
    if (field.sub_field) parts.push(field.sub_field);
    return parts.join(' - ');
  };

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const locale = i18n.language === 'zh' ? 'zh-CN' : 'en-US';
    return new Date(dateStr).toLocaleDateString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // 判断是否有坐标
  const hasCoordinates = (field: Field) => {
    return field.latitude !== null && field.longitude !== null &&
           field.latitude !== undefined && field.longitude !== undefined;
  };

  // ============ 渲染 ============
  return (
    <Box>
      {/* 页面标题和操作 */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ fontFamily: '"STKaiti", "KaiTi", "楷体", serif' }}>
          ▸ {t('fields.management')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          sx={{ fontFamily: '"STKaiti", "KaiTi", "楷体", serif' }}
        >
          {t('fields.newField')}
        </Button>
      </Box>

      {/* 搜索和筛选栏 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              fullWidth
              placeholder={t('fields.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>{t('fields.regionFilter')}</InputLabel>
              <Select
                value={regionFilter}
                label={t('fields.regionFilter')}
                onChange={(e) => setRegionFilter(e.target.value)}
              >
                <MenuItem value="">{t('fields.allRegions')}</MenuItem>
                {regions.map((region) => (
                  <MenuItem key={region} value={region}>{region}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* 场域列表 */}
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
                  <TableCell sx={{ fontWeight: 600 }}>{t('fields.region')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('fields.location')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('fields.subField')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('fields.address')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('fields.coordinates')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{t('fields.createdAt')}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>{t('common.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fields.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <Typography variant="body1" color="text.secondary">
                        {t('fields.noFieldData')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  fields.map((field) => (
                    <TableRow key={field.id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <LocationIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 18 }} />
                          <Typography variant="subtitle2">{field.region}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                          onClick={() => handleOpenView(field)}
                        >
                          {field.location}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {field.sub_field || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                          {field.address || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={hasCoordinates(field) ? t('fields.coordinatesSet') : t('fields.coordinatesNotSet')}
                          color={hasCoordinates(field) ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(field.created_at)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title={t('common.view')}>
                          <IconButton size="small" onClick={() => handleOpenView(field)}>
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('common.edit')}>
                          <IconButton size="small" onClick={() => handleOpenEdit(field)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('common.delete')}>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setDeleteConfirm({ open: true, id: field.id })}
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
              labelDisplayedRows={({ from, to, count }) => 
                t('records.paginationDisplay', { from, to, count })
              }
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
          {dialogMode === 'create' && `✎ ${t('fields.newField')}`}
          {dialogMode === 'edit' && `✎ ${t('fields.editField')}`}
          {dialogMode === 'view' && `📍 ${t('fields.fieldDetails')}`}
          <IconButton onClick={handleCloseDialog} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {dialogMode === 'view' && currentField ? (
            // 查看模式
            <Box>
              <Typography variant="h5" gutterBottom sx={{ fontFamily: '"STKaiti", "KaiTi", "楷体", serif' }}>
                {getFullLocation(currentField)}
              </Typography>

              {/* 基本信息 */}
              <Paper variant="outlined" sx={{ p: 2, mb: 2, backgroundColor: '#FFFBF5' }}>
                <Typography variant="subtitle2" color="primary" gutterBottom>{t('fields.basicInfo')}</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="caption" color="text.secondary">{t('fields.region')}</Typography>
                    <Typography>{currentField.region}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="caption" color="text.secondary">{t('fields.location')}</Typography>
                    <Typography>{currentField.location}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="caption" color="text.secondary">{t('fields.subField')}</Typography>
                    <Typography>{currentField.sub_field || '-'}</Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* 地理信息 */}
              <Paper variant="outlined" sx={{ p: 2, mb: 2, backgroundColor: '#FFFBF5' }}>
                <Typography variant="subtitle2" color="primary" gutterBottom>{t('fields.geoInfo')}</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary">{t('fields.coordinates')}</Typography>
                    <Typography>
                      {hasCoordinates(currentField)
                        ? `${currentField.latitude}, ${currentField.longitude}`
                        : t('fields.coordinatesNotSet')}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary">{t('fields.detailedAddress')}</Typography>
                    <Typography>{currentField.address || '-'}</Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* 描述信息 */}
              {currentField.description && (
                <Paper variant="outlined" sx={{ p: 2, mb: 2, backgroundColor: '#FFFBF5' }}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>{t('fields.descInfo')}</Typography>
                  {currentField.description.environment && (
                    <Box mb={1}>
                      <Typography variant="caption" color="text.secondary">{t('fields.environmentDesc')}</Typography>
                      <Typography variant="body2">{currentField.description.environment}</Typography>
                    </Box>
                  )}
                  {currentField.description.cultural_background && (
                    <Box mb={1}>
                      <Typography variant="caption" color="text.secondary">{t('fields.culturalBackground')}</Typography>
                      <Typography variant="body2">{currentField.description.cultural_background}</Typography>
                    </Box>
                  )}
                  {currentField.description.accessibility && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">{t('fields.accessibility')}</Typography>
                      <Typography variant="body2">{currentField.description.accessibility}</Typography>
                    </Box>
                  )}
                </Paper>
              )}

              {/* 时间属性 */}
              {currentField.time_attributes && (
                <Paper variant="outlined" sx={{ p: 2, mb: 2, backgroundColor: '#FFFBF5' }}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>{t('fields.timeAttrs')}</Typography>
                  {currentField.time_attributes.active_hours && (
                    <Box mb={1}>
                      <Typography variant="caption" color="text.secondary">{t('fields.activeHours')}</Typography>
                      <Typography variant="body2">{currentField.time_attributes.active_hours}</Typography>
                    </Box>
                  )}
                  {currentField.time_attributes.seasonal_changes && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">{t('fields.seasonalChanges')}</Typography>
                      <Typography variant="body2">{currentField.time_attributes.seasonal_changes}</Typography>
                    </Box>
                  )}
                </Paper>
              )}

              <Typography variant="caption" color="text.secondary">
                {t('fields.createdAt')}: {new Date(currentField.created_at).toLocaleString(i18n.language === 'zh' ? 'zh-CN' : 'en-US')} |
                {t('fields.updatedAt')}: {new Date(currentField.updated_at).toLocaleString(i18n.language === 'zh' ? 'zh-CN' : 'en-US')}
              </Typography>
            </Box>
          ) : (
            // 创建/编辑模式
            <Grid container spacing={3}>
              {/* 基本信息 */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>
                  {t('fields.basicInfoRequired')}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label={t('fields.region')}
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  required
                  placeholder={t('fields.regionPlaceholder')}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label={t('fields.location')}
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                  placeholder={t('fields.locationPlaceholder')}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label={t('fields.subField')}
                  value={formData.sub_field}
                  onChange={(e) => setFormData({ ...formData, sub_field: e.target.value })}
                  placeholder={t('fields.subFieldPlaceholder')}
                />
              </Grid>

              {/* 地理信息 */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" color="primary" sx={{ mb: 1, mt: 2 }}>
                  {t('fields.geoInfoOptional')}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  fullWidth
                  label={t('fields.latitude')}
                  type="number"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  placeholder="-90 ~ 90"
                  inputProps={{ step: 'any', min: -90, max: 90 }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  fullWidth
                  label={t('fields.longitude')}
                  type="number"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  placeholder="-180 ~ 180"
                  inputProps={{ step: 'any', min: -180, max: 180 }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label={t('fields.detailedAddress')}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder={t('fields.addressPlaceholder')}
                />
              </Grid>

              {/* 描述信息 */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" color="primary" sx={{ mb: 1, mt: 2 }}>
                  {t('fields.descInfoOptional')}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label={t('fields.environmentDesc')}
                  multiline
                  rows={2}
                  value={formData.environment}
                  onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                  placeholder={t('fields.environmentPlaceholder')}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label={t('fields.culturalBackground')}
                  multiline
                  rows={2}
                  value={formData.cultural_background}
                  onChange={(e) => setFormData({ ...formData, cultural_background: e.target.value })}
                  placeholder={t('fields.culturalBackgroundPlaceholder')}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label={t('fields.accessibility')}
                  value={formData.accessibility}
                  onChange={(e) => setFormData({ ...formData, accessibility: e.target.value })}
                  placeholder={t('fields.accessibilityPlaceholder')}
                />
              </Grid>

              {/* 时间属性 */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" color="primary" sx={{ mb: 1, mt: 2 }}>
                  {t('fields.timeAttrsOptional')}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label={t('fields.activeHours')}
                  value={formData.active_hours}
                  onChange={(e) => setFormData({ ...formData, active_hours: e.target.value })}
                  placeholder={t('fields.activeHoursPlaceholder')}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label={t('fields.seasonalChanges')}
                  value={formData.seasonal_changes}
                  onChange={(e) => setFormData({ ...formData, seasonal_changes: e.target.value })}
                  placeholder={t('fields.seasonalChangesPlaceholder')}
                />
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
              disabled={!formData.region.trim() || !formData.location.trim()}
            >
              {dialogMode === 'create' ? t('fields.createField') : t('fields.saveChanges')}
            </Button>
          </DialogActions>
        )}
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, id: null })}>
        <DialogTitle>{t('common.confirmDelete')}</DialogTitle>
        <DialogContent>
          <Typography>{t('common.deleteWarning')}</Typography>
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
    </Box>
  );
};

export default Fields;
