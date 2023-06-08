const authenticate = require('../config/authentication');


async function getBill(req,res){
    let start = Date.now();
    console.log(`Request recieved at ${Date(start)}`)
    let [morningValues,eveningValues,inputSize] = await getValues(req.body.spreadsheetUrl);

    sortValues(morningValues);
    sortValues(eveningValues);

    let morningRates,eveningRates,morningProducerCount,eveningProducerCount;
    if(req.body.withMeasurement === false){
        morningRates = 
        ratesWithoutMeasurement(morningValues,req.body.rates.morning,req.body.BMNumbers)
        eveningRates
            = ratesWithoutMeasurement(eveningValues,req.body.rates.evening,req.body.BMNumbers)
    }else{
        morningRates = ratesWithMeasurement(morningValues,req.rateScheme);
        eveningRates = ratesWithMeasurement(eveningValues,req.rateScheme);
    }

    console.log(`Rates successfully calculated\nProducer Count:${morningProducerCount}`);
    let stop = Date.now();
    console.log(`Request sent.Input Size: ${inputSize}\nTook ${stop-start}ms to process the request`)
    res.send('Double OK')

    eveningValues.forEach((entry,index)=>{
        console.log(entry,eveningRates[index]);
    })

    // TODO: Find possible errors

    // TODO: Calculate the totals for each producer

    // TODO: Print to pdf and send response
    
}

async function getValues(spreadsheetUrl)
/*
Takes the spreadsheetUrl and returns the day-book values (morning
and evening) and the total input size.
The result has the dates filled.
*/ 
{
        const service = await authenticate();
        const spreadsheetId = spreadsheetUrl.slice(39,83);
        ranges = ["Sheet1!A:E","Sheet2!A:E"]

        const {data} = await service.spreadsheets.values.batchGet({
            spreadsheetId,
            ranges,
            valueRenderOption: "UNFORMATTED_VALUE",
        })

        let inputSize = data.valueRanges[0].values.length+
                        data.valueRanges[1].values.length;

        // TODO : verify format
        verifyFromat();


        data.valueRanges.forEach(range=>{
            let date;
            range.values.forEach(row=>{
                if(row[0] != '') date = row[0];
                else row[0] = date;
            })
        })

        console.log("Data acquisition done!")
        return [data.valueRanges[0].values,data.valueRanges[1].values,inputSize];

}


async function verifyFromat(){
    return;
}

function sortValues(values)
/*
Sorts the day-book values with the producer as the first preference
and returns the same array.
The values input should be ordered datewise
*/ 

{
    function compare(arr1,arr2){
        if(arr1[1]<arr2[1]) return -1;
        else if(arr1[1]===arr2[1]) return 0;
        else return 1;
    }

    values.sort(compare);
    return values;

}

function ratesWithoutMeasurement(values,rates,BMNumbers)
/*
Calculates the rates to the given input and returns the rates array
Numbers in BMNumbers array are given a separate rate
*/ 

{
        let CMRate = rates.CM
        let BMRate = rates.BM
        BMNumbers.sort();
        let BMIndex = 0;
        let previous = -1;
        let producerCount = 0;
        let result =  values.map((entry) => {
            if(entry[1] != previous){
                isBM = false;
                for(let i=BMIndex;i<BMNumbers.length;i++){
                    if(BMNumbers[i]===entry[1]){
                        isBM = true;
                        BMIndex++;
                        break;
                    }else if (BMNumbers[i] > entry[1]) break;
                    else BMIndex++;
                }
                previous = entry[1];
                producerCount++;
            }

            if(isBM === true) return entry[2]*BMRate/10;
            else return entry[2]*CMRate/10;
        });
        
        console.log(`Producer Count: ${producerCount}`);
        return result;
}

function ratesWithMeasurement(values,rateScheme){

}

function producerTotal(values,rates){

}

module.exports = getBill;