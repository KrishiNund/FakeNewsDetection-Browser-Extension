import { useState, useEffect } from "react";
import {BarChart, CheckCircle, XCircle} from "lucide-react";

function Dashboard(){
    const [totalAssessments, setTotalAssessments] = useState(0);
    const [correctAssessments, setCorrectAssessments] = useState(0);
    const [incorrectAssessments,setIncorrectAssessments] = useState(0);

    useEffect(() => {
        chrome.storage.local.get(["total_assessments", "num_correct_assessments", "num_incorrect_assessments"], (data) => {
            setTotalAssessments(data.total_assessments || 0);
            setCorrectAssessments(data.num_correct_assessments || 0);
            setIncorrectAssessments(data.num_incorrect_assessments || 0);
        });

        chrome.storage.onChanged.addListener((changes) => {
            if(changes.total_assessments) setTotalAssessments(changes.total_assessments.newValue);
            if(changes.num_correct_assessments) setCorrectAssessments(changes.num_correct_assessments.newValue);
            if(changes.num_incorrect_assessments) setIncorrectAssessments(changes.num_incorrect_assessments.newValue);
        });
    }, []);

    return(
        <div className="p-6 bg-[#1B263B] text-[#E0E1DD] shadow-lg w-80">
            <h2 className="text-2xl font-bold text-center mb-4">📊 Dashboard</h2>
            <div className="space-y-4">
                <StatCard
                    icon={<BarChart size={20} />}
                    label="Total Assessments"
                    value={totalAssessments}
                />
                <StatCard
                    icon={<CheckCircle size={20} className="text-green-400" />}
                    label="Correct Assessments"
                    value={correctAssessments}
                />
                <StatCard
                    icon={<XCircle size={20} className="text-red-400" />}
                    label="Incorrect Assessments Reported"
                    value={incorrectAssessments}
                />
            </div>
        </div>
    );
}

function StatCard({icon, label, value}){
    return(
        <div className="flex items-center justify-between bg-[#2B3A55] p-3 rounded-xl shadow-md transition-transform duration-300 hover:scale-105">
            <div className="flex items-center space-x-2">
                {icon}
                <p className="text-sm">{label}</p>
            </div>
            <p className="text-lg font-bold">{value}</p>
        </div>
    )
}

export default Dashboard;