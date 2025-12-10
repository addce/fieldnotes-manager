import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  DescriptionOutlined as RecordsIcon,
  PeopleAltOutlined as ParticipantsIcon,
  MapOutlined as FieldsIcon,
  BookmarkBorderOutlined as TagsIcon,
  CreateOutlined as CreateIcon,
  BorderColorOutlined as EditIcon,
  TodayOutlined as CalendarIcon,
  AccessTimeOutlined as TimeIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

// ============ 类型定义 ============
interface OverviewStats {
  records_count: number;
  participants_count: number;
  fields_count: number;
  tags_count: number;
}

interface RecentActivity {
  id: number;
  type: string;
  action: string;
  title: string;
  created_at: string;
  creator_name?: string;
}

const API_BASE = 'http://localhost:8000/api/v1';

// 统计卡片组件 - 手写笔记风格
interface StatCardProps {
  title: string;
  count: number;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
  recordCountLabel: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, count, icon, color, onClick, recordCountLabel }) => (
  <Card
    sx={{
      height: '100%',
      cursor: 'pointer',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': {
        transform: 'translateY(-4px) rotate(-0.5deg)',
        boxShadow: '5px 5px 15px rgba(93, 64, 55, 0.25)',
      },
      position: 'relative',
      overflow: 'visible',
      // 书签效果
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 12,
        right: -8,
        width: 24,
        height: 40,
        backgroundColor: color,
        opacity: 0.8,
        clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 85%, 0 100%)',
      },
    }}
    onClick={onClick}
  >
    <CardContent sx={{ pb: 2 }}>
      <Box display="flex" alignItems="flex-start" justifyContent="space-between">
        <Box>
          <Typography
            color="textSecondary"
            gutterBottom
            sx={{
              fontFamily: '"STKaiti", "KaiTi", "楷体", serif',
              fontSize: '1rem',
              borderBottom: '2px solid',
              borderColor: color,
              display: 'inline-block',
              pb: 0.5,
            }}
          >
            {title}
          </Typography>
          <Typography
            variant="h3"
            component="h2"
            sx={{
              fontFamily: '"STKaiti", "KaiTi", "楷体", serif',
              color: color,
              mt: 1,
            }}
          >
            {count}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ fontStyle: 'italic', mt: 0.5 }}
          >
            {recordCountLabel}
          </Typography>
        </Box>
        <Box sx={{ color, fontSize: 36, opacity: 0.6, mt: 1 }}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

// 快速操作卡片组件 - 便签风格
interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  bgColor?: string;
  startRecordingLabel: string;
}

