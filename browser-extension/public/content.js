//extracting text facebook posts currently on the screen
// let extractedPostContent = [];

async function sendTextToServer(text){
    let response = await fetch("http://127.0.0.1:5000/analyse_sentiment_of_text", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({text: text})
    });

    try{
        let data = await response.json();
        label = data.label;
        explanations = data.explanations;
        // console.log("label:", label, "explanations:", explanations);
        return {label,explanations};
    } 
    catch(err){
        console.log("Error is: ", err);
        label = "Unexpected error"
        explanations = "Sentiment couldn't be processed!"
        return {label, explanations};
    }
}

async function sendHeadlineToServer(headline){
    let response = await fetch("http://127.0.0.1:5000/detect_clickbait", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json" 
        },
        body: JSON.stringify({ headline: headline })
    });
    try{
        let data = await response.json();
        label = data.clickbait;
        console.log("label is: ", label);
        if (label == true){
            return "Clickbait";
        } else {
            return "Not Clickbait";
        }
    }
    catch(err){
        console.log("Error is: ", err);
        return "Unexpected error";
    }
}

async function sendHeadlineAndTextToServer(headline, text){
    let response = await fetch("http://127.0.0.1:5000/detect_fake_news", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json" 
        },
        body: JSON.stringify({ headline: headline, text: text})
    });
    try{
        let data = await response.json();
        label = data.fake_news;
        console.log("label is: ", label);
        if (label == true){
            return "True"
        } else {
            return "False";
        }
    }
    catch(err){
        console.log("Error is: ", err);
        return "Unexpected error";
    }
}

async function extractTextPosts(){
    //getting all post elements
    let posts = document.querySelectorAll('div.x1a2a7pz');
    for (let post of posts){
        //getting the text and url elements from the post
        let textElement = post.querySelector('div[data-ad-preview="message"]');

        let article = post.querySelector('div[data-ad-rendering-role="image"]');
        let articleHeadline;
        // let urlElement;
        if (article){
            articleHeadline = post.querySelector('div.xmjcpbm.x1n2onr6.x1lku1pv span[data-ad-rendering-role="title"]');
            // urlElement = post.querySelector('div.xmjcpbm.x1n2onr6 div[data-ad-rendering-role="image"][role="link"]');
        } else {
            articleHeadline = "";
            // urlElement = "";
        }
        //getting the menu button on the post (the three dots button)
        let menuButton = post.querySelector('div[aria-haspopup="menu"][aria-label="Actions for this post"]');
        
        //extracting the text and url from those elements
        let textContent = textElement ? textElement.innerText.trim() : 'No text';
        let headline = articleHeadline ? articleHeadline.innerText.trim(): "";
        // let urlContent = urlElement ? urlElement.href: 'No URL';

        //add badge to post if it does not already contain one
        if(!post.querySelector('.lmc-badge')){

            //creating a badge that will contain the credibility assessment
            let badge = document.createElement('div');
            badge.innerText = '🔍';
            badge.classList.add("lmc-badge");

            //creating the tooltip that will show the assessment details on hovering the badge
            let tooltip = document.createElement('div');
            tooltip.classList.add("lmc-tooltip");
            tooltip.innerHTML = `
                <div class="tooltip-header">Analysing...</div>
                <div class="tooltip-section">Please wait...</div>
                <div class="tooltip-section">Please wait...</div>
                <div class="tooltip-section">Please wait...</div>
            `;

            badge.append(tooltip);

            //add badge next to menu button
            if (menuButton){
                menuButton.parentNode.insertBefore(badge, menuButton.nextSibling);
            }

            //sending the extracted text to be cleaned in the server.py
            try{
                if (textContent !== 'No text'){
                    let clickbait_prediction;
                    let fake_news_prediction;

                    let {label, explanations} = await sendTextToServer(textContent);
                    if (headline !== ""){
                        clickbait_prediction = await sendHeadlineToServer(headline);
                    } else {
                        clickbait_prediction = "No headline available for classification!";
                    }

                    try{
                        fake_news_prediction = await sendHeadlineAndTextToServer(headline, textContent);
                    } catch(err){
                        fake_news_prediction = "No prediction available!";
                    }

                    tooltip.innerHTML = `
                        <div class="tooltip-header">🔍 Fake News Analysis</div>
                        <div class="tooltip-section">
                            <strong>🧠 AI Model Classification</strong>
                            <p>Prediction: ${fake_news_prediction} </p>
                            <p>Explanations: <br>1. reason one<br> 2. reason two </p>
                        </div>
                        <div class="tooltip-section">
                            <strong>📢 Clickbait Detection</strong>
                            <p>${headline}</p>
                            <p>Prediction: ${clickbait_prediction}</p>
                            <p>Explanations: <br>1. reason one<br> 2. reason two</p>
                        </div>
                        <div class="tooltip-section">
                            <strong>📊 Text Framing Analysis</strong>
                            <p>Result: ${label}</p>
                            <p>Explanations:<br>${explanations}</p>
                        </div>
                    `;
                } else {
                    // tooltip.innerHTML = "";
                    tooltip.innerHTML = `<div class="tooltip-header">Classification Not Available!</div>`;
                }
            } catch(err){
                console.log("Error is: ", err);
            }

        }

    }
}
//creating a Mutation observer to detect new posts as the user scrolls
const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation =>{
        if (mutation.addedNodes.length > 0){
            extractTextPosts();
        }
    })
})

//start observing the facebook feed
const feedContainer = document.querySelector('div.x9f619.x1n2onr6.x1ja2u2z');
if (feedContainer){
    observer.observe(feedContainer, {childList: true, subtree: true});
}

extractTextPosts();