document.addEventListener("DOMContentLoaded",function(){

    chrome.tabs.query({active:true, currentWindow:true}, function(tabs){
        //getting url of current tab
        const url = tabs[0].url || "";
        let message = document.getElementById("message");

        //checking if url is that of Facebook page
        if(url.includes("facebook.com")){
            message.textContent = "On Facebook rn!";
        } else {
            message.textContent = "Unsupported site! Only works on Facebook.";
        }
        
    })

});

