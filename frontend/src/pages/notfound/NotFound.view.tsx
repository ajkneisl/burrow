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
                                <div className="modal-content"></div>
                                <Button
                                    color="ERROR"
                                    onClick={openPopup}
                                >
                                    CLOSE
                                </Button>
                            </div>
                        </div>
                    </div>
            )}
        </div>
    )
}
