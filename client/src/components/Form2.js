import { Stack,Typography,Paper,Checkbox,FormControlLabel,TextField,Button } from "@mui/material"
import { useState } from "react";

function checkFloat(str){
    if(str === "") return false;
    let dot = false;
    for(let i=0;i<str.length;i++){
        let element = str[i];
        if(isNaN(parseInt(element))){
            if(!dot && element === '.') dot = true;
            else return false;
        }
    }

    if(parseFloat(str)<0) return false;
    return true;
}

function Form2(props){
    let [hasBM,setHasBM] = useState(false);
    let [BMNos,setBMNos] = useState([]);
    let [morningRates,setMorningRates] = useState({CM:"",BM:""});
    let [eveningRates,setEveningRates] = useState({CM:"",BM:""});
    let [aBMNo,setABMNo] = useState("");

    function handleAddBMNo(){
        if(!checkFloat(aBMNo) || !Number.isInteger(parseFloat(aBMNo)) || parseInt(aBMNo)<=0) {
            alert("Enter a positive number")
            return;
        }
        if(BMNos.indexOf(parseInt(aBMNo)) !== -1) {
            setABMNo("");
            return;
        }
        let newBMNos = BMNos
        newBMNos.push(parseInt(aBMNo));
        setBMNos(newBMNos);
        setABMNo("");
    }

    function handleSubmit(){
        // validate CM rates
        if(!checkFloat(morningRates.CM) || !checkFloat(eveningRates.CM)) {
            alert("Enter a proper value in CM rates")
            return;
        }
        morningRates.CM = parseFloat(morningRates.CM)
        eveningRates.CM = parseFloat(eveningRates.CM)

        // validate BM rates
        if(!hasBM){
          morningRates.BM = 0;
          eveningRates.BM = 0;  
        }else{
        if(!checkFloat(morningRates.BM) || !checkFloat(eveningRates.BM)) {
            alert("Enter a proper value in BM rates")
            return;
        }
        morningRates.BM = parseFloat(morningRates.BM)
        eveningRates.BM = parseFloat(eveningRates.BM)
        }
        BMNos.sort(function(a,b){return a-b});
        props.handleSubmit(BMNos,morningRates,eveningRates);
    }

    return(
        <>
            <Stack spacing={3} alignItems={"center"}>
                    <Typography variant='h4' textAlign={"center"}>
                    Step 2 of 2
                    </Typography>
                    <Paper sx={{width:400}}>
                        <Stack spacing={2} alignItems={"center"} sx={{margin:2}} >
                            <Typography variant='h5'>Buffalo Milk (BM) Numbers</Typography>
                            <FormControlLabel control={<Checkbox value={hasBM} onChange={()=>setHasBM(!hasBM)}/>} label="I have BM numbers"/>
                            <Stack direction={"row"} spacing={2}>
                                <TextField disabled={!hasBM} value={aBMNo} onChange={(e)=>setABMNo(e.target.value)} label="Enter a BM number"/>
                                <Button onClick={handleAddBMNo}>Add</Button>
                            </Stack>
                            <TextField disabled variant="filled" value={BMNos.join(",")} multiline label="Your BM Numbers"/>
                        </Stack>
                    </Paper>
                    <Paper sx={{width:400}}>
                        <Stack alignItems={"center"} spacing={2} sx={{margin:2}}>
                            <Typography variant='h5'>Morning</Typography>
                            <TextField required value={morningRates.CM} label="Cow Milk Rate"
                            onChange={(e)=>setMorningRates({...morningRates,CM:e.target.value})}/>
                            <TextField required={hasBM} value={morningRates.BM} disabled={!hasBM} label="Buffalo Milk Rate"
                            onChange={(e)=>setMorningRates({...morningRates,BM:e.target.value})}
                            />
                        </Stack>
                    </Paper>
                    <Paper sx={{width:400}}>
                        <Stack spacing={2} alignItems={"center"} sx={{margin:2}}>
                            <Typography variant='h5'>Evening</Typography>
                            <TextField required value={eveningRates.CM} label="Cow Milk Rate"
                            onChange={(e)=>setEveningRates({...eveningRates,CM:e.target.value})}
                            />
                            <TextField required={hasBM} value={eveningRates.BM} disabled={!hasBM} label="Buffalo Milk Rate"
                            onChange={(e)=>setEveningRates({...eveningRates,BM:e.target.value})}
                            />
                        </Stack>
                    </Paper>
                    <Button onClick={handleSubmit}>Submit</Button>
                </Stack>
        </>
    )
}

export default Form2;