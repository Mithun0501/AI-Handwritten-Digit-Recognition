const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let drawing = false;

// ----------------------
// Canvas Style
// ----------------------
ctx.fillStyle = "white";
ctx.fillRect(0, 0, canvas.width, canvas.height);

ctx.strokeStyle = "black";
ctx.lineWidth = 12;
ctx.lineCap = "round";

// ----------------------
// Mouse Events
// ----------------------
canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mouseup", stopDraw);
canvas.addEventListener("mouseleave", stopDraw);
canvas.addEventListener("mousemove", draw);

// ----------------------
// Touch Events
// ----------------------
canvas.addEventListener("touchstart", touchStart);
canvas.addEventListener("touchmove", touchMove);
canvas.addEventListener("touchend", stopDraw);

function startDraw(e){

    drawing = true;

    ctx.beginPath();

    ctx.moveTo(
        e.offsetX,
        e.offsetY
    );

}

function stopDraw(){

    drawing = false;

    ctx.beginPath();

}

function draw(e){

    if(!drawing) return;

    ctx.lineTo(
        e.offsetX,
        e.offsetY
    );

    ctx.stroke();

    ctx.beginPath();

    ctx.moveTo(
        e.offsetX,
        e.offsetY
    );

}

// ----------------------
// Touch Support
// ----------------------

function getTouchPos(event){

    const rect = canvas.getBoundingClientRect();

    return{

        x:event.touches[0].clientX-rect.left,

        y:event.touches[0].clientY-rect.top

    };

}

function touchStart(event){

    event.preventDefault();

    drawing=true;

    const pos=getTouchPos(event);

    ctx.beginPath();

    ctx.moveTo(pos.x,pos.y);

}

function touchMove(event){

    event.preventDefault();

    if(!drawing) return;

    const pos=getTouchPos(event);

    ctx.lineTo(pos.x,pos.y);

    ctx.stroke();

    ctx.beginPath();

    ctx.moveTo(pos.x,pos.y);

}

// ----------------------
// Clear Canvas
// ----------------------

function clearCanvas(){

    ctx.fillStyle="white";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    document.getElementById("digit").innerHTML="-";

    document.getElementById("confidenceBar").style.width="0%";

    document.getElementById("confidenceBar").innerHTML="0%";

    document.getElementById("top3").innerHTML="Waiting...";

}

// ----------------------
// Predict
// ----------------------

async function predictDigit(){

    document.getElementById("loading").style.display="block";

    const image = canvas.toDataURL("image/png");

    const response = await fetch("/predict",{

        method:"POST",

        headers:{

            "Content-Type":"application/json"

        },

        body:JSON.stringify({

            image:image

        })

    });

    const data = await response.json();

    document.getElementById("loading").style.display="none";

    // Prediction
    document.getElementById("digit").innerHTML=data.digit;

    // Confidence
    const bar=document.getElementById("confidenceBar");

    bar.style.width=data.confidence+"%";

    bar.innerHTML=data.confidence+"%";

    // Color
    if(data.confidence>=90){

        bar.className="progress-bar bg-success progress-bar-striped progress-bar-animated";

    }
    else if(data.confidence>=70){

        bar.className="progress-bar bg-warning progress-bar-striped progress-bar-animated";

    }
    else{

        bar.className="progress-bar bg-danger progress-bar-striped progress-bar-animated";

    }

    // Top 3
    let html="";

    data.top3.forEach(function(item,index){

        let medal="🥇";

        if(index==1) medal="🥈";

        if(index==2) medal="🥉";

        html+=`

        <div class="top-card">

            <h5>${medal} Digit ${item.digit}</h5>

            <span>${item.confidence}%</span>

        </div>

        `;

    });

    document.getElementById("top3").innerHTML=html;

}