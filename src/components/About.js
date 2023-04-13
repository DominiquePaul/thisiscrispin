import React from "react";
import Heading from "./Heading";

const About = () => {
    return (
    <div className="content">
        <Heading title="About me"/>
        <div className="section-text">
            <div className="corpus central pb-10 text-base">
                <article>
                    <p>&#127891; I studied business and economics at the University of St. Gallen finishing as one of the best in class. After working for two years I went to ETH Zurich for a master’s degree in statistics to focus on deep learning methods and applications of machine learning to genetics and medicine, kindly supported by a scholarship of the German National Academic Foundation (Deutsche Studienstiftung).</p>
                    <br/>
                    <p>👨🏻‍💻 I worked for On Running, Boston Consulting Group and Project A Ventures before working one year at Lakestar where I built the data science stack of the fund and carried out research on quantum computing start-ups. After holding guest lectures I was also offered a position as lecturer at the university of St. Gallen. For two academic years I taught the course ‘Data Science and Cloud Computing for Start-ups’.</p>
                    <br/>
                    <p>🏑 Since 2019 I have been helping <a className="bluelink" href="https://www.sierraleonehockey.org">communities in Freetown</a> to play field hockey and build a national league in Sierra Leone. In the course of the project I also lived in Sierra Leone for half a year in 2021. We built a hockey pitch that we had brought from Europe and now regularly organise training camps. If you’re interested in collaborating or joining for a training camp then <a href="mailto:dominique.c.a.paul@gmail.com" >please contact me</a>.</p>  
                </article>
            </div>
        </div>
        
    </div>
    )
}
export default About 