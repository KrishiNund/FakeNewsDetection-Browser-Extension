//extracting text facebook posts currently on the screen
let extractedPostContent = [];
function extractTextPosts(){
    let posts = document.querySelectorAll('div.x1n2onr6.x1ja2u2z'); //[data-ad-rendering-role="meta"] div[data-ad-preview="message"]
    posts.forEach(post => {
        //getting the text and url elements from the post
        let textElement = post.querySelector('div[data-ad-preview="message"]');
        let urlElement = post.querySelector('div[data-ad-rendering-role="meta"]');
        //get close button from the post
        // let closeButton = post.querySelector('a[aria-label="hide post"]');
        let menuButton = post.querySelector('div[aria-haspopup="menu"]');
        
        //extracting the text and url from those elements
        let textContent = textElement ? textElement.innerText.trim() : 'No text';
        let urlContent = urlElement ? urlElement.innerText.trim() : 'No URL';

        //only add to array if text length is considerable and text is not duplicate
        if(textContent.length > 20 && !post.querySelector('.lmc-badge')){
            extractedPostContent.push({text:textContent, url:urlContent});

            //create a badge that will contain the credibility assessment
            let badge = document.createElement('div');
            badge.innerText = '🔍';
            badge.classList.add("lmc-badge");

            let tooltip = document.createElement('div');
            tooltip.innerText = `Text: ${textContent}\nURL: ${urlContent}`;
            tooltip.classList.add("lmc-tooltip");

            badge.append(tooltip);

            //add badge next to close button
            if (menuButton){
                console.log("it does exist");
                menuButton.parentNode.insertBefore(badge, menuButton.nextSibling);
            } else {
                post.appendChild(badge);
            }
        }
    });

    //send the data to the background.js
    if (extractedPostContent.length > 0){
        console.log(extractedPostContent);
        chrome.runtime.sendMessage({data: extractedPostContent})
    }
    
}

//Mutation observer to detect new posts as user scrolls
const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation =>{
        if (mutation.addedNodes.length > 0){
            extractTextPosts();
        }
    })
})

//start observing the facebook feed
const feedContainer = document.querySelector('div.x1hc1fzr.x1unhpq9.x6o7n8i');
if (feedContainer){
    observer.observe(feedContainer, {childList: true, subtree: true});
}

extractTextPosts();