import Image from 'next/image';
import React from 'react';
import Link from 'Link';

// material-ui
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Button,
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  Icon,
  IconButton,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Stack,
  Typography,
  useMediaQuery
} from '@mui/material';

// third party
import * as Yup from 'yup';
import { Formik } from 'formik';
import {  signIn } from 'nextauth';

// project imports
import useConfig from 'hooks/useConfig';
import useScriptRef from 'hooks/useScriptRef';


const Google = '/assets/images/icons/social-google.svg';
const Feishu = '/assets/images/logos/feishu.pn';
import TelegramIcon from '@mui/icons-material/Telegram';
import { Provider } from '@prisma/client/edge';
// import { signIn } from "next-auth/react"

// ============================|| Auth - LOGIN ||============================ //

const AuthLoginOrg = ({ providers, ...others }: { providers: Provider[] }) => {
  const theme = useTheme();
  const scriptedRef = useScriptRef();
  const matchDownSM = useMediaQuery(theme.breakpoints.down('md'));
  const { borderRadius } = useConfig();
  const [checked, setChecked] = React.useState(true);

  const [showPassword, setShowPassword] = React.useState(false);
  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event: React.SyntheticEvent) => {
    event.preventDefault();
  };

  return (
    <Grid container direction="column" justifyContent="center" spacing={2}>
      {providers.map((p, i, array) => { return <Grid key={i} item xs={12}>
        {p.type === 'FEISHU' && <Button
            disableElevation
            fullWidth
            onClick={() => signIn(p.id)}
            size="large"
            variant="outlined"
            sx={{
              color: 'grey.700',
              backgroundColor: theme.palette.mode === 'dark' ? theme.palette.dark.main : theme.palette.grey[50],
              borderColor: theme.palette.mode === 'dark' ? theme.palette.dark.light + 20 : theme.palette.grey[100]
            }}
          >
            <Box sx={{ mr: { xs: 1, sm: 2 }, width: 20, height: 20, marginRight: matchDownSM ? 8 : 16 }}>
              <TelegramIcon />
            </Box>
            飞书登陆
          </Button>}
        </Grid>;
      })}

      {/* <Grid item xs={12}>
          
            <Button
              disableElevation
              fullWidth
              onClick={()=> signIn('feishu')}
              size="large"
              variant="outlined"
              sx={{
                color: 'grey.700',
                backgroundColor: theme.palette.mode === 'dark' ? theme.palette.dark.main : theme.palette.grey[50],
                borderColor: theme.palette.mode === 'dark' ? theme.palette.dark.light + 20 : theme.palette.grey[100]
              }}
            >
              <Box sx={{ mr: { xs: 1, sm: 2 }, width: 20, height: 20, marginRight: matchDownSM ? 8 : 16 }}>
               <Image src={'/assets/images/logos/feishu.png'} width={20} height={20} alt={''}/>
              </Box>
              飞书登录
            </Button>
          
        </Grid> */}
    </Grid>
  );
};

export default AuthLoginOrg;

