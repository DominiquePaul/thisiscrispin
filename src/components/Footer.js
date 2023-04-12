import React from "react";
import "./Footer.css"

const Footer = () => {
    return (
        <div className="footer footer-gradient logos col h-100 d-flex align-items-center justify-content-center">
                <a href="https://github.com/dominiquePaul">Github</a>
                <a href="https://www.linkedin.com/in/dominique-paul/">LinkedIn</a>
                <a href="https://twitter.com/dominiquecapaul">Twitter</a>
                <a href="https://www.strava.com/athletes/36221013">Strava</a>
        </div>
    )
}

const Footer2 = () => {
    return (
        <footer className="footer-logos footer logos col align-items-center justify-content-center">
            <div className="align-items-center justify-content-center">
                <a href="https://github.com/dominiquePaul"><img src="./assets/logos/grey/github.png"></img></a>
                <a href="https://www.linkedin.com/in/dominique-paul/"><img src="./assets/logos/grey/linkedin.png"></img></a>
                <a href="https://twitter.com/dominiquecapaul"><img src="./assets/logos/grey/twitter.png"></img></a>
                <a href="https://www.strava.com/athletes/36221013"><img src="./assets/logos/grey/strava.png"></img></a>
            </div>
        </footer>
    )
}

// export default {Footer, sFooter};
export {Footer, Footer2};