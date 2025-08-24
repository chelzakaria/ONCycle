import React, { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { Link, useLocation } from 'react-router-dom';

const navLinks = [
  {
    label: (
      <span className="flex items-center space-x-2">
        <span
          className="shrink-0 animate-pulse rounded-tremor-full bg-emerald-500/30 p-1"
          aria-hidden={true}
        >
          <span className="block size-2 rounded-tremor-full bg-emerald-500" />
        </span>
        <span>Live Status</span>
      </span>
    ),
    simpleLabel: 'Live Status',
    path: '/status'
  },
  { label: 'Analytics', simpleLabel: 'Analytics', path: '/analytics' },
  { label: 'Predictions', simpleLabel: 'Predictions', path: '/predictions' },
];

const Navbar: React.FC = () => {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentTab = navLinks.findIndex(link => location.pathname.startsWith(link.path));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleDrawerClose = () => {
    setMobileOpen(false);
  };

  // Mobile drawer content
  const drawer = (
    <Box sx={{ width: 280, height: '100%', backgroundColor: '#101418' }}>
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        p: 2,
        borderBottom: '1px solid #333'
      }}>
        <Link
          to="/"
          style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
          onClick={handleDrawerClose}
        >
          <img src="/logo.svg" alt="ONCycle Logo" style={{ height: 32, width: 'auto' }} />
          <span style={{
            marginLeft: 8,
            fontSize: '1.25rem',
            fontWeight: 700,
            color: '#FFFFFF',
            fontFamily: 'Urbanist, sans-serif',
          }}>
            ONCycle
          </span>
        </Link>
        <IconButton onClick={handleDrawerClose} sx={{ color: '#FFFFFF' }}>
          <CloseIcon />
        </IconButton>
      </Box>
      <List sx={{ pt: 0 }}>
        {navLinks.map((link, index) => (
          <ListItem key={link.path} disablePadding>
            <ListItemButton
              component={Link}
              to={link.path}
              onClick={handleDrawerClose}
              selected={currentTab === index}
              sx={{
                py: 2,
                px: 3,
                '&.Mui-selected': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  '& .MuiListItemText-primary': {
                    color: '#FFFFFF',
                    fontWeight: 700,
                  }
                },
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                }
              }}
            >
              <ListItemText
                primary={link.simpleLabel}
                sx={{
                  '& .MuiListItemText-primary': {
                    fontFamily: 'Urbanist, sans-serif',
                    fontSize: '1rem',
                    color: currentTab === index ? '#FFFFFF' : '#B5B5B5',
                    fontWeight: currentTab === index ? 700 : 500,
                  }
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          backgroundColor: '#101418',
          color: '#FFFFFF',
          fontFamily: 'Urbanist, sans-serif',
          borderBottom: '1px solid #FFFFFF',
          height: { xs: '60px', md: '75px' },
        }}
      >
        <Toolbar sx={{
          minHeight: { xs: '60px !important', md: '75px !important' },
          px: { xs: 2, md: 4 },
          justifyContent: 'space-between'
        }}>
          {/* Logo */}
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              flexShrink: 0
            }}
          >
            <img
              src="/logo.svg"
              alt="ONCycle Logo"
              style={{
                height: isMobile ? 32 : 44,
                width: 'auto',
                display: 'block'
              }}
            />
            <span style={{
              marginLeft: isMobile ? 8 : 12,
              fontSize: isMobile ? '1.25rem' : '1.5rem',
              fontWeight: 700,
              color: '#FFFFFF',
              fontFamily: 'Urbanist, sans-serif',
              letterSpacing: '0.5px',
              display: isMobile ? 'none' : 'block'
            }}>
              ONCycle
            </span>
          </Link>

          {/* Desktop/Tablet Navigation */}
          {!isMobile && (
            <Box sx={{
              flexGrow: 1,
              display: 'flex',
              justifyContent: 'center',
              '& .MuiTabs-root': {
                minHeight: { xs: '60px', md: '75px' },
              },
              '& .MuiTab-root': {
                minHeight: { xs: '60px', md: '75px' },
                px: isTablet ? 4 : 10,
                fontSize: isTablet ? '0.9rem' : '1rem',
                fontWeight: 500,
                fontFamily: 'Urbanist, sans-serif',
                textTransform: 'none',
                letterSpacing: '0.5px',
                color: '#B5B5B5',
                '&.Mui-selected': {
                  color: '#FFFFFF',
                  fontWeight: 700,
                },
                '&:hover': {
                  color: '#FFFFFF',
                },
              },
            }}>
              <Tabs
                value={currentTab === -1 ? 0 : currentTab}
                textColor="inherit"
                indicatorColor="primary"
                sx={{
                  '& .MuiTabs-indicator': {
                    height: 3,
                    backgroundColor: '#FFFFFF',
                  },
                }}
              >
                {navLinks.map((link) => (
                  <Tab
                    key={link.path}
                    label={isTablet ? link.simpleLabel : link.label}
                    component={Link}
                    to={link.path}
                  />
                ))}
              </Tabs>
            </Box>
          )}

          {/* Mobile Menu Button */}
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="end"
              onClick={handleDrawerToggle}
              sx={{ color: '#FFFFFF' }}
            >
              <MenuIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            backgroundColor: '#101418',
            color: '#FFFFFF',
          },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default Navbar;