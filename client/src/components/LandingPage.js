import Grid from '@mui/material/Unstable_Grid2';
import Box from '@mui/material/Box';
import { Typography, responsiveFontSizes } from '@mui/material';
import { CopyToClipboard } from "react-copy-to-clipboard";
import Form1 from "./From1"
import Form2 from "./Form2";
import { useState } from 'react';

async function sendReq(d){
    fetch('http://localhost:4000/',{method:'POST',body:JSON.stringify(d),headers: {
        'Content-Type': 'application/json',
      }})
      .then(response => {
        if (!response.ok) {
          throw new Error('Error - ' + response.status);
        }
        return response.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'filename.pdf');
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
      })
      .catch(error => {
        console.error('Error:', error);
    });
}



function LandingPage(){
    let [stepNo,setStepNo] = useState(1);
    let [formData,setFormData] = useState({});
    console.log(formData)
    
    function handleForm1(url,wm){
        setFormData({...formData,spreadsheetUrl:url,withMeasurement:wm})
        if(wm===true){
            alert("The 'with mesurement functionality' will be deployed soon.\nTry without mesurement")
        }else{
            setStepNo(2);
        }
    }

    function handleForm2(BMNos,morningRates,eveningRates){
        let newFormData = {...formData,
            BMNumbers : BMNos,
            rates : {
                morning : morningRates,
                evening : eveningRates
            },
            rateScheme : null
        }; 
        console.log("sending request")
        console.log(newFormData)
        sendReq(newFormData).then(()=> 
            {
            console.log("request processed")
            setStepNo(1)
            }
        );
        
        //make a request and setLoading until response comes
    }

    let form;
    if(stepNo === 1) form = <Form1 handleNext={(url,wm)=>handleForm1(url,wm)}/>
    else if(stepNo === 2) form = <Form2 handleSubmit={(BMNos,morningRates,eveningRates)=>{handleForm2(BMNos,morningRates,eveningRates)}}/>

    return(
        <Grid container rowSpacing={2}>
            <Grid xs={2}>
                <Box
                component="img"
                alt = "logo"
                src = {require("../images/logo100.png")}
                />
            </Grid>
            <Grid mdOffset={1.5} md={5} xs={10}> 
                <Typography color={"#00ccff"} textAlign={"center"} variant={"h1"}>
                    Kshira
                </Typography>
            </Grid>
            <Grid xs={12}>
                <Typography color={"#ff80aa"} textAlign={"center"} variant = "h3">
                    Calcuate bills instantly from your mobile...
                </Typography>
            </Grid>
            <Grid xs={12}>
                <Typography color={"#ff1a1a"} textAlign={"center"} variant = "h4">
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
                    <span color='#ff3300'>Copy Email Id</span>
                </CopyToClipboard>
            </Grid>
            <Grid xs={12}>
                {form}
            </Grid>
        </Grid>
    )
}

export default LandingPage;