//extracting text facebook posts currently on the screen
let extractedPostContent = [];
function extractTextPosts(){
    //getting all post elements
    let posts = document.querySelectorAll('div.x1a2a7pz');
    posts.forEach(post => {
        //getting the text and url elements from the post
        let textElement = post.querySelector('div[data-ad-preview="message"]');
        let urlElement = post.querySelector('div[data-ad-rendering-role="meta"]');

        //getting the menu button on the post (the three dots button)
        let menuButton = post.querySelector('div[aria-haspopup="menu"]');
        
        //extracting the text and url from those elements
        let textContent = textElement ? textElement.innerText.trim() : 'No text';
        let urlContent = urlElement ? urlElement.innerText.trim() : 'No URL';

        //only add to array if text length is significant and the array does not already contain this text
        if(textContent.length > 20 && !post.querySelector('.lmc-badge')){
            extractedPostContent.push({text:textContent, url:urlContent});

            //creating a badge that will contain the credibility assessment
            let badge = document.createElement('div');
            badge.innerText = '🔍';
            badge.classList.add("lmc-badge");

            //creating the tooltip that will show the assessment details on hovering the badge
            let tooltip = document.createElement('div');
            tooltip.innerText = `Text: ${textContent}\nURL: ${urlContent}`;
            tooltip.classList.add("lmc-tooltip");

            badge.append(tooltip);

            //add badge next to menu button
            if (menuButton){
                menuButton.parentNode.insertBefore(badge, menuButton.nextSibling);
            } else {
                console.log("No Menu Button");
                // post.appendChild(badge);
            }
        }
    });

    //send the data to the background.js
    if (extractedPostContent.length > 0){
        console.log(extractedPostContent);
        chrome.runtime.sendMessage({data: extractedPostContent})
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