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
import { useSession, signIn, signOut } from "next-auth/react"

// project imports
import useConfig from 'hooks/useConfig';
import useScriptRef from 'hooks/useScriptRef';


// assets
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { sign } from 'crypto';

const Google = '/assets/images/icons/social-google.svg';
import GitHubIcon from '@mui/icons-material/GitHub';
// import { getCsrfToken } from "next-auth/react"

// ============================|| Auth - LOGIN ||============================ //

const AuthLogin = ({ ...others }) => {
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
    <>
      <Grid container direction="column" justifyContent="center" spacing={2}>
        <Grid item xs={12}>
          
            <Button
              disableElevation
              fullWidth
              onClick={()=> signIn('github')}
              size="large"
              variant="outlined"
              sx={{
                color: 'grey.700',
                backgroundColor: theme.palette.mode === 'dark' ? theme.palette.dark.main : theme.palette.grey[50],
                borderColor: theme.palette.mode === 'dark' ? theme.palette.dark.light + 20 : theme.palette.grey[100]
              }}
            >
              <Box sx={{ mr: { xs: 1, sm: 2 }, width: 20, height: 20, marginRight: matchDownSM ? 8 : 16 }}>
               <GitHubIcon />
              </Box>
              Github登录
            </Button>
          
        </Grid>
        <Grid item xs={12}>
          
            <Button
              disableElevation
              fullWidth
              onClick={()=> signIn('clk0ug5vg000008mic3vxbx1i')}
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
          
        </Grid>
        <Grid item xs={12}>
          <Box
            sx={{
              alignItems: 'center',
              display: 'flex'
            }}
          >
            <Divider sx={{ flexGrow: 1 }} orientation="horizontal" />

            <Button
              variant="outlined"
              sx={{
                cursor: 'unset',
                m: 2,
                py: 0.5,
                px: 7,
                borderColor:
                  theme.palette.mode === 'dark' ? `${theme.palette.dark.light + 20} !important` : `${theme.palette.grey[100]} !important`,
                color: `${theme.palette.grey[900]}!important`,
                fontWeight: 500,
                borderRadius: `${borderRadius}px`
              }}
              disableRipple
              disabled
            >
              或者
            </Button>

            <Divider sx={{ flexGrow: 1 }} orientation="horizontal" />
          </Box>
        </Grid>
        <Grid item xs={12} container alignItems="center" justifyContent="center">
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1">邮箱登录</Typography>
          </Box>
        </Grid>
      </Grid>

      <Formik
        initialValues={{
          email: '',
          submit: null
        }}
        validationSchema={Yup.object().shape({
          email: Yup.string().email('邮箱地址不合法').max(255).required('请输入邮箱'),
        })}
        onSubmit={async (values, { setErrors, setStatus, setSubmitting }) => {
          try {
            const res = await signIn("email", { email: values.email });
            res;
            // await firebaseEmailPasswordSignIn(values.email, values.password).then(
            //   () => {
            //     // WARNING: do not set any formik state here as formik might be already destroyed here. You may get following error by doing so.
            //     // Warning: Can't perform a React state update on an unmounted component. This is a no-op, but it indicates a memory leak in your application.
            //     // To fix, cancel all subscriptions and asynchronous tasks in a useEffect cleanup function.
            //     // github issue: https://github.com/formium/formik/issues/2430
            //   },
            //   (err: any) => {
            //     if (scriptedRef.current) {
            //       setStatus({ success: false });
            //       setErrors({ submit: err.message });
            //       setSubmitting(false);
            //     }
            //   }
            // );
          } catch (err: any) {
            console.error(err);
            if (scriptedRef.current) {
              setStatus({ success: false });
              setErrors({ submit: err.message });
              setSubmitting(false);
            }
          }
        }}
      >
        {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
          <form noValidate onSubmit={handleSubmit} {...others}  >
            <FormControl fullWidth error={Boolean(touched.email && errors.email)} sx={{ ...theme.typography.customInput }}>
              <InputLabel htmlFor="outlined-adornment-email-login">邮箱地址</InputLabel>
              <OutlinedInput
                id="outlined-adornment-email-login"
                type="email"
                value={values.email}
                name="email"
                onBlur={handleBlur}
                onChange={handleChange}
                label="邮箱地址"
                inputProps={{}}
              />
              {touched.email && errors.email && (
                <FormHelperText error id="standard-weight-helper-text-email-login">
                  {errors.email}
                </FormHelperText>
              )}
            </FormControl>

           
            {/* <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
              <FormControlLabel
                control={
                  <Checkbox checked={checked} onChange={(event) => setChecked(event.target.checked)} name="checked" color="primary" />
                }
                label="记住我"
              />
            </Stack> */}
            {errors.submit && (
              <Box sx={{ mt: 3 }}>
                <FormHelperText error>{errors.submit}</FormHelperText>
              </Box>
            )}

            <Box sx={{ mt: 2 }}>
              
                <Button disableElevation disabled={isSubmitting} fullWidth size="large" type="submit" variant="contained" color="secondary">
                  注册/登录
                </Button>
              
            </Box>
          </form>
        )}
      </Formik>
    </>
  );
};

export default AuthLogin;

export async function getServerSideProps(context) {
    const csrfToken = await getCsrfToken(context)
    return {
      props: { csrfToken },
    }
  }