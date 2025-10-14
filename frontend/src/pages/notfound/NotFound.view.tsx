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
            navigate("https://umn.app", { replace: true })
        }
    }
    const [popup, setPopup] = useState(false)
    const openPopup = () => {
        setPopup(!popup)
    }

    // @ts-ignore
    return (
        <div className="pagewrapper flex flex-col items-center justify-center h-screen">
            <h1 className="text">404</h1>
            <h4 className="word">Page not found</h4>
            <div
                className="btn-wrapper hover:cursor-pointer"
                onClick={handleGoBack}
            >
                <Button>
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
                </Button>
            </div>

            <Button color="INFO" onClick={openPopup}>
                Report a Problem
            </Button>
            {popup && (
                <Modal
                    open={popup}
                    onClose={openPopup}
                    title="Report a Problem"
                    footer={<Button>Send</Button>}
                >
                    <h1 className="figtree text-3xl">Explain the Problem</h1>

                    {/*. | */}
                    {/* .|. */}
                    {/* input */}
                    <LabeledTextArea
                        value={problemContents}
                        onChange={(e) =>
                            setProblemContents(e.currentTarget.value)
                        }
                        text={"Describe the problem you're having."}
                        remark={`${problemContents.length}/1500`}
                        maxLength={charLimit}
                        disabled={problemContents.length > charLimit}
                    />
                </Modal>
            )}
        </div>
    )
}
