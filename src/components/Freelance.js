import React from "react";
import Heading from "./Heading";

const Freelance = () => {
    return (
        <div className="content">
            <Heading title="Freelance"/>
            <div className="section-text">
                <div className="corpus central">
                <p>I can help you with statistics and machine learning questions as well as the development and deployment of machine learning models for your company. <br/><br/>

                    Here are three anonymised samples of problems I have previously worked on with clients, to give you an idea of what I do:
                    <br/>
                    <br/>

                    <ul>
                        <li>Can you develop a neural network that can identify the coordinates of rooftops from satellite images and calculate the available surface for solar panels?</li>
                        <li>We have data following different families of distributions. We are currently using method X to calculate attributes Y and Z from these. Is this correct? What is the best way we could do this?</li>
                        <li>Can you build an interface for our machine learning model so that we launch our product for our first customers until our developer releases the full version next month?</li>
                    </ul>

                    {/* <br/> */}
                    You can reach out to me with inquiries, questions or ideas via <a href="mailto:dominique.c.a.paul@gmail.com">dominique.c.a.paul@gmail.com</a>.</p>
                </div>
            </div>
        </div>
    )
}

export default Freelance