
import React from 'react';
import "./Home.css"

const Home = () => {

    return (
        <div className="section">            
            <div className="home">
                <h4>thisiscrispin</h4>
                <h1>Dominique Paul</h1>
                <div className="shiftedbox shadedbox">
                    <div className="biotext">
                        <p>I'm a statistician with a strong interest in how we interact with algorithms and how we can create value by designing intelligent systems (computers) so that not-so-intelligent systems (us humans) can use them. I've done research on statistical methods and machine learning for genomics at ETH Zurich. Currently, I'm working on large language models and their applications in educational systems.</p>
                    </div>
                </div>
                <div className='shiftedbox'>
                    <div className="subbox row">

                        <div className="d-flex firstLinks col justify-content-lg-start justify-content-sm-between">
                            <p><a href="/about">About</a></p> 
                            <p>·</p>
                            <p><a href="/freelance">Freelance</a></p> 
                            
                            {/* · <a href="/posts">Posts</a> */}
                        </div> 

                        <div className="d-flex logos col justify-content-lg-end justify-content-sm-between">
                            <a href="https://github.com/dominiquePaul"><img alt="github icon" src="./assets/logos/grey/github.png"></img></a>
                            <a href="https://www.linkedin.com/in/dominique-paul/"><img alt="linkedin icon" src="./assets/logos/grey/linkedin.png"></img></a>
                            <a href="https://twitter.com/dominiquecapaul"><img alt="twitter icon" src="./assets/logos/grey/twitter.png"></img></a>
                            <a href="https://www.strava.com/athletes/36221013"><img alt="strava icon" src="./assets/logos/grey/strava.png"></img></a>
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