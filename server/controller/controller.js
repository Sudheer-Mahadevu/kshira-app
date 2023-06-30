const authenticate = require('../config/authentication');
const fs = require("fs");
const PDFDocument = require("pdfkit");
const path = require('path')

async function getBill(req,res){
    let start = Date.now();
    console.log(req.body)
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

    let morningTotals = producerTotal(morningValues,morningRates,morningProducerCount);
    let eveningTotals = producerTotal(eveningValues,eveningRates,eveningProducerCount);
    console.log(`Producer-wise totals calculated`)

    // TODO: Print to pdf and send response
    await generatePDF(morningValues,eveningValues,morningRates,eveningRates,morningTotals,eveningTotals,res);

    let stop = Date.now();
    console.log(`\nRequest sent.Input Size: ${inputSize}\nTook ${stop-start}ms to process the request`)
    console.log("Double OK")
    let filepath = path.join(__dirname,'/Bill01.pdf')

    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    await res.sendFile(filepath,{
        headers: {
          'Content-Type': 'application/pdf',
        },
      },err => {
        if (err) {
          console.error('Error sending file:', err);
          res.status(500).end();
        }})
    // fs.unlink(path.join(__dirname,'/Bill01.pdf'),(err)=>{
    //     if(err) throw err;
    //     console.log("Deleted file at "+path.join(__dirname,'/Bill01.pdf'));
    // })

    console.log("Triple OK")

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
                row[2] = row[2]/10;
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

            if(isBM === true) return Math.round(entry[2]*BMRate*100)/100;
            else return Math.round(entry[2]*CMRate*100)/100;
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
                [prev,Math.round(totalLtrs*10)/10,totalDays,Math.round(totalAmount*100)/100,Math.round(totalAmount*100/totalLtrs)/100];
            prev = values[i][1];
            totalAmount = 0, totalDays = 0, totalLtrs = 0;
            totalsEntered++;
        }

        totalLtrs += values[i][2];
        totalAmount += rates[i];
        totalDays++;
    }

    totals[totalsEntered] = 
                [prev,Math.round(totalLtrs*10)/10,totalDays,Math.round(totalAmount*100)/100,Math.round(totalAmount*100/totalLtrs)/100];
    
    return totals;
}

