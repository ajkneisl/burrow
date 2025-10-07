import './NotFound.css'
import {useNavigate} from "react-router";

/**
 * Page not Found
 *
 * @author AJ Kneisl, Yordanos Eshete
 */
export default function NotFound() {
    const navigate = useNavigate();
    const handleGoBack = () => {
        if (window.history.length > 1) {
            navigate(-1);
        }
        else { navigate('/umn.app', { replace: true })
        }
    }

    return (
        <div className="fire">
            <h1 className="text">404</h1>
            <h4 className="word">Page not found</h4>
            <div className="btn-wrapper hover:cursor-pointer" onClick={handleGoBack}>

                <button className="back-btn" >Go Back</button>
            </div>
            <button className="btn">Report a Problem</button>
        </div>
    )
}