const QuickActionCard: React.FC<QuickActionProps> = ({ title, description, icon, onClick, bgColor = '#FFF8E7', startRecordingLabel }) => (
  <Card
    sx={{
      height: '100%',
      backgroundColor: bgColor,
      transition: 'transform 0.2s',
      '&:hover': {
        transform: 'rotate(1deg) scale(1.02)',
      },
      // 便签纸效果
      boxShadow: '3px 3px 10px rgba(93, 64, 55, 0.15), -1px -1px 3px rgba(255, 255, 255, 0.5)',
    }}
  >
    <CardContent>
      <Box display="flex" alignItems="center" mb={2}>
        <Box sx={{ mr: 2, color: 'primary.main' }}>
          {icon}
        </Box>
        <Typography
          variant="h6"
          component="h2"
          sx={{ fontFamily: '"STKaiti", "KaiTi", "楷体", serif' }}
        >
          {title}
        </Typography>
      </Box>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ fontStyle: 'italic' }}
      >
        {description}
      </Typography>
    </CardContent>
    <CardActions sx={{ pt: 0 }}>
      <Button
        size="small"
        onClick={onClick}
        startIcon={<CreateIcon />}
        sx={{ fontFamily: '"STKaiti", "KaiTi", "楷体", serif' }}
      >
        {startRecordingLabel}
      </Button>
    </CardActions>
  </Card>
);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();

  // ============ 状态 ============
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState<OverviewStats>({
    records_count: 0,
    participants_count: 0,
    fields_count: 0,
    tags_count: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'error' as 'success' | 'error',
  });

  // ============ 获取统计数据 ============
  const fetchStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // 并行获取统计概览和最近活动
      const [overviewRes, activitiesRes] = await Promise.all([
        axios.get(`${API_BASE}/stats/overview`, { headers }),
        axios.get(`${API_BASE}/stats/recent-activities?limit=5`, { headers }),
      ]);

      setStatsData(overviewRes.data);
      setRecentActivities(activitiesRes.data.items || []);
    } catch (error) {
      console.error('获取统计数据失败:', error);
      setSnackbar({
        open: true,
        message: '获取统计数据失败，请刷新页面重试',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // 获取今天的日期
  const today = new Date();
  const dateLocale = i18n.language === 'zh' ? 'zh-CN' : 'en-US';
  const dateString = today.toLocaleDateString(dateLocale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  // 统计数据配置
  const stats = [
    {
      title: t('dashboard.fieldRecords'),
      count: statsData.records_count,
      icon: <RecordsIcon sx={{ fontSize: 36 }} />,
      color: '#5D4037',  // 深棕色
      path: '/records',
    },
    {
      title: t('dashboard.participants'),
      count: statsData.participants_count,
      icon: <ParticipantsIcon sx={{ fontSize: 36 }} />,
      color: '#558B2F',  // 橄榄绿
      path: '/participants',
    },
    {
      title: t('dashboard.fields'),
      count: statsData.fields_count,
      icon: <FieldsIcon sx={{ fontSize: 36 }} />,
      color: '#E65100',  // 橙棕色
      path: '/fields',
    },
    {
      title: t('dashboard.tags'),
      count: statsData.tags_count,
      icon: <TagsIcon sx={{ fontSize: 36 }} />,
      color: '#C62828',  // 红色
      path: '/tags',
    },
  ];

  const quickActions = [
    {
      title: t('dashboard.newFieldRecord'),
      description: t('dashboard.newFieldRecordDesc'),
      icon: <RecordsIcon />,
      action: () => navigate('/records/new'),
      bgColor: '#FFF8E7',
    },
    {
      title: t('dashboard.addParticipant'),
      description: t('dashboard.addParticipantDesc'),
      icon: <ParticipantsIcon />,
      action: () => navigate('/participants/new'),
      bgColor: '#F1F8E9',
    },
    {
      title: t('dashboard.createField'),
      description: t('dashboard.createFieldDesc'),
      icon: <FieldsIcon />,
      action: () => navigate('/fields/new'),
      bgColor: '#FFF3E0',
    },
    {
      title: t('dashboard.manageTags'),
      description: t('dashboard.manageTagsDesc'),
      icon: <TagsIcon />,
      action: () => navigate('/tags'),
      bgColor: '#FFEBEE',
    },
  ];

  return (
    <Box>
      {/* 日期与欢迎 - 笔记本首页风格 */}
      <Paper
        sx={{
          p: 3,
          mb: 4,
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            left: 30,
            top: 0,
            bottom: 0,
            width: 2,
            backgroundColor: '#C62828',
            opacity: 0.3,
          },
        }}
      >
        <Box sx={{ pl: { xs: 0, sm: 4 } }}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <CalendarIcon sx={{ color: 'text.secondary' }} />
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ fontStyle: 'italic' }}
            >
              {dateString}
            </Typography>
          </Box>
          <Typography
            variant="h4"
            sx={{
              fontFamily: '"STKaiti", "KaiTi", "楷体", serif',
              color: 'primary.main',
            }}
          >
            {user?.full_name || user?.username}{i18n.language === 'zh' ? '，' : ', '}{t('dashboard.welcomeMessage')}
          </Typography>
          <Box display="flex" alignItems="center" gap={1} mt={1}>
            <EditIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Chip
              label={user?.role === 'admin' ? t('users.roles.admin') : t('users.roles.researcher')}
              size="small"
              sx={{
                backgroundColor: user?.role === 'admin' ? 'rgba(93, 64, 55, 0.1)' : 'rgba(85, 139, 47, 0.1)',
                color: user?.role === 'admin' ? 'primary.main' : 'success.main',
                fontFamily: '"PingFang SC", "Microsoft YaHei", serif',
              }}
            />
          </Box>
        </Box>
      </Paper>

      {/* 统计卡片 - 带书签效果 */}
      <Box mb={4}>
        <Typography
          variant="h5"
          gutterBottom
          sx={{
            fontFamily: '"STKaiti", "KaiTi", "楷体", serif',
            borderBottom: '2px solid #D7CCC8',
            pb: 1,
            mb: 3,
          }}
        >
          ☰ {t('dashboard.overview')}
        </Typography>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {stats.map((stat) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={stat.title}>
                <StatCard
                  title={stat.title}
                  count={stat.count}
                  icon={stat.icon}
                  color={stat.color}
                  onClick={() => navigate(stat.path)}
                  recordCountLabel={t('dashboard.recordCount')}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* 快速操作 - 便签风格 */}
      <Box mb={4}>
        <Typography
          variant="h5"
          gutterBottom
          sx={{
            fontFamily: '"STKaiti", "KaiTi", "楷体", serif',
            borderBottom: '2px solid #D7CCC8',
            pb: 1,
            mb: 3,
          }}
        >
          ▸ {t('dashboard.quickActions')}
        </Typography>
        <Grid container spacing={3}>
          {quickActions.map((action) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={action.title}>
              <QuickActionCard
                title={action.title}
                description={action.description}
                icon={action.icon}
                onClick={action.action}
                bgColor={action.bgColor}
                startRecordingLabel={t('dashboard.startRecording')}
              />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* 最近活动 - 日记本风格 */}
      <Paper
        sx={{
          p: 3,
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            left: 30,
            top: 0,
            bottom: 0,
            width: 2,
            backgroundColor: '#C62828',
            opacity: 0.3,
          },
        }}
      >
        <Box sx={{ pl: { xs: 0, sm: 4 } }}>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ fontFamily: '"STKaiti", "KaiTi", "楷体", serif' }}
          >
            ▸ {t('dashboard.recentActivity')}
          </Typography>
          <Divider sx={{ my: 2, borderStyle: 'dashed' }} />

          {loading ? (
            <Box display="flex" justifyContent="center" py={3}>
              <CircularProgress size={24} />
            </Box>
          ) : recentActivities.length > 0 ? (
            <List disablePadding>
              {recentActivities.map((activity, index) => {
                // 获取活动图标
                const getActivityIcon = () => {
                  switch (activity.type) {
                    case 'record': return <RecordsIcon sx={{ color: '#5D4037' }} />;
                    case 'participant': return <ParticipantsIcon sx={{ color: '#558B2F' }} />;
                    case 'field': return <FieldsIcon sx={{ color: '#E65100' }} />;
                    default: return <TagsIcon sx={{ color: '#C62828' }} />;
                  }
                };

                // 格式化时间
                const formatTime = (dateStr: string) => {
                  const date = new Date(dateStr);
                  const now = new Date();
                  const diff = now.getTime() - date.getTime();
                  const minutes = Math.floor(diff / 60000);
                  const hours = Math.floor(diff / 3600000);
                  const days = Math.floor(diff / 86400000);

                  if (minutes < 60) return t('common.timeAgo.minutesAgo', { count: minutes });
                  if (hours < 24) return t('common.timeAgo.hoursAgo', { count: hours });
                  if (days < 7) return t('common.timeAgo.daysAgo', { count: days });
                  return date.toLocaleDateString(dateLocale);
                };

                return (
                  <ListItem
                    key={`${activity.type}-${activity.id}`}
                    sx={{
                      py: 1.5,
                      borderBottom: index < recentActivities.length - 1 ? '1px dashed #E8DCC8' : 'none',
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {getActivityIcon()}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {activity.title}
                        </Typography>
                      }
                      secondary={
                        <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                          <TimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            {formatTime(activity.created_at)}
                          </Typography>
                          {activity.creator_name && (
                            <Typography variant="caption" color="text.secondary">
                              · {activity.creator_name}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                );
              })}
            </List>
          ) : (
            <>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ fontStyle: 'italic', py: 3, textAlign: 'center' }}
              >
                "{t('dashboard.emptyQuote')}"
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textAlign: 'center' }}
              >
                {t('dashboard.noActivity')}{i18n.language === 'zh' ? '，' : ', '}{t('dashboard.firstNoteHint')}
              </Typography>
            </>
          )}
        </Box>
      </Paper>

      {/* Snackbar 提示 */}
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

export default Dashboard;
