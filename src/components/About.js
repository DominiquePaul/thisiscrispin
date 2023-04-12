import React from "react";
import Heading from "./Heading";

const About = () => {
    return (
    <div className="content">
        <Heading title="About me"/>
        <div className="section-text">
            <div className="corpus central">
                {/* <p>I started studying business and economics in St. Gallen. I'm quite extroverted which helped me start a <a className="bluelink" href="https://www.starthack.eu/">hackathon</a>, organise a <a className="bluelink" href="www.tedxhsg.com">TEDx conference</a> and start the university field hockey team with friends while I was there. I briefly worked as the first data science intern for On Running, BCG and Project A Ventures before working on year at the venture capital fund Lakestar between the investment team and building up the data science stack. <br></br><br></br>I returned to studying in 2020 for my master’s in statistics at ETH Zurich where I focussed largely on deep learning and applications of machine learning to biology and genetics. I briefly taught my own 4 ECTS course Data Science and Cloud Computing for Start-ups where I summarised my learnings of two years of data science. Since 2019 I am helping <a className="bluelink" href="www.sierraleonehockey.org">communities in Sierra Leone</a> to build field hockey as a sport in their country and have lived there for half a year in 2021.</p>   
                <br /> */}
                <p>&#127891; I studied business and economics at the University of St. Gallen. After working for two years I went to ETH Zurich for a master’s degree in statistics to focus on deep learning methods and applications of machine learning to genetics and medicine.</p>
                <br/>
                <p>👨🏻‍💻 I briefly worked for On Running, Boston Consulting Group and Project A Ventures before working one year at the venture capital fund Lakestar where I built the data science stack of the fund and carried out research on quantum computing. I concurrently also taught my own course at the University of St. Gallen ‘Data Science and Cloud Computing for Start-ups’.</p>
                <br/>
                <p>🏑 Since 2019 I have been helping <a className="bluelink" href="https://www.sierraleonehockey.org">communities in Freetown</a> to play field hockey and build a national league in Sierra Leone. In the course of the project I also lived in Sierra Leone for half a year in 2021. We built a hockey pitch that we had brought from Europe and now regularly organise training camps. If you’re interested in collaborating or joining for a training camp then <a href="mailto:dominique.c.a.paul@gmail.com" >please contact me</a>.</p>  
            </div>
        </div>
        
    </div>
    )
}
export default About 