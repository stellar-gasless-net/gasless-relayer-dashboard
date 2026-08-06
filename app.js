document.addEventListener("DOMContentLoaded", () => {


/* =========================
   Theme Toggle
========================= */


const themeToggle = document.getElementById("themeToggle");


const savedTheme = localStorage.getItem("theme");


if(savedTheme === "light"){

  document.body.classList.add("light-theme");

  if(themeToggle){
    themeToggle.innerHTML = "🌙 Dark Mode";
  }

}



if(themeToggle){

themeToggle.addEventListener("click",()=>{


  document.body.classList.toggle("light-theme");


  const isLight =
  document.body.classList.contains("light-theme");


  localStorage.setItem(
    "theme",
    isLight ? "light" : "dark"
  );


  themeToggle.innerHTML =
  isLight
  ? "🌙 Dark Mode"
  : "☀️ Light Mode";


});


}




/* =========================
   Navigation Tabs
========================= */


const navItems =
document.querySelectorAll(".nav-item");


const tabs =
document.querySelectorAll(".tab-content");



navItems.forEach(item=>{


item.addEventListener("click",()=>{


navItems.forEach(nav=>{
nav.classList.remove("active");
});


tabs.forEach(tab=>{
tab.style.display="none";
});



item.classList.add("active");


const target =
item.dataset.tab;


const section =
document.getElementById(target);



if(section){

section.style.display="block";

}



});


});





/* =========================
   Deposit Modal
========================= */


const depositModal =
document.getElementById("depositModal");


const openDeposit =
document.getElementById("openDepositBtn");


const closeDeposit =
document.getElementById("closeDepositBtn");



if(openDeposit){

openDeposit.onclick=()=>{

depositModal.style.display="flex";

};

}



if(closeDeposit){

closeDeposit.onclick=()=>{

depositModal.style.display="none";

};

}




const depositForm =
document.getElementById("depositForm");



let usdcBalance = 500;

let promoBalance = 250;



document.querySelectorAll(".openDepositModalBtn")
.forEach(btn=>{


btn.onclick=()=>{

depositModal.style.display="flex";

};

});



if(depositForm){


depositForm.addEventListener("submit",(e)=>{


e.preventDefault();


const amount =
Number(
document.getElementById("depositAmount").value
);



usdcBalance += amount;


const balance =
document.getElementById(
"paymasterUsdcBalance"
);


if(balance){

balance.innerHTML =
usdcBalance+" XLM";

}



showToast(
"Deposit completed successfully"
);



depositModal.style.display="none";



});


}






/* =========================
 API Key Modal
========================= */


const apiModal =
document.getElementById("apiKeyModal");


const openApi =
document.querySelectorAll(
"#openApiKeyBtnMain,#openApiKeyBtnOverview"
);


openApi.forEach(btn=>{


btn.onclick=()=>{

apiModal.style.display="flex";

};


});



const closeApi =
document.getElementById(
"closeApiKeyBtn"
);



if(closeApi){

closeApi.onclick=()=>{

apiModal.style.display="none";

};

}




const apiForm =
document.getElementById("apiKeyForm");



if(apiForm){


apiForm.addEventListener("submit",(e)=>{


e.preventDefault();


const name =
document.getElementById(
"apiKeyName"
).value;



const key =
"st_gas_"+Math.random()
.toString(36)
.substring(2,12);



const row = `

<tr>

<td>${name}</td>

<td>
<code>${key}</code>
</td>

<td>
30 req/min
</td>

<td>
100,000
</td>

<td>
<span class="badge">
Active
</span>
</td>

<td>
<button 
class="btn btn-secondary copy-key-btn"
data-key="${key}">
Copy Key
</button>
</td>

</tr>

`;



const table =
document.getElementById(
"apiKeysMainTableBody"
);



if(table){

table.innerHTML += row;

}



bindCopyButtons();


apiModal.style.display="none";


showToast(
"API Key created"
);



});


}







/* =========================
 Copy API Key
========================= */


function bindCopyButtons(){


document
.querySelectorAll(".copy-key-btn")
.forEach(btn=>{


btn.onclick=()=>{


navigator.clipboard.writeText(
btn.dataset.key
);


showToast(
"API Key copied"
);


};


});


}


bindCopyButtons();







/* =========================
 Transaction Search
========================= */


const search =
document.getElementById(
"searchTxInput"
);



if(search){


search.addEventListener("input",()=>{


const value =
search.value.toLowerCase();


document
.querySelectorAll(
"#allTxTableBody tr"
)
.forEach(row=>{


row.style.display =
row.innerText
.toLowerCase()
.includes(value)
?
""
:
"none";


});


});


}







/* =========================
 Demo Simulator
========================= */


const runDemo =
document.getElementById(
"runFullDemoBtn"
);



if(runDemo){


runDemo.onclick=()=>{


const box =
document.getElementById(
"demoProgressBox"
);



const result =
document.getElementById(
"demoResultReceiptBox"
);



box.style.display="block";



let progress=0;



const interval =
setInterval(()=>{


progress+=25;


document
.getElementById(
"demoProgressBar"
)
.style.width =
progress+"%";



if(progress>=100){


clearInterval(interval);


box.style.display="none";


result.style.display="block";


showToast(
"Transaction confirmed"
);



}



},500);



};


}







/* =========================
 CSV Export
========================= */


const exportBtn =
document.getElementById(
"exportCsvBtn"
);



if(exportBtn){


exportBtn.onclick=()=>{


const csv =
"Hash,Status\n3389...ecb9,Success";


const blob =
new Blob(
[csv],
{
type:"text/csv"
}
);



const url =
URL.createObjectURL(blob);



const a =
document.createElement("a");


a.href=url;

a.download=
"transactions.csv";


a.click();


showToast(
"CSV exported"
);



};


}







/* =========================
 Toast
========================= */


function showToast(message){


const toast =
document.createElement("div");


toast.className="toast";


toast.innerText=message;


document.body.appendChild(toast);



setTimeout(()=>{

toast.classList.add("show");

},100);



setTimeout(()=>{


toast.remove();


},3000);



}



});