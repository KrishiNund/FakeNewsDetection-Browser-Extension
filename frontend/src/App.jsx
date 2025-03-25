import React, { useEffect, useState } from "react";
import Dashboard from "./components/Dashboard";
import UnsupportedPage from "./components/UnsupportedPage";

function App() {
  const [content, setContent] = useState(null);

  useEffect(() => {
    //obtaining current URL of page extension is being used on
    chrome.tabs.query({active:true, currentWindow:true}, function(tabs){
      //getting url of current tab
      const url = tabs[0].url || "";
  
      //checking if url is that of Facebook page
      if(url.includes("facebook.com")){
          setContent(<Dashboard />);
      } else {
          setContent(<UnsupportedPage />);
      }  
    });
  }, [])
  
  return (
    <div id="content">
      {content}
    </div>
  )
}

export default App
