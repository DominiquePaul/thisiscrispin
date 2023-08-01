
import React from 'react';
import "./Home.css"
import useGATracker from './useGATracker';

const Home = () => {
    const gaEventTracker = useGATracker("Homepage");

    return (
        <div className="section">            
            <div className="home">
                <h4>thisiscrispin</h4>
                <h1 className="pb-2">Dominique Paul</h1>
                <div className="shiftedbox shadedbox">
                    <div className="biotext">
                        <article>
                            <p>I'm a product builder, computer scientist and statistician with an interest in how we interact with algorithms and how we can design intelligent systems (computers) so that not-so-intelligent systems (us humans) can use them. I've done research on statistical methods and machine learning for genomics at ETH Zurich. Currently, I'm working on foundation models for tabular data at <a href="https://en.merantix-momentum.com/">Merantix Momentum</a>. You can follow what I'm up to by subscribing to my <a href="https://thisiscrispin.substack.com/" target="_blank" rel="noopener noreferrer" onClick={gaEventTracker("Clicked", "introductory-substack-link")} >substack newsletter</a>.</p>
                        </article>
                    </div>
                </div>
                <div className='shiftedbox'>
                    <div className="subbox row">

                        <div className="d-flex firstLinks col justify-content-lg-start justify-content-sm-between">
                            <p><a href="/about" onClick={gaEventTracker("Clicked", "/about")}>About</a></p> 
                            <p>·</p>
                            <p><a href="/freelance" onClick={gaEventTracker("Clicked", "/freelance")}>Freelance</a></p> 
                        </div> 

                        <div className="d-flex logos col justify-content-lg-end justify-content-sm-between">
                            <a href="https://thisiscrispin.substack.com"  onClick={gaEventTracker("Clicked", "substack-link")} target="_blank" rel="noopener noreferrer"><img alt="substack icon" src="./assets/logos/grey/substack.png"></img></a>
                            <a href="https://github.com/dominiquePaul"  onClick={gaEventTracker("Clicked", "github-link")} target="_blank" rel="noopener noreferrer"><img alt="github icon" src="./assets/logos/grey/github.png"></img></a>
                            <a href="https://www.linkedin.com/in/dominique-paul/"  onClick={gaEventTracker("Clicked", "linkedin-link")} target="_blank" rel="noopener noreferrer"><img alt="linkedin icon" src="./assets/logos/grey/linkedin.png"></img></a>
                            <a href="https://twitter.com/dominiquecapaul"  onClick={gaEventTracker("Clicked", "twitter-link")} target="_blank" rel="noopener noreferrer"><img alt="twitter icon" src="./assets/logos/grey/twitter.png"></img></a>
                            <a href="https://www.strava.com/athletes/36221013"  onClick={gaEventTracker("Clicked", "strava-link")} target="_blank" rel="noopener noreferrer"><img alt="strava icon" src="./assets/logos/grey/strava.png"></img></a>
                        </div>

                    </div>
                </div>
            </div>
        {/* <div className="section">
            <Projects/>
        </div>
        <div className="section">
            <Writing/>
        </div> */}
        </div>
        
    );
}
 
export default Home;
