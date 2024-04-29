import React, { useRef, useEffect } from 'react';
import ReactGA from 'react-ga4';


const Home = () => {
    const handleButtonClick = (action, label) => {
        ReactGA.event({
          category: 'User',
          action: action,
          label: label
        });
      };

      const imageRef = React.useRef(null);
      const shiftedBoxRef = React.useRef(null);
  
      const positionImage = () => {
          if (imageRef.current && shiftedBoxRef.current) {
              const imageHeight = imageRef.current.offsetHeight;
              const shiftedBoxPosition = shiftedBoxRef.current.offsetTop;
              imageRef.current.style.top = `${shiftedBoxPosition - imageHeight}px`;
          }
      };
  
      React.useEffect(() => {
          if (imageRef.current.complete) {
              positionImage(); // Position immediately if image is already loaded
          } else {
              imageRef.current.onload = positionImage; // Set position after image loads
          }
      }, []);

    return (
        <div className="section">            
            <div className="home">
                <div className="headingshome">
                    <h4>thisiscrispin</h4>
                    <h1 className="pb-2">Dominique Paul</h1>
                </div>
                <img ref={imageRef} src="./assets/profile.png" alt="Profile of dominique" className="top-image"/>
                <div ref={shiftedBoxRef} className="shiftedbox shadedbox">
                    <div className="biotext">
                        <article>
                            <p>I'm a product builder, computer scientist and statistician interested in how we can design intelligent systems (computers) so that not-so-intelligent systems (us humans) can use them. I've done research on statistical methods and machine learning for genomics at ETH Zurich and <a href="https://openreview.net/forum?id=IbiiNw4oRj" >published work on tabular foundation models at NeurIPS</a>. Currently, I'm building AI products as a freelancer with <a href="https://www.palta-labs.com/" rel="noopener noreferrer" target="_blank" onClick={() => handleButtonClick("Clicked", "palta-labs-link")}>Palta Labs</a>. You can follow what I'm up to by subscribing to my <a href="https://thisiscrispin.substack.com/" target="_blank" rel="noopener noreferrer" onClick={() => handleButtonClick("Clicked", "introductory-substack-link")}>Substack newsletter</a>.</p>
                        </article>
                    </div>
                </div>
                <div className='shiftedbox'>
                    <div className="subbox row">

                        <div className="d-flex firstLinks col justify-content-lg-start justify-content-sm-between">
                            <p><a href="/about" onClick={() => handleButtonClick("Clicked", "/about")}>About</a></p> 
                            <p>·</p>
                            <p><a href="/freelance" onClick={() => handleButtonClick("Clicked", "/freelance")}>Freelance</a></p> 
                        </div> 

                        <div className="d-flex logos col justify-content-lg-end justify-content-sm-between">
                            <a href="https://thisiscrispin.substack.com"  onClick={() => handleButtonClick("Clicked", "substack-link")} target="_blank" rel="noopener noreferrer"><img alt="substack icon" src="./assets/logos/grey/substack.png"></img></a>
                            <a href="https://github.com/dominiquePaul"  onClick={() => handleButtonClick("Clicked", "github-link")} target="_blank" rel="noopener noreferrer"><img alt="github icon" src="./assets/logos/grey/github.png"></img></a>
                            <a href="https://www.linkedin.com/in/dominique-paul/"  onClick={() => handleButtonClick("Clicked", "linkedin-link")} target="_blank" rel="noopener noreferrer"><img alt="linkedin icon" src="./assets/logos/grey/linkedin.png"></img></a>
                            <a href="https://twitter.com/dominiquecapaul"  onClick={() => handleButtonClick("Clicked", "twitter-link")} target="_blank" rel="noopener noreferrer"><img alt="twitter icon" src="./assets/logos/grey/twitter.png"></img></a>
                            <a href="https://www.strava.com/athletes/36221013"  onClick={() => handleButtonClick("Clicked", "strava-link")} target="_blank" rel="noopener noreferrer nofollow"><img alt="strava icon" src="./assets/logos/grey/strava.png"></img></a>
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
