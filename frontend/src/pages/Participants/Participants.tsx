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
  Avatar,
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
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  AddCircleOutline as AddIcon,
  BorderColorOutlined as EditIcon,
  DeleteOutlined as DeleteIcon,
  VisibilityOutlined as ViewIcon,
  PersonOutlined as PersonIcon,
  SearchOutlined as SearchIcon,
  CloseOutlined as CloseIcon,
  ManOutlined as MaleIcon,
  WomanOutlined as FemaleIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

// ============ 类型定义 ============
interface Participant {
  id: number;
  name_or_code: string;
  gender: string | null;
  age_range: string | null;
  occupation: string | null;
  education: string | null;
  is_anonymous: boolean;
  data_sensitivity: string;
  notes: string | null;
  created_at: string;
}

// ============ 常量 ============
const GENDER_OPTIONS = [
  { value: 'male', labelKey: 'participants.genders.male', icon: <MaleIcon /> },
  { value: 'female', labelKey: 'participants.genders.female', icon: <FemaleIcon /> },
  { value: 'other', labelKey: 'participants.genders.other' },
  { value: 'unknown', labelKey: 'participants.genders.unknown' },
];

const AGE_RANGE_OPTIONS = [
  { value: '18-25', labelKey: 'participants.ageRanges.18-25' },
  { value: '26-35', labelKey: 'participants.ageRanges.26-35' },
  { value: '36-45', labelKey: 'participants.ageRanges.36-45' },
  { value: '46-55', labelKey: 'participants.ageRanges.46-55' },
  { value: '56-65', labelKey: 'participants.ageRanges.56-65' },
  { value: '65+', labelKey: 'participants.ageRanges.65+' },
  { value: 'unknown', labelKey: 'participants.ageRanges.unknown' },
];

const EDUCATION_OPTIONS = [
  { value: 'primary', labelKey: 'participants.educationLevels.primary' },
  { value: 'junior', labelKey: 'participants.educationLevels.junior' },
  { value: 'senior', labelKey: 'participants.educationLevels.senior' },
  { value: 'college', labelKey: 'participants.educationLevels.college' },
  { value: 'bachelor', labelKey: 'participants.educationLevels.bachelor' },
  { value: 'master', labelKey: 'participants.educationLevels.master' },
  { value: 'doctor', labelKey: 'participants.educationLevels.doctor' },
  { value: 'other', labelKey: 'participants.educationLevels.other' },
];

const SENSITIVITY_OPTIONS = [
  { value: 'low', labelKey: 'participants.sensitivityLevels.low', color: 'success' },
  { value: 'normal', labelKey: 'participants.sensitivityLevels.normal', color: 'info' },
  { value: 'high', labelKey: 'participants.sensitivityLevels.high', color: 'warning' },
  { value: 'confidential', labelKey: 'participants.sensitivityLevels.confidential', color: 'error' },
];

const API_BASE = 'http://localhost:8000/api/v1';

