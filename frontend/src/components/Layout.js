// src/components/Layout.js
import React from 'react';
import { Box, Container, AppBar, Toolbar, Typography, useTheme } from '@mui/material';
import JournalSelector from './JournalSelector';

const Layout = ({ children }) => {
  const theme = useTheme();
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Trading Journal
          </Typography>
          <JournalSelector />
        </Toolbar>
      </AppBar>
      <Container component="main" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        {children}
      </Container>
      <Box component="footer" sx={{ 
        py: 2, 
        mt: 'auto', 
        backgroundColor: theme.palette.grey[200],
        textAlign: 'center' 
      }}>
        <Typography variant="body2" color="text.secondary">
          Trading Journal &copy; {new Date().getFullYear()}
        </Typography>
      </Box>
    </Box>
  );
};

export default Layout;