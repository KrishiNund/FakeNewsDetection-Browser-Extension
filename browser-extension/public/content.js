//extracting text facebook posts currently on the screen
// let extractedPostContent = [];

async function sendTextToServer(text){
    let response = await fetch("http://127.0.0.1:5000/clean_text", {
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
        console.log("label:", label, "explanations:", explanations);
        return {label,explanations};
    } 
    catch(err){
        console.log("Error is: ", err);
    }
}

async function extractTextPosts(){
    // let cleaned_text;
    //getting all post elements
    let posts = document.querySelectorAll('div.x1a2a7pz');
    for (let post of posts){
        //getting the text and url elements from the post
        let textElement = post.querySelector('div[data-ad-preview="message"]');
        let urlElement = post.querySelector('div[data-ad-rendering-role="meta"]');

        //getting the menu button on the post (the three dots button)
        let menuButton = post.querySelector('div[aria-haspopup="menu"][aria-label="Actions for this post"]');
        
        //extracting the text and url from those elements
        let textContent = textElement ? textElement.innerText.trim() : 'No text';
        let urlContent = urlElement ? urlElement.innerText.trim() : 'No URL';

        //add badge to post if it does not already contain one
        if(!post.querySelector('.lmc-badge')){
            // extractedPostContent.push({text:cleaned_text, url:urlContent});

            //creating a badge that will contain the credibility assessment
            let badge = document.createElement('div');
            badge.innerText = '🔍';
            badge.classList.add("lmc-badge");

            //creating the tooltip that will show the assessment details on hovering the badge
            let tooltip = document.createElement('div');
            tooltip.innerText = "Analyzing...";
            tooltip.classList.add("lmc-tooltip");

            badge.append(tooltip);

            //add badge next to menu button
            if (menuButton){
                menuButton.parentNode.insertBefore(badge, menuButton.nextSibling);
            }

            //sending the extracted text to be cleaned in the server.py
            try{
                if (textContent !== 'No text'){
                    let {label, explanations} = await sendTextToServer(textContent);
                    // let label = sentiment_analysis.label;
                    // let explanations = sentiment_analysis.explanations;
                    tooltip.innerText = "";
                    tooltip.innerText = `Sentiment Analysis:\nLabel:${label}\nExplanations:\n${explanations} \nURL: ${urlContent}`;
                } else {
                    tooltip.innerText = "";
                    tooltip.innerText = "Classification Not Available!";
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