async function generatePDF(morningValues,eveningValues,morningRates,eveningRates,morningTotals,eveningTotals,res){
    let [totalRows,midProducer,midRows] = calculateTotalRows(morningTotals,eveningTotals,morningValues,eveningValues);
    console.log(totalRows,midProducer,midRows);
    // check correctness of above values : TODO: Do tests with large data to check the correctness
    let morningGrandTotal = calculateGrandTotals(morningTotals);
    let eveningGrandTotal = calculateGrandTotals(eveningTotals);
    // chaning the values into strings
    makeUniform(morningValues,'daybook')
    makeUniform(eveningValues,'daybook')
    makeUniform(morningRates,'rates')
    makeUniform(eveningRates,'rates')
    makeUniform(morningTotals,'totals')
    makeUniform(eveningTotals,'totals')
    const doc = new PDFDocument({font:'Courier',margins:{left:14,right:14,top:48,bottom:48}});
    // doc.pipe(res);
    doc.pipe(fs.createWriteStream(__dirname+'/Bill01.pdf'));
    let mor1 = 0, eve1 = 0;
    let mor2 = midRows.morning, eve2 = midRows.evening;
    let mor1Lim =midRows.morning, eve1Lim = midRows.evening;
    let mor2Lim = morningValues.length, eve2Lim = eveningValues.length;
    /*TODO:
        There are two ways to put the available values on pdf:
        1. Create a string for each row,do string concantenation 3 times for each row (we concantenate at the end of each if)
        2. To keep track of the coordinates of the cursor and move the cursor to the req place by .moveTo() function

        String concantenation is expensive, keeping track of cords is simple arthmetic and doesnot take any time
        However, I donot how how expensive is .moveTo() function which is inside the pdfkit module relative to string concat.
        Moving to a given position in pdf may be expensive, but not very sure. So, a testing needed to be done
        for large values for both the methods.

        For now, proceed with the simple string concat.
        It seems + operation is faster than .join and .concat, so proceeding with it
    */ 
    doc.text('       MORNING            EVENING              MORNING            EVENING')
    doc.text('  DT PDC LTRS AMOUNT DT PDC LTRS AMOUNT   DT PDC LTRS AMOUNT DT PDC LTRS AMOUNT')
    while((mor2<mor2Lim|| eve2<eve2Lim) || (mor1<mor1Lim || eve1<eve1Lim)){
        let text;   
        let m1 = false, m2 = false,e1 = false,e2 = false;
        if(mor1<mor1Lim &&(eve1 >= eve1Lim || parseInt(morningValues[mor1][1]) <= parseInt(eveningValues[eve1][1]))){
            let row = morningValues[mor1];
            text = `  ${row[0]} ${row[1]} ${row[2]} ${morningRates[mor1]} `
            m1 = true;
        }else{
            text = '                     '
        }

        if(eve1 < eve1Lim && (mor1>=mor1Lim || parseInt(eveningValues[eve1][1])<=parseInt(morningValues[mor1][1]))){
            let row = eveningValues[eve1];
            text += `${row[0]} ${row[1]} ${row[2]} ${eveningRates[eve1]}    `
            e1 = true;
        }else{
            text += '                      '
        }

        if(mor2<mor2Lim &&(eve2 >= eve2Lim || parseInt(morningValues[mor2][1]) <= parseInt(eveningValues[eve2][1]))){
            let row = morningValues[mor2];
            text += `${row[0]} ${row[1]} ${row[2]} ${morningRates[mor2]} `
            m2 = true;
        }else{
            text += '                   '
        }

        if(eve2 < eve2Lim && (mor2>=mor2Lim || parseInt(eveningValues[eve2][1])<=parseInt(morningValues[mor2][1]))){
            let row = eveningValues[eve2];
            text += `${row[0]} ${row[1]} ${row[2]} ${eveningRates[eve2]} `
            e2 = true;
        }else{
            text += '                   '
        }
        // console.log(text);
        doc.text(text);
        if(m1 === true) mor1++; 
        if(e1 === true) eve1++;
        if(m2 === true) mor2++; 
        if(e2 === true) eve2++;
    }

    // Putting totals
    mor1 =0; eve1 = 0;
    mor1Lim = morningTotals.length, eve1Lim = eveningTotals.length;
    let sno = 1;
    doc.addPage();
    doc.text('              MORNING            EVENING                TOTAL')
    doc.text('  SNo PDC DY LTRS  AMOUNT    DY LTRS  AMOUNT    LTRS  AMOUNT   AVG.RT')
    while(mor1<mor1Lim || eve1<eve1Lim){
        let producer;
        if(mor1<mor1Lim && eve1 < eve1Lim){
            producer = `${Math.min(parseInt(morningTotals[mor1][0]),parseInt(eveningTotals[eve1][0]))}`.padEnd(3,' ');
        }else if(mor1>=mor1Lim){
            producer = eveningTotals[eve1][0]
        }else{
            producer = morningTotals[mor1][0]
        }

        let text = `  ${sno}  ${producer} `
        if(sno<10) text = `  ${sno}   ${producer} `
        if(sno>99) text = `  ${sno} ${producer} `
        let totalLitres = 0, totalAmount = 0;
        let m1 = false,e1 = false;
        if(mor1<mor1Lim &&(eve1 >= eve1Lim || parseInt(morningTotals[mor1][0]) <= parseInt(eveningTotals[eve1][0]))){
            let row = morningTotals[mor1];
            text += `${row[2]} ${row[1]} ${row[3]}  `
            totalLitres += parseFloat(row[1])
            totalAmount += parseFloat(row[3])
            m1 = true;
        }else{
            text += '0  0     0         '
        }

        if(eve1 < eve1Lim && (mor1>=mor1Lim || parseInt(eveningTotals[eve1][0]) <= parseInt(morningTotals[mor1][0]))){
            let row = eveningTotals[eve1];
            text += `${row[2]} ${row[1]} ${row[3]}  `
            totalLitres += parseFloat(row[1])
            totalAmount += parseFloat(row[3])
            e1 = true;
        }else{
            text += '0  0     0         '
        }

        totalLitres = Math.round(totalLitres*10)/10;
        totalAmount = Math.round(totalAmount*100)/100;
        let  avgRate = Math.round(totalAmount*100/totalLitres)/100;
        totalLitres = `${totalLitres}`.padEnd(5,' ');
        totalAmount = `${totalAmount}`.padEnd(8,' ');
        text += `${totalLitres} ${totalAmount} ${avgRate}`;
        doc.text(text);

        if(m1 === true) mor1++; if(e1===true) eve1++;
        sno++;
    }

    
    let gtLitres = morningGrandTotal.litres+eveningGrandTotal.litres;
    let gtAmount = morningGrandTotal.amount+eveningGrandTotal.amount;
    let gtAvgRate = gtAmount/gtLitres;
    gtLitres = Math.round(gtLitres*10)/10;
    gtAmount = Math.round(gtAmount*100)/100;
    gtAvgRate = Math.round(gtAvgRate*100)/100;
    doc.moveDown()
    doc.text('  TOTALS      LITRES   AMOUNT   AVG. RATE')
    doc.text(`  MORNING     ${morningGrandTotal.litres}   ${morningGrandTotal.amount}  ${morningGrandTotal.avgRate}`)
    doc.text(`  EVENING     ${eveningGrandTotal.litres}   ${eveningGrandTotal.amount}  ${eveningGrandTotal.avgRate}`)
    doc.text(`  GRAND TOTAL ${gtLitres}   ${gtAmount}  ${gtAvgRate}`)
    
    // For totals, it is 73 chars per row.SNo. 3 chars (maxNum 999) and one space total 77 chars
    // only 4 chars reamin works

    //  total 81 chars per row. Each entry takes 18 chars. 18+1 *4 -1 = 75. 6 chars left. 2 each at both sides
    // and 2 extra, total 3 at the page centre.

    doc.end();
    console.log('\nPdf is created')
}

