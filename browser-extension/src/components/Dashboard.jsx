// import React, { useState } from "react";

// const [postsAnalysed,setPostsAnalysed] = useState(0)

function Dashboard(){
    return(
        <div className="flex flex-col w-3xs h-28 bg-[#415A77] items-center justify-center text-lg font-semibold text-[#E0E1DD]">
            <div className="flex justify-center items-center gap-x-4">
                <p>Posts Analysed:</p>
                <p>0</p>
            </div>
            <div className="flex justify-center items-center gap-x-4">
                <p>Predictions Made:</p>
                <p>0</p>
            </div>
            <div className="flex justify-center items-center gap-x-4">
                <p>Predictions reported:</p>
                <p>0</p>
            </div>
        </div>  
    )
}

export default Dashboard;