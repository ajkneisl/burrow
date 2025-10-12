import "./NotFound.css"
import { useNavigate } from "react-router"
import { useState } from "react"
import Button from "@components/Button.tsx"

export function NotFound() {
    const navigate = useNavigate()
    const handleGoBack = () => {
        if (window.history.length > 1) {
            navigate(-1)
        } else {
            navigate("https:/umn.app", { replace: true })
        }
    }
    const [popup, setPopup] = useState(false)
    const openPopup = () => {
        setPopup(!popup)
    }

    return (
        <div className="fire">
            <h1 className="text">404</h1>
            <h4 className="word">Page not found</h4>
            <div
                className="btn-wrapper hover:cursor-pointer"
                onClick={handleGoBack}
            >
                <button className="back-btn hover:cursor-pointer">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M19 12H5" />
                        <path d="M12 19L5 12L12 5" />
                    </svg>
                    Go Back
                </button>
            </div>

            <Button color="INFO" onClick={openPopup}>
                Report a Problem
            </Button>
            {popup && (
                <div className="card">
                    <div className="overlay"></div>
                    <div className="modal">
                        <div className="overlay">
                            <div className="md:min-w-[512px] min-w-screen modal-content bg-background p-6 flex flex-col justify-center gap-4">
                                <div className="flex flex-row justify-between">
                                    <h1 className="figtree text-3xl">
                                        Explain the Problem
                                    </h1>

                                    {/*close button*/}
                                    <Button
                                        color="ERROR"
                                        onClick={openPopup}
                                        thin
                                    >
                                        <svg
                                            width="48"
                                            height="48"
                                            viewBox="0 0 100 100"
                                            xmlns="http://www.w3.org/2000/svg"
                                            aria-label="Close"
                                        >
                                            <line
                                                x1="30"
                                                y1="30"
                                                x2="70"
                                                y2="70"
                                                stroke="white"
                                                stroke-width="10"
                                                stroke-linecap="round"
                                            />
                                            <line
                                                x1="70"
                                                y1="30"
                                                x2="30"
                                                y2="70"
                                                stroke="white"
                                                stroke-width="10"
                                                stroke-linecap="round"
                                            />
                                        </svg>
                                    </Button>
                                </div>

                                {/*. | */}
                                {/* .|. */}
                                {/* input */}
                                <LabeledTextArea
                                    value={problemContents}
                                    onChange={(e) =>
                                        setProblemContents(
                                            e.currentTarget.value
                                        )
                                    }
                                    text={"Describe the problem you're having."}
                                    remark={`${problemContents.length}/1500`}
                                    maxLength={charLimit}
                                    disabled={
                                        problemContents.length > charLimit
                                    }
                                />
                                <Button >Send</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
