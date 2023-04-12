import React from "react";
import Heading from "./Heading";

const Freelance = () => {
    return (
        <div className="content">
            <Heading title="Freelance"/>
            <div className="section-text">
                <div className="corpus central pb-10 text-base">
                    <p>I can help you with statistics and machine learning questions as well as the development and deployment of machine learning models for your company. <br/><br/>

                        Here are three anonymised samples of problems I have previously worked on with clients, to give you an idea of what I do:
                    </p>
                    <br/>

                    <ul className="space-y-1 list-disc list-inside -indent-5 pl-10">
                        <li>Develop, train and deploy a neural network to identify the coordinates of rooftops from satellite images and calculate the available surface for solar panels. Used by the client to identify new sales targets in Australia.&#9728;&#65039;</li>
                        <li>Created a summary of statistical methods to quantify uncertainty in a carbon accounting graph. This enabled the startup to implement a minimum requirements and plan product development. &#128104;&#127995;&#8205;&#128300;</li>
                        <li>Build a web interface to a machine learning model. This enabled the start-up to launch the alpha version of their ML product to first users ahead of the official launch. &#129302;</li>
                    </ul>
                    <br/>
                    <p>You can reach out to me with inquiries, questions or ideas via <a href="mailto:dominique.c.a.paul@gmail.com">dominique.c.a.paul@gmail.com</a></p>
                </div>
            </div>
        </div>
    )
}

export default Freelance