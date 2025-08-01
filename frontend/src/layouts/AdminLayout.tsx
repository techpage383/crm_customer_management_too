import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Alert,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  AdminPanelSettings,
  Dashboard,
  People,
  AccountCircle,
  Logout,
  ArrowBack,
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';

const drawerWidth = 260;

const adminMenuItems = [
  { text: 'システムダッシュボード', icon: <Dashboard />, path: '/admin/dashboard' },
  { text: 'ユーザー管理', icon: <People />, path: '/admin/users' },
];

export const AdminLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // @MOCK_UI: モック使用状態をチェック
  const isMockMode = process.env.NODE_ENV === 'development';

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
    handleMenuClose();
    navigate('/login');
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const drawer = (
    <div>
      <Toolbar>
        <AdminPanelSettings sx={{ mr: 1 }} color="primary" />
        <Typography variant="h6" noWrap component="div">
          管理メニュー
        </Typography>
      </Toolbar>
      <Divider />
      
      {/* ユーザーダッシュボードに戻るボタン */}
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={handleBackToDashboard}>
            <ListItemIcon><ArrowBack /></ListItemIcon>
            <ListItemText primary="ユーザーダッシュボード" />
          </ListItemButton>
        </ListItem>
      </List>
      <Divider />
      
      {/* 管理者メニュー */}
      <List>
        {adminMenuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* @MOCK_UI: モック使用時のバナー表示 */}
      {isMockMode && (
        <Alert 
          severity="warning" 
          sx={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            zIndex: 9999,
            borderRadius: 0 
          }}
        >
          ⚠️ モックデータ使用中 - 本番環境では使用不可
        </Alert>
      )}

      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          mt: isMockMode ? '48px' : 0, // @MOCK_UI: バナー分の余白
          bgcolor: 'secondary.main',
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
          <AdminPanelSettings sx={{ mr: 1 }} />
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            管理者モード - 顧客管理ツール
          </Typography>
          <Chip 
            label={`${user?.role?.toUpperCase()}`} 
            size="small" 
            color="primary" 
            sx={{ mr: 2 }} 
          />
          <IconButton color="inherit" onClick={handleMenuClick}>
            <Avatar sx={{ width: 32, height: 32 }}>
              <AccountCircle />
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem disabled>
              <Typography variant="body2">
                {user?.fullName || user?.email}
              </Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              ログアウト
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
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
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              mt: isMockMode ? '48px' : 0, // @MOCK_UI: バナー分の余白
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: isMockMode ? '112px' : '64px', // @MOCK_UI: AppBar + バナー分の余白
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};