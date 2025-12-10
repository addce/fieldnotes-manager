import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import GlobalStyles from '@mui/material/GlobalStyles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { zhCN, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

import './i18n';
import Layout from './components/Layout/Layout';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Records from './pages/Records/Records';
import Participants from './pages/Participants/Participants';
import Fields from './pages/Fields/Fields';
import Tags from './pages/Tags/Tags';
import Users from './pages/Users/Users';
import { AuthProvider } from './contexts/AuthContext';

// 手写笔记风格主题
const theme = createTheme({
  palette: {
    primary: {
      main: '#5D4037',      // 深棕色墨水
      light: '#8B7355',
      dark: '#3E2723',
      contrastText: '#FFF8E7',
    },
    secondary: {
      main: '#A1887F',      // 柔和的暖棕色（代替红色）
      light: '#D7CCC8',
      dark: '#795548',
    },
    background: {
      default: '#FAF3E8',   // 温暖的米白色（更柔和）
      paper: '#FFFBF5',     // 接近奶白色的纸张
    },
    text: {
      primary: '#4E342E',   // 深棕色文字（略柔和）
      secondary: '#8D6E63', // 暖棕色次要文字
    },
    divider: '#E8DCC8',     // 柔和的分割线
    error: {
      main: '#D84315',      // 柔和的橙红色
    },
    warning: {
      main: '#EF6C00',      // 温暖的橙色
    },
    success: {
      main: '#689F38',      // 柔和的橄榄绿
    },
    info: {
      main: '#5D4037',      // 使用主色调
    },
  },
  typography: {
    // 使用系统字体，避免CDN加载延迟
    fontFamily: [
      '"PingFang SC"',      // macOS/iOS 中文
      '"Microsoft YaHei"',  // Windows 中文
      '"Hiragino Sans GB"', // macOS 中文备选
      '"SimSun"',           // Windows 宋体
      'Georgia',
      'serif',
    ].join(','),
    h1: {
      fontFamily: '"STKaiti", "KaiTi", "楷体", Georgia, serif',  // 楷体风格
      fontWeight: 400,
    },
    h2: {
      fontFamily: '"STKaiti", "KaiTi", "楷体", Georgia, serif',
      fontWeight: 400,
    },
    h3: {
      fontFamily: '"STKaiti", "KaiTi", "楷体", Georgia, serif',
      fontWeight: 400,
    },
    h4: {
      fontFamily: '"STKaiti", "KaiTi", "楷体", Georgia, serif',
      fontWeight: 400,
    },
    h5: {
      fontFamily: '"STKaiti", "KaiTi", "楷体", Georgia, serif',
      fontWeight: 400,
    },
    h6: {
      fontFamily: '"STKaiti", "KaiTi", "楷体", Georgia, serif',
      fontWeight: 400,
    },
    body1: {
      fontFamily: '"PingFang SC", "Microsoft YaHei", Georgia, serif',
      lineHeight: 1.8,
    },
    body2: {
      fontFamily: '"PingFang SC", "Microsoft YaHei", Georgia, serif',
      lineHeight: 1.6,
    },
    button: {
      fontFamily: '"STKaiti", "KaiTi", "楷体", Georgia, serif',
      fontWeight: 400,
    },
  },
  shape: {
    borderRadius: 2,        // 更方正的边角，像纸张
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage: `
            repeating-linear-gradient(
              transparent,
              transparent 31px,
              #E8DCC8 31px,
              #E8DCC8 32px
            )
          `,
          backgroundAttachment: 'local',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: '2px 2px 8px rgba(93, 64, 55, 0.15)',
          border: '1px solid #D7CCC8',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: `
            repeating-linear-gradient(
              transparent,
              transparent 27px,
              #F0E6D3 27px,
              #F0E6D3 28px
            )
          `,
          backgroundPosition: '0 12px',
          boxShadow: '3px 3px 10px rgba(93, 64, 55, 0.2)',
          border: '1px solid #D7CCC8',
          '&:hover': {
            boxShadow: '4px 4px 15px rgba(93, 64, 55, 0.25)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 4,
          padding: '8px 20px',
        },
        contained: {
          boxShadow: '2px 2px 4px rgba(93, 64, 55, 0.2)',
          '&:hover': {
            boxShadow: '3px 3px 6px rgba(93, 64, 55, 0.3)',
          },
        },
        outlined: {
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#FFFDF5',
            '& fieldset': {
              borderColor: '#BCAAA4',
              borderWidth: 1,
            },
            '&:hover fieldset': {
              borderColor: '#8D6E63',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#5D4037',
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px dashed #D7CCC8',
          fontFamily: '"Noto Serif SC", Georgia, serif',
        },
        head: {
          fontFamily: '"ZCOOL XiaoWei", serif',
          fontWeight: 400,
          backgroundColor: '#F5E6C8',
          borderBottom: '2px solid #8D6E63',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontFamily: '"Noto Serif SC", serif',
          borderRadius: 4,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#F5E6C8',
          borderRight: '2px solid #D7CCC8',
          backgroundImage: `
            repeating-linear-gradient(
              transparent,
              transparent 31px,
              #E8DCC8 31px,
              #E8DCC8 32px
            )
          `,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#5D4037',
          backgroundImage: 'none',
          boxShadow: '0 2px 8px rgba(62, 39, 35, 0.3)',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            backgroundColor: 'rgba(93, 64, 55, 0.12)',
            borderLeft: '3px solid #5D4037',
            '&:hover': {
              backgroundColor: 'rgba(93, 64, 55, 0.18)',
            },
          },
          '&:hover': {
            backgroundColor: 'rgba(93, 64, 55, 0.08)',
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontFamily: '"ZCOOL XiaoWei", serif',
          textTransform: 'none',
          fontSize: '1rem',
        },
      },
    },
  },
});

// 全局样式 - 引入Google Fonts
const globalStyles = (
  <GlobalStyles
    styles={{
      '@import': [
        'url("https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&family=ZCOOL+XiaoWei&family=Noto+Serif+SC:wght@400;500;600&display=swap")',
      ].join(','),
    }}
  />
);

// AppContent wrapper component for dynamic date locale switching
// Requirements: 7.1, 7.2, 7.3
const AppContent: React.FC = () => {
  const { i18n } = useTranslation();
  
  // Select dateLocale based on current language (zhCN for 'zh', enUS for 'en')
  const dateLocale = i18n.language === 'zh' ? zhCN : enUS;
  
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={dateLocale}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="records" element={<Records />} />
              <Route path="participants" element={<Participants />} />
              <Route path="fields" element={<Fields />} />
              <Route path="tags" element={<Tags />} />
              <Route path="users" element={<Users />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </LocalizationProvider>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
