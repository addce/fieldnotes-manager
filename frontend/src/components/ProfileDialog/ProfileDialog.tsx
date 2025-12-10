import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  Tabs,
  Tab,
  IconButton,
  Divider,
  Chip,
} from '@mui/material';
import {
  Close as CloseIcon,
  PersonOutlined as PersonIcon,
  LockOutlined as LockIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const API_BASE = 'http://localhost:8000/api/v1';

interface ProfileDialogProps {
  open: boolean;
  onClose: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

const ProfileDialog: React.FC<ProfileDialogProps> = ({ open, onClose }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 个人信息表单
  const [profileData, setProfileData] = useState({
    email: '',
    full_name: '',
  });

  // 密码表单
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });

  // 初始化表单数据
  useEffect(() => {
    if (user && open) {
      setProfileData({
        email: user.email || '',
        full_name: user.full_name || '',
      });
      setPasswordData({
        old_password: '',
        new_password: '',
        confirm_password: '',
      });
      setMessage(null);
      setTabValue(0);
    }
  }, [user, open]);

  // 更新个人信息
  const handleUpdateProfile = async () => {
    if (!user) return;
    setLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE}/users/${user.id}`, profileData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage({ type: 'success', text: t('profile.updateSuccess') });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.detail || t('profile.updateFailed'),
      });
    } finally {
      setLoading(false);
    }
  };

  // 修改密码
  const handleChangePassword = async () => {
    if (!user) return;

    // 验证
    if (!passwordData.old_password) {
      setMessage({ type: 'error', text: t('profile.enterCurrentPassword') });
      return;
    }
    if (!passwordData.new_password) {
      setMessage({ type: 'error', text: t('profile.enterNewPassword') });
      return;
    }
    if (passwordData.new_password !== passwordData.confirm_password) {
      setMessage({ type: 'error', text: t('profile.passwordMismatch') });
      return;
    }
    if (passwordData.new_password.length < 6) {
      setMessage({ type: 'error', text: t('profile.passwordTooShort') });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_BASE}/users/${user.id}/password`,
        {
          old_password: passwordData.old_password,
          new_password: passwordData.new_password,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage({ type: 'success', text: t('profile.passwordChangeSuccess') });
      setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.detail || t('profile.passwordChangeFailed'),
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    return role === 'admin' ? t('users.roles.admin') : t('users.roles.researcher');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontFamily: '"STKaiti", "KaiTi", "楷体", serif' }}>
        {t('profile.title')}
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {/* 用户基本信息展示 */}
        <Box sx={{ mb: 2, p: 2, backgroundColor: '#FFFDF8', borderRadius: 1 }}>
          <Box display="flex" alignItems="center" gap={2}>
            <PersonIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            <Box>
              <Typography variant="h6">{user?.username}</Typography>
              <Chip
                label={getRoleLabel(user?.role || '')}
                size="small"
                color={user?.role === 'admin' ? 'error' : 'primary'}
              />
            </Box>
          </Box>
        </Box>

        {message && (
          <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
            {message.text}
          </Alert>
        )}

        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab icon={<PersonIcon />} label={t('profile.personalInfo')} iconPosition="start" />
          <Tab icon={<LockIcon />} label={t('profile.changePassword')} iconPosition="start" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <TextField
            fullWidth
            label={t('profile.email')}
            type="email"
            value={profileData.email}
            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label={t('profile.fullName')}
            value={profileData.full_name}
            onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained"
            onClick={handleUpdateProfile}
            disabled={loading}
            fullWidth
          >
            {t('profile.saveChanges')}
          </Button>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <TextField
            fullWidth
            label={t('profile.currentPassword')}
            type="password"
            value={passwordData.old_password}
            onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label={t('profile.newPassword')}
            type="password"
            value={passwordData.new_password}
            onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label={t('profile.confirmPassword')}
            type="password"
            value={passwordData.confirm_password}
            onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained"
            onClick={handleChangePassword}
            disabled={loading}
            fullWidth
          >
            {t('profile.changePassword')}
          </Button>
        </TabPanel>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.close')}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProfileDialog;
