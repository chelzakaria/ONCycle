import React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
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
    path: '/status' 
  },
  { label: 'Analytics', path: '/analytics' },
  { label: 'Predictions', path: '/predictions' },
];

const Navbar: React.FC = () => {
  const location = useLocation();
  // Find the current tab index based on the current path
  const currentTab = navLinks.findIndex(link => location.pathname.startsWith(link.path));

  return (
    <AppBar 
      position="fixed" 
      elevation={0}
      sx={{
        backgroundColor: '#101418',
        color: '#FFFFFF',
        fontFamily: 'Urbanist, sans-serif',
        borderBottom: '1px solid #FFFFFF',
        height: '75px',
      }}
    >
      <Toolbar sx={{ minHeight: '75px', px: { xs: 2, md: 4 } }}>
        {/* Logo left-aligned */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', flexGrow: 0, marginRight: 48, textDecoration: 'none' }}>
          <img src="/logo.svg" alt="ONCycle Logo" style={{ height: 44, width: 'auto', display: 'block' }} />
          <span style={{
            marginLeft: 12,
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#FFFFFF',
            fontFamily: 'Urbanist, sans-serif',
            letterSpacing: '0.5px'
          }}>
            ONCycle
          </span>
        </Link>
        {/* Centered Tabs */}
        <Box sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          justifyContent: 'center',
          '& .MuiTabs-root': {
            minHeight: '75px',
          },
          '& .MuiTab-root': {
            minHeight: '75px',
            px: 10,
            fontSize: '1rem',
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
                label={link.label}
                component={Link}
                to={link.path}
              />
            ))}
          </Tabs>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 