const authenticate = require('../config/authentication');


async function getBill(req,res){
    let start = Date.now();
    console.log(`\nRequest recieved at ${Date(start)}`)
    let [morningValues,eveningValues,inputSize] = await getValues(req.body.spreadsheetUrl);

    console.log("\nData acquisition done!")

    sortValues(morningValues);
    sortValues(eveningValues);

    // TODO: This can be done much simply if array destructuring happens properly
    // Find what is happening in array destructuring and try to simplify the code
    let morningRates,eveningRates,morningProducerCount,eveningProducerCount;
    if(req.body.withMeasurement === false){
        let {result,producerCount} = 
            ratesWithoutMeasurement(morningValues,req.body.rates.morning,req.body.BMNumbers);
        morningProducerCount = producerCount, morningRates = result;
    }else{
        let {result,producerCount} = ratesWithMeasurement(morningValues,req.rateScheme);
        morningProducerCount = producerCount, morningRates = result;
    }

    if(req.body.withMeasurement === false){
        let {result,producerCount} = 
            ratesWithoutMeasurement(eveningValues,req.body.rates.evening,req.body.BMNumbers);
        eveningProducerCount = producerCount, eveningRates = result;
    }else{
        let {result,producerCount} = ratesWithMeasurement(eveningValues,req.rateScheme);
        eveningProducerCount = producerCount, eveningRates = result;
    }


    console.log(`\nRates successfully calculated\nMorning Producer Count:${morningProducerCount}\nEvening Producer Count:${eveningProducerCount}`);

    // TODO: Find possible errors

    // TODO: Calculate the totals for each producer
    let morningTotals = producerTotal(morningValues,morningRates,morningProducerCount);
    let eveningTotals = producerTotal(eveningValues,eveningRates,eveningProducerCount);
    console.log(`Producer-wise totals calculated`)

    // TODO: Print to pdf and send response

    let stop = Date.now();
    console.log(`\nRequest sent.Input Size: ${inputSize}\nTook ${stop-start}ms to process the request`)
    res.send('Double OK')
    
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
and producer count
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
        
        return {result,producerCount};
}

function ratesWithMeasurement(values,rateScheme){

}

function producerTotal(values,rates,producerCount){
    let totals = Array.from(Array(producerCount), ()=> new Array(5));

    let prev = values[0][1],totalLtrs = 0,totalDays = 0,totalAmount =0;
    let totalsEntered = 0;
    for(let i=0;i<values.length;i++){
        if(values[i][1] != prev){
            totals[totalsEntered] = 
                [prev,totalLtrs/10,totalDays,Math.round(totalAmount*100)/100,Math.round(totalAmount*1000/totalLtrs)/100];
            prev = values[i][1];
            totalAmount = 0, totalDays = 0, totalLtrs = 0;
            totalsEntered++;
        }

        totalLtrs += values[i][2];
        totalAmount += rates[i];
        totalDays++;
    }

    totals[totalsEntered] = 
                [prev,totalLtrs,totalDays,Math.round(totalAmount*100)/100,Math.round(totalAmount*1000/totalLtrs)/100];

    return totals;
}

module.exports = getBill;