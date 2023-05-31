import { useTheme, styled } from '@mui/material/styles';
import { Stack, Card, CardContent, CardMedia, Grid, Typography, Divider } from '@mui/material';
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import Box from '@mui/material/Box';

// project imports
import LAYOUT from 'constant';
import Layout from 'layout';
import Page from 'components/ui-component/Page';
import { ReactElement } from 'react';
import MainCard from 'ui-component/cards/MainCard';
import React from 'react';
import ResourceCard from './ResourceCard';

const ResourceList = () => {
  return (
    <Stack spacing={2}   divider={<Divider  flexItem />}>
        <ResourceCard />
        <ResourceCard />
    </Stack>
  );
};

export default ResourceList;