function makeUniform(values,type){
    if(type ===  'rates'){
        values.forEach((e,index)=>{
            values[index] = e.toFixed(2).padEnd(6,' '); //daily amount
        })
    }else if(type === 'daybook'){
        values.forEach(row=>{
            row[0] = `${row[0]}`.padEnd(2,' '); //day
            row[1] = `${row[1]}`.padEnd(3,' '); // producer
            row[2] =  row[2].toFixed(1).padEnd(4,' ') // litres
        })
    }else if(type==='totals'){
        values.forEach(row=>{
            row[0] = `${row[0]}`.padEnd(3,' '); // producer
            row[1] =  row[1].toFixed(1).padEnd(5,' '); // litres
            row[2] = `${row[2]}`.padEnd(2,' '); // days
            row[3] =  row[3].toFixed(2).padEnd(8,' '); // amount
            row[4] =  row[4].toFixed(2).padEnd(5,' '); // avg rate
        })
    }
}

function calculateGrandTotals(totals){
    let gtLitres =0, gtAmount = 0;
    totals.forEach(row=>{
        gtLitres += row[1]
        gtAmount += row[3]
    })

    gtLitres = Math.round(gtLitres*10)/10;
    gtAmount = Math.round(gtAmount*100)/100;
    gtAvgRate = Math.round(gtAmount*100/gtLitres)/100;

    let grandTotals = {
        litres : gtLitres,
        amount : gtAmount,
        avgRate: gtAvgRate
    }

    return grandTotals;
}

function calculateTotalRows(morningTotals,eveningTotals,morningValues,eveningValues)
// doesnot work if there are deltas
{
    let totalRows = 0;
    let topRows = 0;
    let bottomRows = 0;
    let midProducer = 0;
    let topM = 0,topE = 0
    let bottomM = morningTotals.length-1;
    let bottomE = eveningTotals.length-1;
    let topProducer,bottomProducer;
    let midM = 0,midE=0;

    do{
        // Advance one step from top choosing minimum of M and E
        if(morningTotals[topM][0] === eveningTotals[topE][0]){
            topProducer = morningTotals[topM][0];
            totalRows += Math.max(morningTotals[topM][2],eveningTotals[topE][2]);
            topRows += Math.max(morningTotals[topM][2],eveningTotals[topE][2]);
            midM +=  morningTotals[topM][2];
            midE += eveningTotals[topE][2];
            topM++; topE++;
        }else if(morningTotals[topM][0] < eveningTotals[topE][0]){
            topProducer = morningTotals[topM][0];
            totalRows += morningTotals[topM][2];
            topRows += morningTotals[topM][2];
            midM +=  morningTotals[topM][2];
            topM++;
        }else{
            topProducer = eveningTotals[topE][0];
            totalRows += eveningTotals[topE][2];
            topRows += eveningTotals[topE][2];
            midE += eveningTotals[topE][2];
            topE++;
        }

        if(topProducer === bottomProducer) break;
        if(bottomRows>topRows) continue;

        // advance one step from bottom choosing maximum of M and E
        if(morningTotals[bottomM][0] === eveningTotals[bottomE][0]){
            bottomProducer = morningTotals[bottomM][0];
            totalRows += Math.max(morningTotals[bottomM][2],eveningTotals[bottomE][2]);
            bottomRows += Math.max(morningTotals[bottomM][2],eveningTotals[bottomE][2]);
            bottomE--; bottomM--;
        }else if(morningTotals[bottomM][0] > eveningTotals[bottomE][0]){
            bottomProducer = morningTotals[bottomM][0];
            totalRows += morningTotals[bottomM][2];
            bottomRows += morningTotals[bottomM][2];
            bottomM--;
        }else{
            bottomProducer = eveningTotals[bottomE][0];
            totalRows += eveningTotals[bottomE][2];
            bottomRows += eveningTotals[bottomE][2];
            bottomE--;
        }
    }while(topProducer<=bottomProducer)

    midProducer = topProducer;
    // going for inefficient way to find the starting index of midProducer temporarily
    // Find a better way to do it after sometime with a fresh prespective
    let midRows = {
        morning : midM,
        evening : midE,
    };
    // console.log(midM);
    // console.log(morningValues[midM]);

    return [totalRows,midProducer,midRows];

}


// function printValues(doc,morningValues,eveningValues,midM,midE){
//     let row = 0;
//     let leftM =0, leftE = 0;
//     let rightM = midM, rightE = midE;
//     let curMorn,curEve;
//     while(true){
//         doc.text(`${morningValues[leftM]}`)
//     }
    
// }

module.exports = getBill;