import { Stack,Typography,Paper,Checkbox,FormControlLabel,TextField,Radio,RadioGroup,FormHelperText,Button } from "@mui/material"
import { useState } from "react";

function validateUrl(url){
    if(url.length < 36) {alert("Enter a valid spreadsheet url"); return false;}
    else if(url.slice(0,36) != "https://docs.google.com/spreadsheets"){ alert("Enter a valid spreadsheet Url");return false;}
    else return true;
}

function Form1(props){
    let [shared,setShared] = useState(false);
    let [url,setUrl] = useState("");
    let [measurement,setMeasurement] = useState(true);

    function handleNext(){
        if(!shared) {
            alert("Share your spreadsheet to the given email and check the box")
            return;
        }

        // Validate the url
        if(url.length < 36) alert("Enter a valid spreadsheet url")
        else if(url.slice(0,36) !== "https://docs.google.com/spreadsheets") alert("Enter a valid spreadsheet Url")
        else  props.handleNext(url,measurement);
        props.handleNext(url,measurement);
    }

    return(
        <>
            <Stack alignItems={"center"} spacing={3}>
                <Typography variant='h4' textAlign={"center"}>
                    Step 1 of 2
                </Typography>
                <Paper  sx={{width:400}}>
                    <Stack alignItems={"center"} spacing={2} sx={{margin:2}}>
                        <FormControlLabel required control={<Checkbox value={shared} onChange={()=>{setShared(!shared)}}/>} label="Shared the spreadsheet"/>
                        <TextField required value={url} onChange={(e)=>{setUrl(e.target.value)}} label="Sheet Link"/>
                    </Stack>
                </Paper>
                <Paper  sx={{width:400}}>
                    <Stack alignItems={"center"}>
                        <Typography variant='h5'>Have you included SNF and Fat?</Typography>
                        <RadioGroup value={measurement} onChange={()=>setMeasurement(!measurement)}>
                            <FormHelperText>Select with measurement if SNF and Fat are entered</FormHelperText>
                            <FormControlLabel value={true} label="Yes" control={<Radio/>}/>
                            <FormControlLabel value={false} label="No" control={<Radio/>}/>
                        </RadioGroup>
                    </Stack>
                </Paper>
                <Button onClick={handleNext}>Next</Button>
            </Stack>
        </>
    )
}

export default Form1;