import {Ban} from "lucide-react";

function UnsupportedPage(){
    return(
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <div className="bg-white p-6 shadow-md rounded-lg max-w-md text-center border border-red-300">
                <div className="flex items-center justify-center text-red-500">
                    <Ban className="w-8 h-8" />
                </div>
                <h2 className="text-lg font-semibold mt-2 text-red-700">
                    Unsupported Site
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                    This extension only works on Facebook Pages.
                </p>
            </div>
        </div>
    )
}

export default UnsupportedPage;