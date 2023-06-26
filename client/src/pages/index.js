import Grid from '@mui/material/Unstable_Grid2';
import Box from '@mui/material/Box';
import { Checkbox,Radio ,Stack,Paper, FormControlLabel, TextField, Typography, RadioGroup, FormHelperText, Button } from '@mui/material';
import { CopyToClipboard } from "react-copy-to-clipboard";

function Form1(){
    return(
        <>
            <Stack alignItems={"center"} spacing={3}>
                    <Paper  sx={{width:400}}>
                    <Stack alignItems={"center"} spacing={2} sx={{margin:2}}>
                    <FormControlLabel required control={<Checkbox/>} label="Shared the spreadsheet"/>
                    <TextField required label="Sheet Link"/>
                    </Stack>
                    </Paper>
                    <Paper  sx={{width:400}}>
                    <Stack alignItems={"center"}>
                    <Typography variant='h5'>Measurement</Typography>
                    <RadioGroup defaultValue="true">
                        <FormHelperText>Select with measurement if SNF and Fat are entered</FormHelperText>
                        <FormControlLabel value="true" label="with measurement" control={<Radio/>}/>
                        <FormControlLabel value="false" label="without measurement" control={<Radio/>}/>
                    </RadioGroup>
                    </Stack>
                    </Paper>
                    <Button>Next</Button>
                </Stack>
        </>
    )
}

function LandingPage(){
    return(
        <Grid container rowSpacing={2}>
            <Grid xs={2}>
                <Box
                component="img"
                alt = "logo"
                src = {require("../images/logo96.png")}
                />
            </Grid>
            <Grid mdOffset={1.5} md={5} xs={10}> 
                <Typography textAlign={"center"} variant={"h1"}>
                    Billculator
                </Typography>
            </Grid>
            <Grid xs={12}>
                <Typography textAlign={"center"} variant = "h3">
                    Calcuate bills instantly from your mobile...
                </Typography>
            </Grid>
            <Grid xs={12}>
                <Typography textAlign={"center"} variant = "h4">
                    Before you submit the spreadsheet link,share it to the following email id:
                </Typography>
            </Grid>
            <Grid xs={12} mdOffset={3.5} md={4}>
                <Typography sx={{fontSize:"4"}}>
                    sheet-reader@petty-pretty-pre-jul20-project.iam.gserviceaccount.com
                </Typography>
            </Grid>
            <Grid xsOffset={5} mdOffset={0} xs={2}>
                <CopyToClipboard
                    text= "sheet-reader@petty-pretty-pre-jul20-project.iam.gserviceaccount.com"
                    onCopy={()=>alert("Copied")}>
                    <span>Copy Email Id</span>
                </CopyToClipboard>
            </Grid>
            <Grid xs={12} >
            {/* Put a stepper here instead */}
                <Typography variant='h4' textAlign={"center"}>
                    Step 1 of 2
                </Typography>
            </Grid>
            <Grid xs={12}>
                <Form1/>
            </Grid>
        </Grid>
    )
}

export default LandingPage;