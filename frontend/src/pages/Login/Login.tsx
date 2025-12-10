import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Grid,
} from '@mui/material';
import {
  AutoStoriesRounded,
  EditNoteRounded,
  NaturePeopleRounded,
  ForestRounded,
  WbTwilightRounded,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { t } = useTranslation();
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!username || !password) {
      setError(t('auth.enterUsernamePassword'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(username, password);
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.message || t('auth.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#FAF3E8',
      }}
    >
      <Grid container sx={{ minHeight: '100vh' }}>
        {/* 左侧 - 装饰区域 */}
        <Grid
          size={{ xs: 12, md: 6 }}
          sx={{
            background: 'linear-gradient(135deg, #8B7355 0%, #5D4037 50%, #3E2723 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            p: { xs: 4, md: 6 },
            position: 'relative',
            overflow: 'hidden',
            // 纸张纹理效果
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `
                radial-gradient(circle at 20% 80%, rgba(255,255,255,0.05) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(255,255,255,0.03) 0%, transparent 50%)
              `,
            },
          }}
        >
          {/* 装饰图标 */}
          <Box sx={{ position: 'absolute', top: 40, left: 40, opacity: 0.15 }}>
            <ForestRounded sx={{ fontSize: 120, color: '#FFF8E7' }} />
          </Box>
          <Box sx={{ position: 'absolute', bottom: 60, right: 60, opacity: 0.1 }}>
            <NaturePeopleRounded sx={{ fontSize: 150, color: '#FFF8E7' }} />
          </Box>
          <Box sx={{ position: 'absolute', top: 100, right: 100, opacity: 0.08 }}>
            <WbTwilightRounded sx={{ fontSize: 80, color: '#FFF8E7' }} />
          </Box>

          {/* 主标题 */}
          <Box sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <AutoStoriesRounded
              sx={{
                fontSize: { xs: 60, md: 80 },
                color: '#FFF8E7',
                mb: 2,
              }}
            />
            <Typography
              variant="h2"
              sx={{
                color: '#FFF8E7',
                fontFamily: '"STKaiti", "KaiTi", "楷体", serif',
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                mb: 2,
                textShadow: '2px 2px 8px rgba(0,0,0,0.3)',
              }}
            >
              {t('login.systemTitle')}
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: 'rgba(255, 248, 231, 0.85)',
                fontFamily: '"STKaiti", "KaiTi", "楷体", serif',
                letterSpacing: 4,
                mb: 4,
              }}
            >
              {t('login.systemSubtitle')}
            </Typography>

            {/* 引言 */}
            <Box
              sx={{
                maxWidth: 360,
                mx: 'auto',
                mt: 4,
                p: 3,
                borderLeft: '3px solid rgba(255, 248, 231, 0.4)',
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  color: 'rgba(255, 248, 231, 0.9)',
                  fontStyle: 'italic',
                  lineHeight: 1.8,
                  fontFamily: '"PingFang SC", "Microsoft YaHei", serif',
                }}
              >
                "{t('login.quote')}"
              </Typography>
            </Box>

            {/* 特色点 */}
            <Box sx={{ mt: 5, display: { xs: 'none', md: 'block' } }}>
              {[t('login.features.recordObservations'), t('login.features.manageInterviews'), t('login.features.organizeTags')].map((text, i) => (
                <Box
                  key={text}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 1.5,
                    color: 'rgba(255, 248, 231, 0.8)',
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: '#C62828',
                      mr: 2,
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{ fontFamily: '"PingFang SC", "Microsoft YaHei", serif' }}
                  >
                    {text}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Grid>

        {/* 右侧 - 登录表单 */}
        <Grid
          size={{ xs: 12, md: 6 }}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            p: { xs: 3, sm: 6 },
            backgroundColor: '#FAF3E8',
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 5 },
              width: '100%',
              maxWidth: 420,
              backgroundColor: '#FFF8E7',
              border: '1px solid #E8DCC8',
              borderRadius: 2,
              boxShadow: '0 8px 32px rgba(93, 64, 55, 0.12)',
              position: 'relative',
            }}
          >
            {/* 语言切换器 */}
            <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
              <LanguageSwitcher />
            </Box>

            {/* 表单标题 */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography
                component="h1"
                variant="h4"
                sx={{
                  color: 'primary.main',
                  fontFamily: '"STKaiti", "KaiTi", "楷体", serif',
                  mb: 1,
                }}
              >
                {t('auth.welcome')}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontFamily: '"PingFang SC", "Microsoft YaHei", serif' }}
              >
                {t('auth.loginSubtitle')}
              </Typography>
            </Box>

            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  backgroundColor: 'rgba(198, 40, 40, 0.08)',
                  border: '1px solid rgba(198, 40, 40, 0.2)',
                  borderRadius: 1,
                }}
              >
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label={t('auth.researcherAccount')}
                name="username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label={t('auth.loginPassword')}
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{
                  mt: 4,
                  mb: 2,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontFamily: '"STKaiti", "KaiTi", "楷体", serif',
                  borderRadius: 1,
                }}
                disabled={loading}
                startIcon={loading ? null : <EditNoteRounded />}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  t('auth.enterResearchRoom')
                )}
              </Button>
            </Box>

            {/* 账户提示 */}
            <Box
              sx={{
                mt: 4,
                pt: 3,
                textAlign: 'center',
                borderTop: '1px dashed #E8DCC8',
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  fontStyle: 'italic',
                  fontSize: '0.85rem',
                }}
              >
                ✎ {t('auth.accountHint')}
              </Typography>
            </Box>
          </Paper>

          {/* 底部版权 */}
          <Typography
            variant="caption"
            sx={{
              mt: 4,
              color: 'text.disabled',
              fontFamily: '"PingFang SC", "Microsoft YaHei", serif',
            }}
          >
            {t('login.copyright')}
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Login;
