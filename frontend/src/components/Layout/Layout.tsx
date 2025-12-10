import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  MenuOutlined as MenuIcon,
  HomeOutlined as HomeIcon,
  DescriptionOutlined as RecordsIcon,
  PeopleAltOutlined as ParticipantsIcon,
  MapOutlined as FieldsIcon,
  BookmarkBorderOutlined as TagsIcon,
  PersonOutlined as PersonIcon,
  LogoutOutlined as LogoutIcon,
  MenuBookOutlined as BookIcon,
  AdminPanelSettingsOutlined as AdminIcon,
  SettingsOutlined as SettingsIcon,
} from '@mui/icons-material';

import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { LanguageSwitcher } from '../LanguageSwitcher';
import ProtectedRoute from '../ProtectedRoute/ProtectedRoute';
import { ProfileDialog } from '../ProfileDialog';

const drawerWidth = 260;

const Layout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // 导航菜单项 - 使用翻译
  const menuItems = [
    { text: t('nav.researchRoom'), icon: <HomeIcon />, path: '/' },
    { text: t('nav.fieldNotes'), icon: <RecordsIcon />, path: '/records' },
    { text: t('nav.interviewees'), icon: <ParticipantsIcon />, path: '/participants' },
    { text: t('nav.researchFields'), icon: <FieldsIcon />, path: '/fields' },
    { text: t('nav.themeTags'), icon: <TagsIcon />, path: '/tags' },
  ];

  // 管理员菜单项
  const adminMenuItems = [
    { text: t('nav.userManagement'), icon: <AdminIcon />, path: '/users' },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleMenuClose();
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const drawer = (
    <Box sx={{ height: '100%' }}>
      {/* 标题区域 - 笔记本封面风格 */}
      <Box
        sx={{
          p: 2.5,
          display: 'flex',
          alignItems: 'center',
          borderBottom: '3px double #D7CCC8',
        }}
      >
        <BookIcon sx={{ fontSize: 32, color: 'primary.main', mr: 1.5 }} />
        <Box>
          <Typography
            variant="h5"
            component="div"
            sx={{
              fontFamily: '"STKaiti", "KaiTi", "楷体", serif',
              color: 'primary.main',
              lineHeight: 1.2,
            }}
          >
            {t('login.systemTitle')}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontStyle: 'italic',
            }}
          >
            {t('login.systemSubtitle')}
          </Typography>
        </Box>
      </Box>

      {/* 导航菜单 - 目录风格 */}
      <List sx={{ pt: 2 }}>
        <Typography
          variant="overline"
          sx={{
            px: 3,
            color: 'text.secondary',
            fontFamily: '"PingFang SC", "Microsoft YaHei", serif',
          }}
        >
          {t('nav.researchNav')}
        </Typography>
        {menuItems.map((item, index) => (
          <ListItem key={item.text} disablePadding sx={{ px: 1 }}>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
              sx={{
                borderRadius: 1,
                mx: 1,
                my: 0.5,
                '&.Mui-selected': {
                  backgroundColor: 'rgba(93, 64, 55, 0.08)',
                  borderLeft: '3px solid',
                  borderColor: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'rgba(93, 64, 55, 0.12)',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ color: location.pathname === item.path ? 'primary.main' : 'text.secondary' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontFamily: '"STKaiti", "KaiTi", "楷体", serif',
                  fontSize: '1rem',
                }}
              />
              {/* 页码装饰 */}
              <Typography
                variant="caption"
                sx={{
                  color: 'text.disabled',
                  fontStyle: 'italic',
                }}
              >
                {String(index + 1).padStart(2, '0')}
              </Typography>
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* 管理员菜单 - 仅管理员可见 */}
      {user?.role === 'admin' && (
        <List sx={{ pt: 1 }}>
          <Divider sx={{ mx: 2, my: 1, borderStyle: 'dashed' }} />
          <Typography
            variant="overline"
            sx={{
              px: 3,
              color: 'text.secondary',
              fontFamily: '"PingFang SC", "Microsoft YaHei", serif',
            }}
          >
            {t('nav.systemManagement')}
          </Typography>
          {adminMenuItems.map((item, index) => (
            <ListItem key={item.text} disablePadding sx={{ px: 1 }}>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  borderRadius: 1,
                  mx: 1,
                  my: 0.5,
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(93, 64, 55, 0.08)',
                    borderLeft: '3px solid',
                    borderColor: 'primary.main',
                    '&:hover': {
                      backgroundColor: 'rgba(93, 64, 55, 0.12)',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ color: location.pathname === item.path ? 'primary.main' : 'text.secondary' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontFamily: '"STKaiti", "KaiTi", "楷体", serif',
                    fontSize: '1rem',
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      )}

      {/* 底部装饰 */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 16,
          left: 0,
          right: 0,
          textAlign: 'center',
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: 'text.disabled',
            fontStyle: 'italic',
          }}
        >
          "{t('nav.motto')}"
        </Typography>
      </Box>
    </Box>
  );

  return (
    <ProtectedRoute>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppBar
          position="fixed"
          sx={{
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            ml: { sm: `${drawerWidth}px` },
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{
                flexGrow: 1,
                fontFamily: '"STKaiti", "KaiTi", "楷体", serif',
              }}
            >
              {menuItems.find(item => item.path === location.pathname)?.text || t('login.systemTitle')}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LanguageSwitcher />
              <Typography
                variant="body2"
                sx={{
                  mr: 1,
                  fontFamily: '"PingFang SC", "Microsoft YaHei", serif',
                }}
              >
                {user?.full_name || user?.username}
              </Typography>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenuClick}
                color="inherit"
              >
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    border: '2px solid rgba(255,255,255,0.3)',
                  }}
                >
                  <PersonIcon />
                </Avatar>
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                  sx: {
                    mt: 1,
                    minWidth: 180,
                  }
                }}
              >
                <MenuItem onClick={() => { handleMenuClose(); setProfileDialogOpen(true); }}>
                  <ListItemIcon>
                    <SettingsIcon fontSize="small" />
                  </ListItemIcon>
                  <Typography sx={{ fontFamily: '"PingFang SC", "Microsoft YaHei", serif' }}>
                    {t('nav.personalSettings')}
                  </Typography>
                </MenuItem>
                <Divider sx={{ borderStyle: 'dashed' }} />
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" color="error" />
                  </ListItemIcon>
                  <Typography sx={{ fontFamily: '"PingFang SC", "Microsoft YaHei", serif', color: 'error.main' }}>
                    {t('auth.exitResearchRoom')}
                  </Typography>
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>
        <Box
          component="nav"
          sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
          aria-label="mailbox folders"
        >
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true,
            }}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
          >
            {drawer}
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', sm: 'block' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { sm: `calc(100% - ${drawerWidth}px)` },
          }}
        >
          <Toolbar />
          <Outlet />
        </Box>

        {/* 个人设置对话框 */}
        <ProfileDialog
          open={profileDialogOpen}
          onClose={() => setProfileDialogOpen(false)}
        />
      </Box>
    </ProtectedRoute>
  );
};

export default Layout;
