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
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  AddCircleOutline as AddIcon,
  BorderColorOutlined as EditIcon,
  DeleteOutlined as DeleteIcon,
  SearchOutlined as SearchIcon,
  CloseOutlined as CloseIcon,
  LockResetOutlined as ResetPasswordIcon,
  PersonOutlined as PersonIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const API_BASE = 'http://localhost:8000/api/v1';

interface User {
  id: number;
  username: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'researcher';
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  last_login: string | null;
}

const Users: React.FC = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  const ROLE_OPTIONS = [
    { value: 'admin', label: t('users.roles.admin'), color: 'error' },
    { value: 'researcher', label: t('users.roles.researcher'), color: 'primary' },
  ];

  // 对话框状态
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // 密码重置对话框
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [passwordUserId, setPasswordUserId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // 表单状态
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    role: 'researcher' as 'admin' | 'researcher',
    is_active: true,
  });

  // 提示消息
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // 删除确认
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });

  // 获取用户列表
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterRole) params.append('role', filterRole);
      if (filterStatus) params.append('is_active', filterStatus);

      const response = await axios.get(`${API_BASE}/users/?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);
    } catch (error) {
      console.error('获取用户失败:', error);
      setSnackbar({ open: true, message: '获取用户列表失败', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [search, filterRole, filterStatus]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // 打开创建对话框
  const handleOpenCreate = () => {
    setDialogMode('create');
    setCurrentUser(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      full_name: '',
      role: 'researcher',
      is_active: true,
    });
    setOpenDialog(true);
  };

  // 打开编辑对话框
  const handleOpenEdit = (user: User) => {
    setDialogMode('edit');
    setCurrentUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      full_name: user.full_name || '',
      role: user.role,
      is_active: user.is_active,
    });
    setOpenDialog(true);
  };

  // 关闭对话框
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentUser(null);
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');

      if (dialogMode === 'create') {
        await axios.post(`${API_BASE}/users/`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSnackbar({ open: true, message: t('users.createSuccess'), severity: 'success' });
      } else if (dialogMode === 'edit' && currentUser) {
        const updateData = {
          email: formData.email,
          full_name: formData.full_name,
          role: formData.role,
          is_active: formData.is_active,
        };
        await axios.put(`${API_BASE}/users/${currentUser.id}`, updateData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSnackbar({ open: true, message: t('users.updateSuccess'), severity: 'success' });
      }

      handleCloseDialog();
      fetchUsers();
    } catch (error: any) {
      console.error('保存失败:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || t('records.saveFailed'),
        severity: 'error'
      });
    }
  };

  // 删除用户
  const handleDelete = async () => {
    if (!deleteConfirm.id) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE}/users/${deleteConfirm.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSnackbar({ open: true, message: t('users.deleteSuccess'), severity: 'success' });
      setDeleteConfirm({ open: false, id: null });
      fetchUsers();
    } catch (error: any) {
      console.error('删除失败:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || t('records.deleteFailed'),
        severity: 'error'
      });
    }
  };

  // 重置密码
  const handleResetPassword = async () => {
    if (!passwordUserId || !newPassword) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE}/users/${passwordUserId}/password`, 
        { new_password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSnackbar({ open: true, message: t('users.passwordResetSuccess'), severity: 'success' });
      setOpenPasswordDialog(false);
      setPasswordUserId(null);
      setNewPassword('');
    } catch (error: any) {
      console.error('重置密码失败:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || t('users.passwordResetSuccess'),
        severity: 'error'
      });
    }
  };

  // 辅助函数
  const getRoleLabel = (role: string) => ROLE_OPTIONS.find(r => r.value === role)?.label || role;
  const getRoleColor = (role: string) => ROLE_OPTIONS.find(r => r.value === role)?.color || 'default';

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  return (
    <Box>
      {/* 页面标题 */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ fontFamily: '"STKaiti", "KaiTi", "楷体", serif' }}>
          ▸ {t('users.title')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          sx={{ fontFamily: '"STKaiti", "KaiTi", "楷体", serif' }}
        >
          {t('users.newUser')}
        </Button>
      </Box>

      {/* 搜索和筛选 */}
      <Paper sx={{ p: 2, mb: 3, backgroundColor: '#FFFDF8' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              fullWidth
              placeholder={t('users.searchPlaceholder')}
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
          <Grid size={{ xs: 6, sm: 3, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>{t('users.role')}</InputLabel>
              <Select
                value={filterRole}
                label={t('users.role')}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <MenuItem value="">{t('common.all')}</MenuItem>
                <MenuItem value="admin">{t('users.roles.admin')}</MenuItem>
                <MenuItem value="researcher">{t('users.roles.researcher')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 6, sm: 3, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>{t('common.status')}</InputLabel>
              <Select
                value={filterStatus}
                label={t('common.status')}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value="">{t('common.all')}</MenuItem>
                <MenuItem value="true">{t('users.activeStatus.active')}</MenuItem>
                <MenuItem value="false">{t('users.activeStatus.inactive')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* 用户列表 */}
      <TableContainer component={Paper} sx={{ backgroundColor: '#FFFDF8' }}>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('auth.username')}</TableCell>
                <TableCell>{t('users.email')}</TableCell>
                <TableCell>{t('users.fullName')}</TableCell>
                <TableCell>{t('users.role')}</TableCell>
                <TableCell>{t('common.status')}</TableCell>
                <TableCell>{t('users.createdAt')}</TableCell>
                <TableCell>{t('users.lastLogin')}</TableCell>
                <TableCell align="center">{t('common.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography color="text.secondary" py={4}>
                      {t('common.noData')}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <PersonIcon fontSize="small" color="action" />
                        {user.username}
                      </Box>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.full_name || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={getRoleLabel(user.role)}
                        size="small"
                        color={getRoleColor(user.role) as any}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.is_active ? t('users.activeStatus.active') : t('users.activeStatus.inactive')}
                        size="small"
                        color={user.is_active ? 'success' : 'default'}
                        variant={user.is_active ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell>{formatDate(user.created_at)}</TableCell>
                    <TableCell>{formatDate(user.last_login)}</TableCell>
                    <TableCell align="center">
                      <Tooltip title={t('common.edit')}>
                        <IconButton size="small" onClick={() => handleOpenEdit(user)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('users.resetPassword')}>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setPasswordUserId(user.id);
                            setOpenPasswordDialog(true);
                          }}
                        >
                          <ResetPasswordIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('common.delete')}>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteConfirm({ open: true, id: user.id })}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </TableContainer>

      {/* 创建/编辑对话框 */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily: '"STKaiti", "KaiTi", "楷体", serif' }}>
          {dialogMode === 'create' ? t('users.newUser') : t('users.editUser')}
          <IconButton
            onClick={handleCloseDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={12}>
              <TextField
                fullWidth
                label={t('auth.username')}
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                disabled={dialogMode === 'edit'}
                required
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label={t('users.email')}
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </Grid>
            {dialogMode === 'create' && (
              <Grid size={12}>
                <TextField
                  fullWidth
                  label={t('auth.password')}
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </Grid>
            )}
            <Grid size={12}>
              <TextField
                fullWidth
                label={t('users.fullName')}
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>{t('users.role')}</InputLabel>
                <Select
                  value={formData.role}
                  label={t('users.role')}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                >
                  <MenuItem value="admin">{t('users.roles.admin')}</MenuItem>
                  <MenuItem value="researcher">{t('users.roles.researcher')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                }
                label={t('users.isActive')}
                sx={{ mt: 1 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {dialogMode === 'create' ? t('common.create') : t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 重置密码对话框 */}
      <Dialog open={openPasswordDialog} onClose={() => setOpenPasswordDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('users.resetPassword')}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label={t('users.newPassword')}
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenPasswordDialog(false); setNewPassword(''); }}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleResetPassword}>{t('users.confirmReset')}</Button>
        </DialogActions>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, id: null })}>
        <DialogTitle>{t('common.confirm')}</DialogTitle>
        <DialogContent>
          <Typography>{t('users.confirmDelete')}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm({ open: false, id: null })}>{t('common.cancel')}</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>{t('common.delete')}</Button>
        </DialogActions>
      </Dialog>

      {/* 提示消息 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Users;
