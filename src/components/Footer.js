import React from "react";
import ReactGA from 'react-ga4'; // Import ReactGA from react-ga4

export default class Footer extends React.Component {
    // Define a method to handle GA events similar to Home.js
    handleLinkClick = (action, label) => {
        ReactGA.event({
            category: 'User',
            action: action,
            label: label
        });
    };

    render() {
        return(
            <footer className="footer-gradient logos fixed bottom-0 left-0 z-20 w-full h-16 p-4 bg-white border-t border-gray-200 shadow md:flex md:items-center md:justify-between md:p-6 dark:bg-gray-800 dark:border-gray-600">
                <span className="text-sm text-gray-800 sm:text-center dark:text-gray-400">© 2024 <a href="/" className="hover:underline">Dominique Paul</a>. All Rights Reserved.</span>
                <ul className="flex flex-wrap items-center text-sm text-gray-800 dark:text-gray-400 sm:mt-0">
                    <li>
                        <a className="mr-4 hover:underline md:mr-6"  target="_blank" rel="noopener noreferrer" href="https://thisiscrispin.substack.com" onClick={() => this.handleLinkClick("Clicked", "substack-link-footer")}>Substack</a>
                    </li>
                    <li>
                        <a className="mr-4 hover:underline md:mr-6" target="_blank" rel="noopener noreferrer" href="https://github.com/dominiquePaul" onClick={() => this.handleLinkClick("Clicked", "github-link-footer")}>Github</a>
                    </li>
                    <li>
                        <a className="mr-4 hover:underline md:mr-6" target="_blank" rel="noopener noreferrer" href="https://www.linkedin.com/in/dominique-paul/" onClick={() => this.handleLinkClick("Clicked", "linkedin-link-footer")}>LinkedIn</a>
                    </li>
                    <li>
                        <a className="mr-4 hover:underline md:mr-6" target="_blank" rel="noopener noreferrer" href="https://twitter.com/dominiquecapaul" onClick={() => this.handleLinkClick("Clicked", "twitter-link-footer")}>Twitter</a>
                    </li>
                    <li>
                        <a className="hover:underline" target="_blank" rel="noopener noreferrer" href="https://www.strava.com/athletes/36221013" onClick={() => this.handleLinkClick("Clicked", "strava-link-footer")}>Strava</a>
                    </li>
                </ul>
            </footer>
        )
    }
}