const Participants: React.FC = () => {
  const { t } = useTranslation();
  
  // ============ 状态 ============
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');

  // 对话框状态
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'view'>('create');
  const [currentParticipant, setCurrentParticipant] = useState<Participant | null>(null);

  // 表单状态
  const [formData, setFormData] = useState<{
    name_or_code: string;
    gender: string;
    age_range: string;
    occupation: string;
    education: string;
    is_anonymous: boolean;
    data_sensitivity: string;
    notes: string;
  }>({
    name_or_code: '',
    gender: '',
    age_range: '',
    occupation: '',
    education: '',
    is_anonymous: false,
    data_sensitivity: 'normal',
    notes: '',
  });

  // 删除确认状态
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: number | null }>({
    open: false,
    id: null,
  });

  // 提示消息状态
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // ============ 数据获取 ============
  const fetchParticipants = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params: any = {
        skip: page * rowsPerPage,
        limit: rowsPerPage,
      };
      if (search) params.search = search;

      const response = await axios.get(`${API_BASE}/participants/`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      setParticipants(response.data.items);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Failed to fetch participants:', error);
      setSnackbar({ open: true, message: t('common.error'), severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  // ============ 处理函数 ============
  const handleOpenCreate = () => {
    setDialogMode('create');
    setCurrentParticipant(null);
    setFormData({
      name_or_code: '',
      gender: '',
      age_range: '',
      occupation: '',
      education: '',
      is_anonymous: false,
      data_sensitivity: 'normal',
      notes: '',
    });
    setOpenDialog(true);
  };

  const handleOpenEdit = (participant: Participant) => {
    setDialogMode('edit');
    setCurrentParticipant(participant);
    setFormData({
      name_or_code: participant.name_or_code,
      gender: participant.gender || '',
      age_range: participant.age_range || '',
      occupation: participant.occupation || '',
      education: participant.education || '',
      is_anonymous: participant.is_anonymous,
      data_sensitivity: participant.data_sensitivity || 'normal',
      notes: participant.notes || '',
    });
    setOpenDialog(true);
  };

  const handleOpenView = (participant: Participant) => {
    setDialogMode('view');
    setCurrentParticipant(participant);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentParticipant(null);
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      const payload = { ...formData };

      if (dialogMode === 'create') {
        await axios.post(`${API_BASE}/participants/`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSnackbar({ open: true, message: t('participants.createSuccess'), severity: 'success' });
      } else if (dialogMode === 'edit' && currentParticipant) {
        await axios.put(`${API_BASE}/participants/${currentParticipant.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSnackbar({ open: true, message: t('participants.updateSuccess'), severity: 'success' });
      }

      handleCloseDialog();
      fetchParticipants();
    } catch (error: any) {
      console.error('Save failed:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || t('records.saveFailed'),
        severity: 'error',
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.id) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE}/participants/${deleteConfirm.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSnackbar({ open: true, message: t('participants.deleteSuccess'), severity: 'success' });
      setDeleteConfirm({ open: false, id: null });
      fetchParticipants();
    } catch (error: any) {
      console.error('Delete failed:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || t('records.deleteFailed'),
        severity: 'error',
      });
    }
  };

  // ============ 辅助函数 ============
  const getGenderLabel = (gender: string | null) => {
    if (!gender) return '-';
    const option = GENDER_OPTIONS.find((opt) => opt.value === gender);
    return option ? t(option.labelKey) : gender;
  };

  const getGenderColor = (gender: string | null): 'primary' | 'secondary' | 'default' => {
    switch (gender) {
      case 'male':
        return 'primary';
      case 'female':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getAgeRangeLabel = (ageRange: string | null) => {
    if (!ageRange) return '-';
    const option = AGE_RANGE_OPTIONS.find((opt) => opt.value === ageRange);
    return option ? t(option.labelKey) : ageRange;
  };

  const getEducationLabel = (education: string | null) => {
    if (!education) return '-';
    const option = EDUCATION_OPTIONS.find((opt) => opt.value === education);
    return option ? t(option.labelKey) : education;
  };

  const getSensitivityLabel = (sensitivity: string) => {
    const option = SENSITIVITY_OPTIONS.find((opt) => opt.value === sensitivity);
    return option ? t(option.labelKey) : t('participants.sensitivityLevels.normal');
  };

  const getSensitivityColor = (sensitivity: string): 'success' | 'info' | 'warning' | 'error' => {
    const option = SENSITIVITY_OPTIONS.find((opt) => opt.value === sensitivity);
    return (option?.color as any) || 'info';
  };

  return (
    <Box>
      {/* 页面标题和操作栏 */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
        sx={{
          pb: 2,
          borderBottom: '2px dashed #E8DCC8',
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontFamily: '"STKaiti", "KaiTi", "楷体", Georgia, serif',
            color: '#5D4037',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          ☰ {t('participants.management')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          sx={{
            bgcolor: '#5D4037',
            '&:hover': { bgcolor: '#4E342E' },
            borderRadius: 2,
          }}
        >
          {t('participants.addParticipant')}
        </Button>
      </Box>

      {/* 搜索栏 */}
      <Paper
        sx={{
          p: 2,
          mb: 3,
          bgcolor: '#FFFBF5',
          border: '1px solid #E8DCC8',
          borderRadius: 2,
        }}
      >
        <TextField
          fullWidth
          placeholder={t('participants.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#A1887F' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: '#FFF',
              '& fieldset': { borderColor: '#E8DCC8' },
              '&:hover fieldset': { borderColor: '#A1887F' },
            },
          }}
        />
      </Paper>

      {/* 参与者列表 */}
      <TableContainer
        component={Paper}
        sx={{
          bgcolor: '#FFFBF5',
          border: '1px solid #E8DCC8',
          borderRadius: 2,
        }}
      >
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress sx={{ color: '#5D4037' }} />
          </Box>
        ) : (
          <>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#F5E6C8' }}>
                  <TableCell sx={{ fontWeight: 600, color: '#5D4037' }}>{t('participants.avatar')}</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#5D4037' }}>{t('participants.nameOrCode')}</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#5D4037' }}>{t('participants.gender')}</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#5D4037' }}>{t('participants.ageRange')}</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#5D4037' }}>{t('participants.occupation')}</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#5D4037' }}>{t('participants.anonymized')}</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#5D4037' }}>{t('participants.sensitivityLevel')}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, color: '#5D4037' }}>
                    {t('common.actions')}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {participants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        {t('participants.noParticipantData')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  participants.map((participant) => (
                    <TableRow
                      key={participant.id}
                      hover
                      sx={{
                        '&:hover': { bgcolor: '#FFF8E7' },
                        borderBottom: '1px dashed #E8DCC8',
                      }}
                    >
                      <TableCell>
                        <Avatar sx={{ bgcolor: '#A1887F' }}>
                          <PersonIcon />
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            color: '#5D4037',
                            cursor: 'pointer',
                            '&:hover': { textDecoration: 'underline' },
                          }}
                          onClick={() => handleOpenView(participant)}
                        >
                          {participant.name_or_code}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getGenderLabel(participant.gender)}
                          color={getGenderColor(participant.gender)}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{getAgeRangeLabel(participant.age_range)}</TableCell>
                      <TableCell>{participant.occupation || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={participant.is_anonymous ? t('participants.yes') : t('participants.no')}
                          color={participant.is_anonymous ? 'warning' : 'success'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getSensitivityLabel(participant.data_sensitivity)}
                          color={getSensitivityColor(participant.data_sensitivity)}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title={t('participants.viewDetails')}>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenView(participant)}
                            sx={{ color: '#5D4037' }}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('common.edit')}>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenEdit(participant)}
                            sx={{ color: '#5D4037' }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('common.delete')}>
                          <IconButton
                            size="small"
                            onClick={() => setDeleteConfirm({ open: true, id: participant.id })}
                            sx={{ color: '#C62828' }}
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
                `${from}-${to} / ${count} ${t('participants.paginationLabel')}`
              }
              sx={{ borderTop: '1px dashed #E8DCC8' }}
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
        PaperProps={{
          sx: {
            bgcolor: '#FFFBF5',
            border: '2px solid #E8DCC8',
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            bgcolor: '#F5E6C8',
            borderBottom: '2px dashed #E8DCC8',
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontFamily: '"STKaiti", "KaiTi", "楷体", Georgia, serif',
              color: '#5D4037',
            }}
          >
            {dialogMode === 'create'
              ? `▸ ${t('participants.addParticipant')}`
              : dialogMode === 'edit'
              ? `▸ ${t('participants.editParticipant')}`
              : `▸ ${t('participants.participantDetails')}`}
          </Typography>
          <IconButton onClick={handleCloseDialog} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          {dialogMode === 'view' && currentParticipant ? (
            // 查看模式 - 只读展示
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  {t('participants.nameOrCode')}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {currentParticipant.name_or_code}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  {t('participants.gender')}
                </Typography>
                <Typography variant="body1">
                  {getGenderLabel(currentParticipant.gender)}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  {t('participants.ageRange')}
                </Typography>
                <Typography variant="body1">
                  {getAgeRangeLabel(currentParticipant.age_range)}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  {t('participants.occupation')}
                </Typography>
                <Typography variant="body1">
                  {currentParticipant.occupation || '-'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  {t('participants.education')}
                </Typography>
                <Typography variant="body1">
                  {getEducationLabel(currentParticipant.education)}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  {t('participants.anonymized')}
                </Typography>
                <Typography variant="body1">
                  {currentParticipant.is_anonymous ? t('participants.yes') : t('participants.no')}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="text.secondary">
                  {t('participants.notes')}
                </Typography>
                <Typography variant="body1">
                  {currentParticipant.notes || t('participants.noNotes')}
                </Typography>
              </Grid>
            </Grid>
          ) : (
            // 创建/编辑模式 - 表单
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label={t('participants.nameOrCode')}
                  value={formData.name_or_code}
                  onChange={(e) => setFormData({ ...formData, name_or_code: e.target.value })}
                  required
                  placeholder={t('participants.nameOrCodePlaceholder')}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>{t('participants.gender')}</InputLabel>
                  <Select
                    value={formData.gender}
                    label={t('participants.gender')}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <MenuItem value="">
                      <em>{t('participants.notSelected')}</em>
                    </MenuItem>
                    {GENDER_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {t(opt.labelKey)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>{t('participants.ageRange')}</InputLabel>
                  <Select
                    value={formData.age_range}
                    label={t('participants.ageRange')}
                    onChange={(e) => setFormData({ ...formData, age_range: e.target.value })}
                  >
                    <MenuItem value="">
                      <em>{t('participants.notSelected')}</em>
                    </MenuItem>
                    {AGE_RANGE_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {t(opt.labelKey)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label={t('participants.occupation')}
                  value={formData.occupation}
                  onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                  placeholder={t('participants.occupationPlaceholder')}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>{t('participants.education')}</InputLabel>
                  <Select
                    value={formData.education}
                    label={t('participants.education')}
                    onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                  >
                    <MenuItem value="">
                      <em>{t('participants.notSelected')}</em>
                    </MenuItem>
                    {EDUCATION_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {t(opt.labelKey)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>{t('participants.dataSensitivity')}</InputLabel>
                  <Select
                    value={formData.data_sensitivity}
                    label={t('participants.dataSensitivity')}
                    onChange={(e) =>
                      setFormData({ ...formData, data_sensitivity: e.target.value })
                    }
                  >
                    {SENSITIVITY_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {t(opt.labelKey)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_anonymous}
                      onChange={(e) =>
                        setFormData({ ...formData, is_anonymous: e.target.checked })
                      }
                    />
                  }
                  label={t('participants.anonymizeProcessing')}
                  sx={{ mt: 1 }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label={t('participants.notes')}
                  multiline
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder={t('participants.notesPlaceholder')}
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
              disabled={!formData.name_or_code.trim()}
              sx={{
                bgcolor: '#5D4037',
                '&:hover': { bgcolor: '#4E342E' },
              }}
            >
              {dialogMode === 'create' ? t('participants.addParticipant') : t('participants.saveChanges')}
            </Button>
          </DialogActions>
        )}
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog
        open={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, id: null })}
        PaperProps={{
          sx: {
            bgcolor: '#FFFBF5',
            border: '2px solid #E8DCC8',
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle sx={{ color: '#C62828' }}>{t('common.confirmDelete')}</DialogTitle>
        <DialogContent>
          <Typography>{t('common.deleteWarning')}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm({ open: false, id: null })}>{t('common.cancel')}</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            {t('common.confirmDelete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 提示消息 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Participants;
