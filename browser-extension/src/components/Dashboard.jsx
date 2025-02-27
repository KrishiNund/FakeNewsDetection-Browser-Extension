function Dashboard(){
    return(
        <div className="flex flex-col w-xs h-28 bg-[#415A77] items-center justify-center text-lg font-semibold text-[#E0E1DD]">
            <div className="flex justify-center items-center gap-x-4">
                <p>Total Assessments Made:</p>
                <p>0</p>
            </div>
            <div className="flex justify-center items-center gap-x-4">
                <p>Number of fake news detected:</p>
                <p>0</p>
            </div>
            <div className="flex justify-center items-center gap-x-4">
                <p>Incorrect Assessments Reported:</p>
                <p>0</p>
            </div>
        </div>  
    )
}

export default Dashboard;