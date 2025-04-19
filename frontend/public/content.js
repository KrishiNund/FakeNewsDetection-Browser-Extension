async function text_framing_analysis(text){
    let response = await fetch("http://127.0.0.1:5000/analyse_language_of_text", {
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
        return {label,explanations};
    } 
    catch(err){
        console.log("Error is: ", err);
        label = "Unexpected error"
        explanations = "Sentiment couldn't be processed!"
        return {label, explanations};
    }
}

async function detect_clickbait(headline){
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
        // console.log("label: ", label);
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

async function detect_fake_news(headline, text){
    let response = await fetch("http://127.0.0.1:5000/detect_fake_news", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json" 
        },
        body: JSON.stringify({ headline: headline, text: text})
    });
    try{
        let data = await response.json();
        label = data.label;
        return label;
    }
    catch(err){
        console.log("Error is: ", err);
        return "Unexpected error";
    }
}

//display or hide tooltip upon clicking on badge
function showTooltip(event){
    let tooltip = event.currentTarget.querySelector(".lmc-tooltip");
    if (tooltip.style.display === "block"){
        tooltip.style.display = "none";
    } else {
        tooltip.style.display = "block";
    }
}

let total_assessments = 0;
let correct_assessments = 0;
let incorrect_reported_assessments = 0;
//perform credibility assessment on text posts 
async function assess_credibility_of_posts(){
    //getting all post elements
    let posts = document.querySelectorAll('div.x1a2a7pz');
    for (let post of posts){
        //getting the text and url elements from the post
        let textElement = post.querySelector('div[data-ad-preview="message"]');
        let article = post.querySelector('div[data-ad-rendering-role="image"]');
        let source = post.querySelector('div[data-ad-rendering-role="profile_name"]');

        let articleHeadline;
        if (article){
            articleHeadline = post.querySelector('div.xmjcpbm.x1n2onr6.x1lku1pv span[data-ad-rendering-role="title"]');
        } else {
            articleHeadline = "";
        }
        //getting the menu button on the post (the three dots button)
        let menuButton = post.querySelector('div[aria-haspopup="menu"][aria-label="Actions for this post"]');
        
        //extracting the text and url from those elements
        let textContent = textElement ? textElement.innerText.trim() : 'No text';
        let headline = articleHeadline ? articleHeadline.innerText.trim(): "";
        let sourceContent = source ? source.innerText.trim(): "";

        //add badge to post if it does not already contain one
        if(!post.querySelector('.lmc-badge')){

            //creating a badge that will contain the credibility assessment
            let badge = document.createElement('div');
            badge.innerText = '🔍';
            badge.classList.add("lmc-badge");
            badge.onclick = showTooltip;

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

            //sending the extracted text and headline to the server for the different detection methods
            try{
                if (textContent !== 'No text'){
                    total_assessments += 1;
                    const [text_analysis, clickbait_result, fake_news_result] = await Promise.all([
                        text_framing_analysis(textContent),
                        headline.trim() ? detect_clickbait(headline) : "No headline available for classification!",
                        detect_fake_news(headline, textContent)
                    ]);
                    let {label, explanations} = text_analysis;
                    let clickbait_prediction = clickbait_result;
                    let fake_news_prediction = fake_news_result;

                    if (fake_news_prediction){
                        correct_assessments += 1;
                        updateDashboardDetails(total_assessments, correct_assessments, incorrect_reported_assessments);
                    }

                    tooltip.innerHTML = `
                        <div class="tooltip-header">🔍 Credibility Assessment</div>
                        <div class="tooltip-section">
                            <strong>🧠 Fake News Classification</strong>
                            <div class="fake-news-section">
                                <p>Prediction: ${fake_news_prediction}</p>
                                <button class="fake-news-report-button">🚨</button>
                            </div>
                        </div>
                        <div class="tooltip-section">
                            <strong>📢 Clickbait Detection</strong>
                            <p>Prediction: ${clickbait_prediction}</p>
                        </div>
                        <div class="tooltip-section">
                            <strong>📊 Text Framing Analysis</strong>
                            <p>Result: ${label}</p>
                            <p>Explanations:<br>${explanations}</p>
                        </div>
                    `;

                    tooltip.querySelector(".fake-news-report-button").addEventListener("click", () => {
                        report_prediction(headline, textContent, fake_news_prediction, sourceContent);
                        incorrect_reported_assessments += 1;
                        correct_assessments -= 1;
                        updateDashboardDetails(total_assessments, correct_assessments, incorrect_reported_assessments);
                    });
                    
                } else {
                    tooltip.innerHTML = `<div class="tooltip-header">Classification Not Available!</div>`;
                }
            } catch(err){
                console.log("Error is: ", err);
            }

        }

    }
}

function updateDashboardDetails(num_assessments, num_correct_assessments, num_incorrect_assessments){
    chrome.storage.local.set({
        total_assessments: num_assessments,
        num_correct_assessments: num_correct_assessments,
        num_incorrect_assessments: num_incorrect_assessments
    });
}

function report_prediction(headline, text, prediction, source){
    const confirm_report = confirm("Are you sure you want to report this prediction?")
    if (confirm_report){

        fetch("http://127.0.0.1:5000/report",{
            method: "POST",
            headers:{
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                headline: headline,
                text: text,
                source: source,
                prediction: prediction,
                actual_prediction: prediction === "False" ? "True" : "False",
            })
        })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
        })
        .catch(error => console.log("Error: ", error));
    }
}

//creating a Mutation observer to detect new posts as the user scrolls
const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation =>{
        if (mutation.addedNodes.length > 0){
            assess_credibility_of_posts();
        }
    })
})

//start observing the facebook feed
const feedContainer = document.querySelector('div.x9f619.x1n2onr6.x1ja2u2z');
if (feedContainer){
    observer.observe(feedContainer, {childList: true, subtree: true});
}

assess_credibility_of_posts();